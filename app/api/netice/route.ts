import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// 1. Şemamızı Massiv (Array) şəklində dəyişirik
const examSchema = {
  description: "Bütün şagirdlərin imtahan nəticələri siyahısı",
  type: SchemaType.ARRAY, // Bir neçə nəticə gözləyirik
  items: {
    type: SchemaType.OBJECT,
    properties: {
      student_id: { type: SchemaType.STRING, nullable: false },
      quiz: { type: SchemaType.STRING, nullable: false },
      score: { type: SchemaType.NUMBER, nullable: false },
      total: { type: SchemaType.NUMBER, nullable: false },
      percent: { type: SchemaType.NUMBER, nullable: false },
    },
    required: ["student_id", "score", "total"],
  },
};

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Server xətası" }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID yoxdur" }, { status: 400 });

    const { data, error } = await supabase
      .from("results")
      .select("*, students(first_name, last_name)")
      .eq("student_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 2. Yenilənmiş POST Metodu: Hər səhifəni oxuyub bazaya yazır
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!supabase || !apiKey) return NextResponse.json({ error: "Konfiqurasiya xətası" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Çox səhifəli fayllar üçün ən stabil model
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: examSchema,
      },
    });

    const formData = await req.formData();
    const file = formData.get("pdf") as File;
    if (!file) return NextResponse.json({ error: "PDF tapılmadı" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Gemini-yə PDF-i tam göndəririk və hər səhifəni ayrıca analiz etməsini deyirik
    const result = await model.generateContent([
      "Bu PDF-in hər səhifəsi fərqli bir şagirdin nəticəsidir. BÜTÜN səhifələri oxu və hər şagird üçün məlumatları JSON siyahısı (array) formatında qaytar.",
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
    ]);

    const resultsArray = JSON.parse(result.response.text());

    if (!Array.isArray(resultsArray)) {
        return NextResponse.json({ error: "Gemini düzgün formatda cavab vermədi" }, { status: 500 });
    }

    // Bazaya toplu şəkildə yazırıq (Bulk Upsert)
    // Bu, hər şagird üçün ayrıca sətir yaradacaq
    const { error: dbError } = await supabase
      .from("results")
      .upsert(
        resultsArray.map((item: any) => ({
          student_id: String(item.student_id),
          quiz: item.quiz || "İmtahan",
          score: Number(item.score),
          total: Number(item.total),
          percent: Number(item.percent),
        })),
        { onConflict: "student_id,quiz" }
      );

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      processed_count: resultsArray.length, 
      message: `${resultsArray.length} şagirdin nəticəsi bazaya yazıldı.` 
    });

  } catch (e: any) {
    console.error("Xəta:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
