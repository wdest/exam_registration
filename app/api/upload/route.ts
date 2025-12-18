import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"; // DƏYİŞİKLİK 1: SchemaType əlavə olundu

// 1. Supabase Bağlantısı
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ENV yoxdur");
  return createClient(url, key);
}

// DƏYİŞİKLİK 2: AI üçün Cədvəl Sxemi (Bunu funksiyadan çöldə yaza bilərsiniz)
const examSchema = {
  description: "İmtahan nəticələrinin çıxarılması",
  type: SchemaType.OBJECT,
  properties: {
    student_id: {
      type: SchemaType.STRING,
      description: "Tələbənin ID nömrəsi (Məs: 19576598)",
      nullable: false,
    },
    quiz: {
      type: SchemaType.STRING,
      description: "İmtahanın adı",
      nullable: false,
    },
    score: {
      type: SchemaType.NUMBER,
      description: "Toplanılan xal",
      nullable: false,
    },
    total: {
      type: SchemaType.NUMBER,
      description: "Maksimum mümkün xal",
      nullable: false,
    },
    percent: {
      type: SchemaType.NUMBER,
      description: "Nəticə faizi (0-100 arası rəqəm)",
      nullable: false,
    },
  },
  required: ["student_id", "score", "total"],
};

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY tapılmadı" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // DƏYİŞİKLİK 3: Modeli çağıranda Sxemi ona veririk
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview", // Və ya "gemini-1.5-flash"
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: examSchema, // <--- ƏSAS HİSSƏ: AI artıq bu strukturu bilir
      },
    });

    const formData = await req.formData();
    const file = formData.get("pdf") as File;

    if (!file) return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });

    // DƏYİŞİKLİK 4: pdf-parse silindi. Faylı Base64 formatına çeviririk
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    console.log("PDF Gemini-yə göndərilir...");

    // DƏYİŞİKLİK 5: Sadə prompt və Faylın özü
    const result = await model.generateContent([
      "Bu imtahan sənədindən nəticələri çıxar.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf", // Əgər şəkil yükləyirsinizsə "image/jpeg" ola bilər
        },
      },
    ]);

    const response = await result.response;
    const textResult = response.text();
    
    console.log("AI Cavabı:", textResult);
    
    // JSON parse artıq daha təhlükəsizdir
    let json;
    try {
        json = JSON.parse(textResult);
    } catch (e) {
        return NextResponse.json({ error: "AI cavabı oxuna bilmədi" }, { status: 500 });
    }

    // 6. Bazaya Yazmaq (AI rəqəmləri artıq Number kimi qaytarır, çevirməyə ehtiyac yoxdur)
    const { error } = await supabase
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

    if (error) {
      console.error("DB Error:", error);
      return NextResponse.json({ error: "Baza xətası: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: json });

  } catch (e: any) {
    console.error("Server Error:", e);
    return NextResponse.json(
      { error: "Server xətası: " + e.message },
      { status: 500 }
    );
  }
}
