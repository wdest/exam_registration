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
    
    // Front-end'dən gələn datalar:
    // data: Excelin içindəki sətirlər
    // pointsPerQuestion: Müəllimin daxil etdiyi sual balı (Input)
    const { data: rawExcelData, pointsPerQuestion } = body; 

    // Əgər sual balı gəlməyibsə, default 4 götürürük
    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;

    if (!rawExcelData || !Array.isArray(rawExcelData)) {
        return NextResponse.json({ error: "Məlumat formatı yanlışdır." }, { status: 400 });
    }

    // --- A. DATA MAPPING (SƏNİN CƏDVƏLƏ UYĞUN) ---
    const formattedData = rawExcelData
      .filter((item: any) => item['ZipGrade ID']) // ID-si boş olanları atırıq
      .map((item: any) => {
        
        // Exceldən rəqəmləri oxuyuruq
        const correctCount = Number(item['Num Correc']) || 0; // Düzgün sayı
        const questionCount = Number(item['Num Questi']) || 0; // Ümumi sual sayı
        const excelPercent = Number(item['Percent Cor']) || 0; // Faiz

        // Hesablamalar
        const calculatedScore = correctCount * multiplier;       // BAL (Score)
        const maxTotalScore = questionCount * multiplier;        // MAKSİMUM BAL (Total)
        const wrongCount = questionCount - correctCount;         // SƏHV SAYI

        return {
            // Şəkildəki 'student_id' (text)
            student_id: String(item['ZipGrade ID']), 
            
            // Şəkildəki 'quiz' (text)
            quiz: item['Quiz Name'],
            
            // Şəkildəki 'correct_count' (int4)
            correct_count: correctCount,
            
            // Şəkildəki 'wrong_count' (int4)
            wrong_count: wrongCount,
            
            // Şəkildəki 'score' (int4) -> Hesabladığımız bal
            score: calculatedScore,
            
            // Şəkildəki 'total' (int4) -> Maksimum mümkün bal
            total: maxTotalScore,
            
            // Şəkildəki 'percent' (numeric) -> Exceldəki faiz
            percent: excelPercent 
        };
      });

    // --- B. DUBLİKATLARI TƏMİZLƏMƏK ---
    // Eyni şagirdin eyni sınaq nəticəsi təkrarlanmasın
    const uniqueDataMap = new Map();
    formattedData.forEach((item: any) => {
        const uniqueKey = `${item.student_id}-${item.quiz}`;
        uniqueDataMap.set(uniqueKey, item);
    });
    const cleanedData = Array.from(uniqueDataMap.values());

    // --- C. BAZADA OLMAYAN ŞAGİRDLƏRİ SİLMƏK ---
    // Yalnız 'students' cədvəlində qeydiyyatda olanları saxlayırıq
    const incomingStudentIds = cleanedData.map((item: any) => item.student_id);
    
    const { data: existingStudents, error: searchError } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', incomingStudentIds);

    if (searchError) throw searchError;

    const allowedIds = new Set(existingStudents?.map(s => s.exam_id));
    
    // Filterləmə
    const finalDataToInsert = cleanedData.filter((item: any) => allowedIds.has(item.student_id));

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: "Yüklənən faylda bazada mövcud olan heç bir şagird ID-si tapılmadı." 
        });
    }

    // --- D. BAZAYA YAZMAQ (Upsert) ---
    // 'results' cədvəlinə yazırıq
    const { error } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { onConflict: "student_id,quiz" });

    if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
    }

    // --- E. STATİSTİKA VƏ CAVAB ---
    const skippedCount = cleanedData.length - finalDataToInsert.length;
    
    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length, 
        message: `Əla! ${finalDataToInsert.length} nəfərin nəticəsi yükləndi. (Sual dəyəri: ${multiplier} bal)` 
    });

  } catch (e: any) {
    console.error("API Xətası:", e.message);
    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
