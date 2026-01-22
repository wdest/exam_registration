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

    // 2. Service Role Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
        return NextResponse.json({ error: "Məlumat formatı yanlışdır." }, { status: 400 });
    }

    // --- A. DUBLİKATLARI SİLİRİK (Əvvəlki kod) ---
    const uniqueDataMap = new Map();
    data.forEach((item) => {
        const uniqueKey = `${item.student_id}-${item.quiz}`;
        uniqueDataMap.set(uniqueKey, item);
    });
    const cleanedData = Array.from(uniqueDataMap.values());


    // --- B. YENİ HİSSƏ: BAZADA OLMAYANLARI SİLİRİK (FILTER) ---
    
    // 1. Excel-dən gələn bütün ID-ləri yığırıq
    const incomingStudentIds = cleanedData.map(item => item.student_id);

    // 2. Bazadan soruşuruq: "Bu ID-lərdən hansılar səndə var?"
    // DİQQƏT: 'exam_id' sənin students cədvəlindəki şagird nömrəsidir
    const { data: existingStudents, error: searchError } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', incomingStudentIds);

    if (searchError) throw searchError;

    // 3. Tapılan ID-ləri bir siyahıya (Set) yığırıq ki, tez yoxlaya bilək
    // (Məsələn: [101, 102, 105] tapıldı)
    const allowedIds = new Set(existingStudents?.map(s => s.exam_id));

    // 4. Yalnız icazəli olanları saxlayırıq
    const finalDataToInsert = cleanedData.filter(item => allowedIds.has(item.student_id));

    console.log(`Gələn: ${data.length}, Dublikatsız: ${cleanedData.length}, Bazada Olan: ${finalDataToInsert.length}`);

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: "Heç bir nəticə yüklənmədi. Excel-dəki şagird ID-ləri bazada tapılmadı." 
        });
    }

    // 3. Bazaya yazırıq (Upsert)
    const { error } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { onConflict: "student_id,quiz" });

    if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
    }

    // Mesajda neçəsinin yükləndiyini, neçəsinin silindiyini deyirik
    const skippedCount = cleanedData.length - finalDataToInsert.length;
    
    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length, 
        message: `Uğurla yükləndi: ${finalDataToInsert.length} nəfər. (Bazada olmayan ${skippedCount} nəfər silindi)` 
    });

  } catch (e: any) {
    console.error("API Xətası:", e.message);
    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
