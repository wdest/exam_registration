import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, examName } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, message: "Məlumat tapılmadı" }, { status: 400 });
    }

    if (!examName) {
      return NextResponse.json({ success: false, message: "İmtahan adı seçilməyib" }, { status: 400 });
    }

    // 1. Bazadan ID-ləri çəkirik (Validasiya üçün)
    const { data: registeredStudents } = await supabase.from("students").select("exam_id");
    const { data: localStudents } = await supabase.from("local_students").select("student_code");

    const validStudentIds = new Set();
    registeredStudents?.forEach((s: any) => { if (s.exam_id) validStudentIds.add(String(s.exam_id).trim()); });
    localStudents?.forEach((s: any) => { if (s.student_code) validStudentIds.add(String(s.student_code).trim()); });

    let ignoredCount = 0;

    // 2. Excel məlumatlarını emal edirik
    const formattedData = data.map((row: any) => {
      
      // A. Ümumi məlumatlar
      const correct = Number(row["Num Correct"]) || 0;
      const totalQuestions = Number(row["Num Questions"]) || 0; // Sual sayı Excel-dən gəlir
      const wrong = totalQuestions - correct;

      let calculatedScore = (correct * 4) - (wrong * 1);
      if (calculatedScore < 0) calculatedScore = 0;

      let percent = 0;
      if (row["Percent Correct"]) {
          percent = Number(row["Percent Correct"]);
          if (percent <= 1) percent = percent * 100;
      } else {
          const maxScore = totalQuestions * 4;
          percent = maxScore > 0 ? (calculatedScore / maxScore) * 100 : 0;
      }

      // B. 🔥 DETALLI SUAL ANALİZİ (Stu1, Stu2... oxumaq)
      const questionDetails = [];
      let qIndex = 1;

      // Nə qədər ki, "Stu1", "Stu2" və s. var, dövr davam edir (Limit yoxdur)
      while (row[`Stu${qIndex}`] !== undefined) {
        const studentAnswer = row[`Stu${qIndex}`] || ""; // Şagirdin yazdığı (A, B...)
        const correctAnswer = row[`PriKey${qIndex}`] || ""; // Doğru cavab (A, B...)
        const points = Number(row[`Points${qIndex}`]) || 0; // Qazandığı bal (1 və ya 0)

        // Əgər bal > 0-dırsa düzdür, yoxsa səhvdir
        const isCorrect = points > 0;

        questionDetails.push({
          q: qIndex,              // Sual nömrəsi
          user: studentAnswer,    // Şagirdin cavabı
          correct: correctAnswer, // Doğru cavab
          isCorrect: isCorrect    // Nəticə (true/false)
        });

        qIndex++;
      }

      return {
        student_id: String(row["ZipGrade ID"] || row["External Id"] || "").trim(),
        quiz: examName,
        score: calculatedScore, 
        total: totalQuestions,
        percent: parseFloat(percent.toFixed(2)),
        details: questionDetails // 🔥 Bura yeni JSON datanı qoyuruq
      };
    }).filter(item => {
      if (!item.student_id) return false;
      if (validStudentIds.has(item.student_id)) {
        return true;
      } else {
        ignoredCount++; 
        return false;
      }
    });

    if (formattedData.length === 0) {
       return NextResponse.json({ 
         success: false, 
         message: "Faylda uyğun şagird tapılmadı." 
       }, { status: 400 });
    }

    // 3. Bazaya yazırıq
    const { error } = await supabase.from("results").insert(formattedData);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      processed_count: formattedData.length,
      ignored_count: ignoredCount,
      message: "Uğurla yükləndi" 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
