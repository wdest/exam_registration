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

    // 1. Validasiya: Bazadan ID-ləri çəkirik
    const { data: registeredStudents } = await supabase.from("students").select("exam_id");
    const { data: localStudents } = await supabase.from("local_students").select("student_code");

    const validStudentIds = new Set();
    registeredStudents?.forEach((s: any) => { if (s.exam_id) validStudentIds.add(String(s.exam_id).trim()); });
    localStudents?.forEach((s: any) => { if (s.student_code) validStudentIds.add(String(s.student_code).trim()); });

    let ignoredCount = 0;

    // 2. Excel məlumatlarını emal edirik
    const formattedData = data.map((row: any) => {
      
      // B. DETALLI SUAL ANALİZİ VƏ HESABLAMA
      const questionDetails = [];
      let qIndex = 1;
      let calculatedCorrectCount = 0;
      let calculatedTotalQuestions = 0;

      while (row[`Stu${qIndex}`] !== undefined) {
        const studentAnswer = String(row[`Stu${qIndex}`] || "").trim(); 
        const correctAnswer = String(row[`PriKey${qIndex}`] || "").trim(); 
        // Bəzən Points sütunu olmur, ona görə cavabları yoxlayırıq
        const pointsFromExcel = Number(row[`Points${qIndex}`]);
        
        let isCorrect = false;
        
        // Dəqiq yoxlama: Ya Excel xalı > 0, ya da cavablar eynidir
        if (!isNaN(pointsFromExcel) && pointsFromExcel > 0) {
            isCorrect = true;
        } else if (studentAnswer && correctAnswer && studentAnswer === correctAnswer) {
            isCorrect = true;
        }

        if (isCorrect) calculatedCorrectCount++;
        calculatedTotalQuestions++;

        questionDetails.push({
          q: qIndex,
          user: studentAnswer,
          correct: correctAnswer,
          isCorrect: isCorrect
        });

        qIndex++;
      }

      // A. Ümumi məlumatlar (Excel-də varsa ordan, yoxsa hesabladığımızdan)
      let correct = Number(row["Num Correct"]);
      if (isNaN(correct) || correct === 0) correct = calculatedCorrectCount;

      let totalQuestions = Number(row["Num Questions"]);
      if (isNaN(totalQuestions) || totalQuestions === 0) totalQuestions = calculatedTotalQuestions;
      
      // Səhv sayı
      const wrong = totalQuestions - correct;

      // Bal düsturu: (Düz * 4) - (Səhv * 1)
      let calculatedScore = (correct * 4) - (wrong * 1);
      if (calculatedScore < 0) calculatedScore = 0;

      // Faiz hesablama
      let percent = 0;
      if (row["Percent Correct"]) {
          percent = Number(row["Percent Correct"]);
          if (percent <= 1) percent = percent * 100;
      } else {
          const maxScore = totalQuestions * 4;
          percent = maxScore > 0 ? (calculatedScore / maxScore) * 100 : 0;
      }

      // Sənin Excel başlıqlarını da bura əlavə edirik
      const rowId = row["ZipGrade ID"] || row["External Id"] || row["StudentID"] || row["CustomID"] || "";

      return {
        student_id: String(rowId).trim(),
        quiz: examName,
        score: calculatedScore, 
        correct_count: correct, // 🔥 Bu sütunu da əlavə edirəm ki, "Doğru Cavablar" düz çıxsın
        total: totalQuestions,
        percent: parseFloat(percent.toFixed(2)),
        details: questionDetails
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
         message: `Faylda uyğun şagird tapılmadı.` 
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
