import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: "Zəhmət olmasa İmtahan Kodunu daxil edin." }, { status: 400 });
    }

    // 1. Şagirdi tapırıq (exam_id-yə görə)
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("class, exam_name") // Bizə şagirdin sinfi və imtahan adı lazımdır
      .eq("exam_id", studentId.trim())
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Bu kodla şagird tapılmadı." }, { status: 404 });
    }

    // 2. İmtahan Linkini tapırıq (Şagirdin sinfinə və imtahan adına görə)
    // Məsələn: TIMO və 5-ci sinif
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("url")
      .eq("name", student.exam_name)
      .eq("class_grade", student.class)
      .single();

    if (examError || !exam || !exam.url) {
      return NextResponse.json({ error: "Sizin üçün aktiv imtahan linki tapılmadı. Adminlə əlaqə saxlayın." }, { status: 404 });
    }

    // 3. Linki qaytarırıq
    return NextResponse.json({ url: exam.url, success: true });

  } catch (error: any) {
    return NextResponse.json({ error: "Server xətası: " + error.message }, { status: 500 });
  }
}
