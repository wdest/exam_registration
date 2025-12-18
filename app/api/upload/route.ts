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

    /* ===== DEBUG (çox vacib) ===== */
    console.log("PDF TEXT:", text);

    /* ===== QUIZ ADI ===== */
    const quizMatch = text.match(/Quiz:\s*([A-Za-z0-9 _-]+)/);
    const quiz = quizMatch ? quizMatch[1].trim() : "İmtahan";

    /* ===== ŞAGİRD ID (BU PDF-Ə UYĞUN) =====
       ZipGrade PDF-də belədir:
       Name 19576598
    */
    const idMatch = text.match(/Name\s+(\d{6,})/);
    const student_id = idMatch ? idMatch[1] : null;

    if (!student_id) {
      return NextResponse.json(
        { error: "Şagird ID PDF-dən tapılmadı" },
        { status: 400 }
      );
    }

    /* ===== SUAL SAYI ===== */
    const total = 20;

    /* ===== BAL (answer key YOXDUR) ===== */
    const score = total;
    const percent = 100;

    /* ===== INSERT ===== */
    const { error } = await supabase.from("results").insert({
      student_id,
      quiz,
      score,
      total,
      percent
    });

    if (error) {
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
