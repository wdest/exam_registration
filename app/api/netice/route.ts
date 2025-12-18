import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 1. Supabase Client Yaradılması
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Yazmaq əməliyyatı (POST) üçün SERVICE_ROLE_KEY vacibdir
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

// 2. Gemini Schema (POST üçün lazımdır)
const examSchema = {
  description: "İmtahan nəticəsi",
  type: SchemaType.OBJECT,
  properties: {
    student_id: { type: SchemaType.STRING, nullable: false },
    quiz: { type: SchemaType.STRING, nullable: false },
    score: { type: SchemaType.NUMBER, nullable: false },
    total: { type: SchemaType.NUMBER, nullable: false },
    percent: { type: SchemaType.NUMBER, nullable: false },
  },
  required: ["student_id", "score", "total"],
};

// --- GET METODU: Nəticəni axtarmaq üçün ---
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Server xətası (Supabase)" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID göndərilməyib" }, { status: 400 });

    // DƏYİŞİKLİK BURADADIR: "students(full_name)" əlavə edildi
    const { data, error } = await supabase
      .from("results")
      .select("*, students(full_name)") 
      .eq("student_id", id)
      .order("created_at", { ascending: false }) // Ən son imtahanı gətirir
      .limit(1)
      .single();

    if (error) {
      // Əgər nəticə yoxdursa, xüsusi xəta qaytarırıq
      if (error.code === 'PGRST116') {
         return NextResponse.json({ error: "Nəticə tapılmadı" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: "Server xətası: " + e.message }, { status: 500 });
  }
}

// --- POST METODU: PDF Yükləmək və Gemini ilə Oxumaq üçün ---
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Server xətası" }, { status: 500 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY yoxdur" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: examSchema,
      },
    });

    const formData = await req.formData();
    const file = formData.get("pdf") as File;

    if (!file) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // Gemini-yə göndəririk
    const result = await model.generateContent([
      "Bu imtahan sənədindən nəticələri çıxar.",
      { inlineData: { data: base64Data, mimeType: file.type || "application/pdf" } },
    ]);

    const json = JSON.parse(result.response.text());

    // Bazaya yazırıq (Upsert - təkrarlanmanın qarşısını alır)
    const { error: dbError } = await supabase
      .from("results")
      .upsert(
        { 
            student_id: json.student_id, 
            quiz: json.quiz || "İmtahan", 
            score: json.score, 
            total: json.total, 
            percent: json.percent 
        },
        { onConflict: "student_id,quiz" }
      );

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, data: json });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
