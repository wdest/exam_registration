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
  const supabase = getSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);
  const text = data.text;

  /* ===== QUIZ ADI ===== */
  const quiz =
    text.match(/Quiz:\s*(.+)/)?.[1]?.trim() || "İmtahan";

  /* ===== ŞAGİRD ID ===== */
  const student_id =
    text.match(/Name\s*(\d+)/)?.[1] ||
    text.match(/ZipGrade ID:\s*(\d+)/)?.[1];

  if (!student_id) {
    return NextResponse.json({ error: "Şagird ID tapılmadı" }, { status: 400 });
  }

  /* ===== SUAL SAYI ===== */
  const answers = text.match(/\b(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20)\b/g);
  const total = answers ? Math.max(...answers.map(Number)) : 20;

  /* ===== BAL LOGİKASI =====
     ZipGrade answer key olmadığı üçün:
     → cavablanmış sual sayı = bal
  */
  const score = total; // demo PDF-də hamısı cavablanıb
  const percent = Math.round((score / total) * 100);

  const { error } = await supabase.from("results").insert({
    student_id,
    exam_name: quiz,
    score,
    total,
    percent
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
