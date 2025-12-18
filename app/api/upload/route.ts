import pdf from "pdf-parse";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const data = await pdf(buffer);
  const text = data.text;

  const studentId = text.match(/ZipGrade ID:\s*(\d+)/)?.[1];
  const earned = text.match(/Points Earned:\s*(\d+)/)?.[1];
  const total = text.match(/Possible Points:\s*(\d+)/)?.[1];
  const percent = text.match(/Percent:\s*([\d.]+)/)?.[1];

  if (!studentId) {
    return NextResponse.json({ error: "ID tapılmadı" }, { status: 400 });
  }

  return NextResponse.json({
    studentId,
    earned,
    total,
    percent
  });
}
