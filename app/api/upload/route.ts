import pdf from "pdf-parse";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

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
    exam_name: "Test",
    score,
    total,
    percent
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
