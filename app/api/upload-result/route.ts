import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// AI üçün Cavab Şablonu
const examSchema = {
  description: "Bütün şagirdlərin imtahan nəticələri siyahısı",
  type: SchemaType.ARRAY,
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

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return NextResponse.json({ error: "API Key tapılmadı." }, { status: 500 });
    if (!supabase) return NextResponse.json({ error: "Supabase xətası." }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🔥 MODEL ADI YENİLƏNDİ: gemini-3-flash-preview 🔥
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: examSchema,
      },
    });

    const formData = await req.formData();
    const file = formData.get("pdf") as File;
    const examName = formData.get("exam_name") as string;

    if (!file) return NextResponse.json({ error: "PDF tapılmadı" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Bu sənəd ZipGrade imtahan nəticələridir. 
      Məlumatları analiz et və JSON array qaytar.
      
      Sahələr:
      - student_id: Tələbə ID-si.
      - quiz: İmtahan adı (əgər yoxdursa "${examName || 'İmtahan'}" istifadə et).
      - score: Toplanan bal.
      - total: Ümumi sual sayı.
      - percent: Faiz.
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
    ]);

    const responseText = result.response.text();
    const resultsArray = JSON.parse(responseText);

    if (!Array.isArray(resultsArray)) {
        return NextResponse.json({ error: "Gemini düzgün formatda cavab vermədi" }, { status: 500 });
    }

    // --- TƏKRARLARI TƏMİZLƏMƏK (Deduplication) ---
    // Bu hissə "ON CONFLICT" xətasının qarşısını alır
    const uniqueMap = new Map();

    resultsArray.forEach((item: any) => {
        const stdId = String(item.student_id).trim();
        const quizName = (item.quiz || examName || "İmtahan").trim();
        const uniqueKey = `${stdId}_${quizName}`;

        if (!uniqueMap.has(uniqueKey)) {
             uniqueMap.set(uniqueKey, {
                 student_id: stdId,
                 quiz: quizName,
                 score: Number(item.score),
                 total: Number(item.total),
                 percent: Number(item.percent),
                 correct_count: Number(item.score), 
                 wrong_count: Number(item.total) - Number(item.score)
             });
        }
    });

    const cleanData = Array.from(uniqueMap.values());

    // Bazaya yazırıq
    const { error: dbError } = await supabase
      .from("results")
      .upsert(
        cleanData,
        { onConflict: "student_id,quiz" }
      );

    if (dbError) throw dbError;

    return NextResponse.json({ 
      success: true, 
      processed_count: cleanData.length, 
      message: `${cleanData.length} nəticə (Gemini 3 Preview ilə) uğurla yükləndi.` 
    });

  } catch (e: any) {
    console.error("API Xətası:", e.message);
    
    // Əgər yenə 404 versə, istifadəçiyə dəqiq mesaj göstərək
    if (e.message.includes("404") || e.message.includes("not found")) {
        return NextResponse.json({ error: "Model tapılmadı ('gemini-3-flash-preview'). Google AI Studio-dan dəqiq model ID-ni yoxlayın." }, { status: 500 });
    }

    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
