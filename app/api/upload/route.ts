import pdf from "pdf-parse";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Bu funksiya ENV yoxdursa dərhal xəta verir
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // DİQQƏT: Vercel-də bu açarı Environment Variables-ə əlavə etməlisiniz!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; 
  
  if (!url || !key) {
    console.error("Supabase açarları tapılmadı. Vercel ENV yoxlayın.");
    throw new Error("Supabase ENV yoxdur (Service Role Key)");
  }
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();

    const formData = await req.formData();
    
    // DÜZƏLİŞ: Frontend "pdf" göndərir, biz də "pdf" götürürük
    const file = formData.get("pdf") as File; 
    
    if (!file) {
      return NextResponse.json({ error: "PDF faylı göndərilməyib" }, { status: 400 });
    }

    // Faylı buffer-ə çevirmək
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // PDF oxumaq
    const data = await pdf(buffer);
    const text = data.text;

    console.log("PDF TEXT PREVIEW:", text.substring(0, 100)); // Log-da yoxlamaq üçün

    /* ===== PARSING (REGEX) ===== */
    // Regex-ləriniz PDF formatına tam uyğun olmalıdır
    const quizMatch = text.match(/Quiz:\s*([^\n]+)/);
    const quiz = quizMatch ? quizMatch[1].trim() : "İmtahan";

    const idMatch = text.match(/Name\s+(\d{6,})/); // Məsələn: Name 123456
    const student_id = idMatch?.[1];

    if (!student_id) {
      return NextResponse.json(
        { error: "PDF-də şagird ID-si tapılmadı (Format: Name 123456)" },
        { status: 400 }
      );
    }

    const scoreMatch = text.match(/Points Earned:\s*(\d+)/);
    const totalMatch = text.match(/Possible Points:\s*(\d+)/);
    const percentMatch = text.match(/Percent:\s*([\d.]+)%/);

    const score = scoreMatch ? Number(scoreMatch[1]) : 0;
    const total = totalMatch ? Number(totalMatch[1]) : 20;
    const percent = percentMatch ? Number(percentMatch[1]) : 0;

    /* ===== DATABASE WRITE ===== */
    const { error } = await supabase
      .from("results")
      .upsert(
        { student_id, quiz, score, total, percent },
        { onConflict: "student_id,quiz" }
      );

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Baza xətası: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Nəticə uğurla yükləndi!" });

  } catch (e: any) {
    console.error("Server Error:", e);
    return NextResponse.json(
      { error: "Server xətası: " + (e.message || "Bilinməyən xəta") },
      { status: 500 }
    );
  }
}
