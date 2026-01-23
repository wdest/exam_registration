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

    // 1. Bazadan bütün qeydiyyatda olan tələbələrin ID-lərini çəkirik
    const { data: students, error: stError } = await supabase
      .from("students")
      .select("exam_id");

    if (stError) {
      return NextResponse.json({ success: false, error: "Tələbə siyahısı alınmadı: " + stError.message }, { status: 500 });
    }

    // Sürətli yoxlama üçün ID-ləri Set-ə yığırıq (string formatında)
    const validStudentIds = new Set(students?.map((s: any) => String(s.exam_id).trim()));

    let ignoredCount = 0;

    // 2. Excel məlumatlarını emal edirik (Hesablama + Filter)
    const formattedData = data.map((row: any) => {
      // ZipGrade sütunları
      const correct = Number(row["Num Correct"]) || 0;
      const totalQuestions = Number(row["Num Questions"]) || 25; // Standart 25 sual
      
      // Səhv sayı (Boş qalanlar da səhv sayılır)
      const wrong = totalQuestions - correct;

      // --- BAL HESABLAMA DÜSTURU ---
      // (Düz * 4) - (Səhv * 1)
      let calculatedScore = (correct * 4) - (wrong * 1);

      // Mənfi bal olmasın (istəyə bağlı, amma adətən 0-dan aşağı düşmür)
      if (calculatedScore < 0) calculatedScore = 0;

      // Faiz hesablama
      let percent = 0;
      if (row["Percent Correct"]) {
         // Əgər Excel-də faiz varsa (məs: 0.85 və ya 85)
         percent = Number(row["Percent Correct"]);
         if (percent <= 1) percent = percent * 100;
      } else {
         // Yoxdursa özümüz hesablayırıq (Bal / MaxBal * 100)
         const maxScore = totalQuestions * 4;
         percent = (calculatedScore / maxScore) * 100;
      }

      return {
        student_id: String(row["ZipGrade ID"] || row["External Id"] || "").trim(),
        quiz: examName,
        score: calculatedScore, // Yekun bal
        total: totalQuestions,
        percent: parseFloat(percent.toFixed(2)) // 2 rəqəm yuvarlaqlaşdırırıq
      };
    }).filter(item => {
      // Filter məntiqi: ID boşdursa və ya bazada yoxdursa sil
      if (!item.student_id) return false;

      if (validStudentIds.has(item.student_id)) {
        return true;
      } else {
        ignoredCount++; // Kənarlaşdırılanları sayırıq
        return false;
      }
    });

    if (formattedData.length === 0) {
       return NextResponse.json({ 
         success: false, 
         message: ignoredCount > 0 
           ? `Yüklənən fayldakı ${ignoredCount} nəfərin heç biri qeydiyyatda yoxdur.` 
           : "Faylda uyğun məlumat tapılmadı." 
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
