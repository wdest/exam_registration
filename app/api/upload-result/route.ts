import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Supabase Client yaradılır
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

    // --- 🔥 DƏYİŞİKLİK BURDADIR ---
    // 1. Həm 'students', həm də 'local_students' cədvəlindən ID-ləri çəkirik
    
    // A. Registrasiya olunmuş tələbələr (students)
    const { data: registeredStudents, error: regError } = await supabase
      .from("students")
      .select("exam_id");

    // B. Bütün yerli tələbələr (local_students)
    const { data: localStudents, error: locError } = await supabase
      .from("local_students")
      .select("student_code");

    if (regError || locError) {
      return NextResponse.json({ success: false, error: "Tələbə bazası oxuna bilmədi." }, { status: 500 });
    }

    // 2. ID-ləri vahid bir siyahıya (Set) yığırıq ki, təkrarlanma olmasın
    const validStudentIds = new Set();

    // Students cədvəlindən gələnləri əlavə edirik
    registeredStudents?.forEach((s: any) => {
        if (s.exam_id) validStudentIds.add(String(s.exam_id).trim());
    });

    // Local_students cədvəlindən gələnləri əlavə edirik
    localStudents?.forEach((s: any) => {
        if (s.student_code) validStudentIds.add(String(s.student_code).trim());
    });

    console.log(`Cəmi ${validStudentIds.size} unikal şagird ID-si tapıldı.`); // Log üçün

    let ignoredCount = 0;

    // 3. Excel məlumatlarını emal edirik (Hesablama + Filter)
    const formattedData = data.map((row: any) => {
      // ZipGrade sütunları
      const correct = Number(row["Num Correct"]) || 0;
      const totalQuestions = Number(row["Num Questions"]) || 25; 
      
      const wrong = totalQuestions - correct;

      // --- BAL HESABLAMA ---
      let calculatedScore = (correct * 4) - (wrong * 1);
      if (calculatedScore < 0) calculatedScore = 0;

      // Faiz hesablama
      let percent = 0;
      if (row["Percent Correct"]) {
          percent = Number(row["Percent Correct"]);
          if (percent <= 1) percent = percent * 100;
      } else {
          const maxScore = totalQuestions * 4;
          percent = (calculatedScore / maxScore) * 100;
      }

      return {
        student_id: String(row["ZipGrade ID"] || row["External Id"] || "").trim(),
        quiz: examName,
        score: calculatedScore, 
        total: totalQuestions,
        percent: parseFloat(percent.toFixed(2)) 
      };
    }).filter(item => {
      // Filter məntiqi: ID-si validStudentIds içində varsa, buraxırıq
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
         message: ignoredCount > 0 
           ? `Yüklənən fayldakı ${ignoredCount} nəfərin ID-si bazada (nə students, nə də local_students) tapılmadı.` 
           : "Faylda uyğun məlumat tapılmadı." 
       }, { status: 400 });
    }

    // 4. Bazaya yazırıq
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
