import pdf from "pdf-parse";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ENV yoxdur");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);
    const text = data.text;

    console.log("PDF TEXT:", text);

    /* ===== QUIZ ===== */
    const quizMatch = text.match(/Quiz:\s*([^\n]+)/);
    const quiz = quizMatch ? quizMatch[1].trim() : "İmtahan";

    /* ===== STUDENT ID (ZipGrade) ===== */
    const idMatch = text.match(/Name\s+(\d{6,})/);
    const student_id = idMatch?.[1];

    if (!student_id) {
      return NextResponse.json(
        { error: "Şagird ID tapılmadı" },
        { status: 400 }
      );
    }

    /* ===== SCORE ===== */
    const scoreMatch = text.match(/Points Earned:\s*(\d+)/);
    const totalMatch = text.match(/Possible Points:\s*(\d+)/);
    const percentMatch = text.match(/Percent:\s*([\d.]+)%/);

    const score = scoreMatch ? Number(scoreMatch[1]) : 0;
    const total = totalMatch ? Number(totalMatch[1]) : 20;
    const percent = percentMatch ? Number(percentMatch[1]) : 0;

    /* ===== UPSERT (FINAL FIX) ===== */
    const { error } = await supabase
      .from("results")
      .upsert(
        { student_id, quiz, score, total, percent },
        { onConflict: "student_id,quiz" }
      );

    if (error) {
      console.error("DB ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server xətası: " + e.message },
      { status: 500 }
    );
  }
}
