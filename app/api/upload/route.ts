import pdf from "pdf-parse";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);
  const text = data.text;

  const student_id = text.match(/ZipGrade ID:\s*(\d+)/)?.[1];
  const score = Number(text.match(/Points Earned:\s*(\d+)/)?.[1]);
  const total = Number(text.match(/Possible Points:\s*(\d+)/)?.[1]);
  const percent = Number(text.match(/Percent:\s*([\d.]+)/)?.[1]);

  if (!student_id) {
    return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });
  }

  const { error } = await supabase.from("results").insert({
    student_id,
    quiz: "Test",
    score,
    total,
    percent
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, student_id });
}
