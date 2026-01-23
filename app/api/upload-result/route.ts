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

    // ZipGrade sütunlarını Supabase sütunlarına map edirik
    const formattedData = data.map((row: any) => {
      // ZipGrade Excel sütun adları (şəkildəki kimi)
      // "ZipGrade ID", "Num Correct", "Num Questions", "Percent Correct"
      
      // Bəzən Excel-dən faiz 80, bəzən 0.8 kimi gəlir, onu düzəldirik:
      let rawPercent = row["Percent Correct"];
      if(rawPercent && rawPercent <= 1) {
          rawPercent = rawPercent * 100; // Əgər 0.92 gəlibsə 92 edirik
      }

      return {
        student_id: String(row["ZipGrade ID"] || row["External Id"] || ""), // ID yoxdursa boş string
        quiz: examName, // Exceldəki "Quiz Name" yox, Adminin dropdown-da seçdiyi ad
        score: Number(row["Num Correct"]) || 0,
        total: Number(row["Num Questions"]) || 0,
        percent: Number(rawPercent) || 0
      };
    }).filter(item => item.student_id !== ""); // ID-si olmayan sətirləri (məsələn boşluqları) atırıq

    if (formattedData.length === 0) {
      return NextResponse.json({ success: false, message: "Uyğun formatda data tapılmadı. Sütun adlarını yoxlayın." }, { status: 400 });
    }

    // Bazaya toplu şəkildə yazırıq (Bulk Insert)
    const { error } = await supabase.from("results").insert(formattedData);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      processed_count: formattedData.length,
      message: "Uğurla yükləndi" 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
