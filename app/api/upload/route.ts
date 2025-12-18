import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"; // SchemaType əlavə edin

// 1. Supabase
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ENV yoxdur");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) return NextResponse.json({ error: "API Key yoxdur" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model konfiqurasiyası: JSON cavab istədiyimizi dəqiq deyirik
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json" 
      }
    });

    const formData = await req.formData();
    const file = formData.get("pdf") as File;

    if (!file) return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });

    // Faylı Base64 formatına çeviririk (Gemini-yə birbaşa göndərmək üçün)
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // 2. AI-ya Sorğu
    const prompt = `
      Bu imtahan sənədini analiz et. Məlumatları dəqiq çıxar.
      
      Sahələr:
      - student_id: (string, ID nömrəsi)
      - quiz: (string, İmtahan adı)
      - score: (number, Topladığı xal)
      - total: (number, Maksimum xal)
      - percent: (number, Faiz, sadəcə rəqəm)

      Əgər faiz işarəsi (%) görsən, onu sil, yalnız rəqəmi yaz.
    `;

    // PDF-i və Prompt-u birlikdə göndəririk
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
    ]);

    const response = await result.response;
    const textResult = response.text(); // Artıq təmiz JSON gələcək

    console.log("AI Cavabı:", textResult);

    let json;
    try {
        json = JSON.parse(textResult);
    } catch (e) {
        return NextResponse.json({ error: "JSON parse xətası" }, { status: 500 });
    }

    // 3. Bazaya Yazmaq (Number çevirmələrini möhkəmləndirək)
    if (!json.student_id) {
        return NextResponse.json({ error: "Şagird ID tapılmadı" }, { status: 400 });
    }

    // Rəqəmləri təmizləmək (Məsələn "85%" gəlibsə "85" olsun)
    const cleanNumber = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
        return 0;
    };

    const { error } = await supabase
      .from("results")
      .upsert(
        { 
            student_id: json.student_id, 
            quiz: json.quiz || "İmtahan", 
            score: cleanNumber(json.score), 
            total: cleanNumber(json.total), 
            percent: cleanNumber(json.percent) 
        },
        { onConflict: "student_id,quiz" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true, data: json });

  } catch (e: any) {
    console.error("Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
