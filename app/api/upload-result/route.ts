import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });
    }

    // 2. Supabase Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    
    // Front-end'dən gələn parametrlər
    const { data: rawExcelData, pointsPerQuestion } = body; 

    // Sualın balı (default olaraq 4 bal)
    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;

    if (!rawExcelData || !Array.isArray(rawExcelData)) {
        return NextResponse.json({ error: "Məlumat formatı yanlışdır." }, { status: 400 });
    }

    // --- A. DATA MAPPING (DÜZƏLİŞ EDİLDİ) ---
    // Şəkildəki sütun adlarına (Num Correct, Num Questions) uyğunlaşdırıldı
    const formattedData = rawExcelData
      .filter((item: any) => item['ZipGrade ID']) // ID-si olmayan boş sətirləri atırıq
      .map((item: any) => {
        
        // Şəkildəki DƏQİQ adlar:
        const correctCount = Number(item['Num Correct']) || 0;     // Əvvəl 'Num Correc' idi -> Düzəldildi
        const questionCount = Number(item['Num Questions']) || 0;  // Əvvəl 'Num Questi' idi -> Düzəldildi
        const excelPercent = Number(item['Percent Correct']) || 0; // Əvvəl 'Percent Cor' idi -> Düzəldildi

        // Şagird ID-sini təmizləyirik (boşluqları silirik)
        const studentId = String(item['ZipGrade ID']).trim();

        // Hesablamalar
        const calculatedScore = correctCount * multiplier;       // BAL
        const maxTotalScore = questionCount * multiplier;        // MAKS BAL
        const wrongCount = questionCount - correctCount;         // SƏHV SAYI

        return {
            student_id: studentId,
            quiz: item['Quiz Name'] || "Adsız Sınaq",
            
            // Hesablanmış və oxunmuş dəyərlər
            correct_count: correctCount,
            wrong_count: wrongCount,
            score: calculatedScore,
            total: maxTotalScore,
            percent: excelPercent 
        };
      });

    console.log(`Excel-dən oxunan sətir sayı: ${formattedData.length}`);

    // --- B. DUBLİKATLARI TƏMİZLƏMƏK ---
    const uniqueDataMap = new Map();
    formattedData.forEach((item: any) => {
        const uniqueKey = `${item.student_id}-${item.quiz}`;
        uniqueDataMap.set(uniqueKey, item);
    });
    const cleanedData = Array.from(uniqueDataMap.values());

    // --- C. BAZADA OLMAYAN ŞAGİRDLƏRİ SİLMƏK ---
    // Əgər şagird "students" cədvəlində yoxdursa, nəticəsi yazıla bilməz (Foreign Key xətası verməməsi üçün)
    const incomingStudentIds = cleanedData.map((item: any) => item.student_id);
    
    const { data: existingStudents, error: searchError } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', incomingStudentIds);

    if (searchError) {
        console.error("Şagird axtarışında xəta:", searchError);
        throw searchError;
    }

    // Tapılan ID-ləri siyahıya yığırıq
    const allowedIds = new Set(existingStudents?.map(s => s.exam_id));
    
    // Filterləmə
    const finalDataToInsert = cleanedData.filter((item: any) => allowedIds.has(item.student_id));

    console.log(`Bazada tapılan və yüklənəcək şagird sayı: ${finalDataToInsert.length}`);

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: "Yüklənən fayldakı şagird ID-ləri bazada tapılmadı. Zəhmət olmasa əvvəlcə şagirdləri əlavə edin." 
        });
    }

    // --- D. BAZAYA YAZMAQ (Upsert) ---
    const { error } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { onConflict: "student_id,quiz" });

    if (error) {
        console.error("Supabase Yazma Xətası:", error);
        throw new Error(error.message);
    }

    // --- E. CAVAB ---
    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length, 
        message: `Uğurlu! ${finalDataToInsert.length} nəfərin nəticəsi yükləndi.` 
    });

  } catch (e: any) {
    console.error("API Ümumi Xətası:", e.message);
    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
