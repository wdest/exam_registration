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

    // 2. Service Role (RLS-i aşmaq üçün)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    
    // Front-end bizə bunları göndərir:
    // data: Excel faylı
    // pointsPerQuestion: Bir sualın balı
    // examName: Dropdown-dan seçilən sınaq adı (Məs: "Almaniya") <--- YENİ
    const { data: rawExcelData, pointsPerQuestion, examName } = body; 

    // Əgər admin ad seçməyibsə, Excel-dəkini götürürük, o da yoxdursa "Test" yazırıq
    const selectedQuizName = examName ? examName : null;

    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;

    if (!rawExcelData || !Array.isArray(rawExcelData)) {
        return NextResponse.json({ error: "Məlumat yoxdur" }, { status: 400 });
    }

    // --- A. Data Mapping ---
    const preparedData = rawExcelData
      .filter((item: any) => item['ZipGrade ID'])
      .map((item: any) => {
        const correct = Number(item['Num Correct']) || 0;
        const questions = Number(item['Num Questions']) || 0;
        
        // Excel-dəki adı yox, Adminin seçdiyi adı istifadə edirik
        const finalQuizName = selectedQuizName || item['Quiz Name'] || "Test";

        return {
            student_id: String(item['ZipGrade ID']).trim(),
            quiz: finalQuizName, // <--- ARTIQ SEÇDİYİN AD OLACAQ
            correct_count: correct,
            wrong_count: questions - correct,
            score: correct * multiplier,
            total: questions * multiplier,
            percent: Number(item['Percent Correct']) || 0
            // id: Göndərmirik, baza özü gen_random_uuid() ilə yaradacaq
        };
      });

    // --- B. Şagirdlərin Bazada Olub-olmadığını Yoxlayırıq ---
    const studentIds = preparedData.map((d: any) => d.student_id);
    const { data: foundStudents, error: findError } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', studentIds);

    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });

    const validIds = new Set(foundStudents?.map(s => s.exam_id));
    
    // Yalnız bazada olan şagirdləri saxlayırıq
    const finalData = preparedData.filter((d: any) => validIds.has(d.student_id));

    if (finalData.length === 0) {
        return NextResponse.json({ success: false, message: "Şagirdlər bazada tapılmadı." });
    }

    // --- C. BAZAYA YAZMAQ ---
    const { data: insertedData, error: insertError } = await supabase
      .from("results")
      .upsert(finalData, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
        console.error("YAZMA XƏTASI:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: finalData.length,
        message: `Yükləndi: ${finalData.length} nəfər. Sınaq: ${selectedQuizName}` 
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
