import pdf from "pdf-parse";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Supabase Bağlantısı
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ENV yoxdur");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();

    // 2. Google Gemini Bağlantısı
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY tapılmadı" }, { status: 500 });
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const formData = await req.formData();
    const file = formData.get("pdf") as File;

    if (!file) return NextResponse.json({ error: "PDF yoxdur" }, { status: 400 });

    // PDF-i Buffer-ə çevirib oxumaq
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);
    const pdfText = data.text;

    // Əgər PDF boşdursa
    if (!pdfText || pdfText.length < 10) {
      return NextResponse.json({ error: "PDF mətni oxunmadı (Şəkil ola bilər)" }, { status: 400 });
    }

    console.log("PDF mətni Gemini-yə göndərilir...");

    // 3. AI-ya Sorğu (Prompt)
    const prompt = `
      Aşağıdakı imtahan nəticəsi mətnindən məlumatları çıxar və yalnız JSON formatında qaytar.
      Başqa heç bir söz yazma, yalnız JSON.

      Axtarılacaq sahələr:
      - student_id: (Tələbənin ID nömrəsi. Adətən 6-10 rəqəmli olur. 'Name' və ya 'ID' yanında ola bilər. Məsələn: 19576598)
      - quiz: (İmtahan adı. 'Quiz:' sözündən sonra. Tapmasan 'İmtahan' yaz)
      - score: (Topladığı xal. 'Points Earned' və ya 'Pts' yanında)
      - total: (Maksimum xal. 'Possible Points' yanında)
      - percent: (Faiz. '%' işarəsi olan)

      Əgər hansısa dəyəri tapmasan, 0 və ya boş string yaz.

      PDF MƏTNİ:
      ${pdfText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // JSON-u təmizləmək (Bəzən AI ```json ... ``` əlavə edir)
    let textResult = response.text();
    textResult = textResult.replace(/```json/g, "").replace(/```/g, "").trim();

    console.log("AI Cavabı:", textResult);
    
    let json: any = {};
    try {
        json = JSON.parse(textResult);
    } catch (e) {
        return NextResponse.json({ error: "AI cavabı JSON deyil: " + textResult }, { status: 500 });
    }

    // 4. Bazaya Yazmaq
    if (!json.student_id || json.student_id == "0") {
        return NextResponse.json({ error: "AI Şagird ID-sini tapa bilmədi" }, { status: 400 });
    }

    const { error } = await supabase
      .from("results")
      .upsert(
        { 
            student_id: json.student_id, 
            quiz: json.quiz || "İmtahan", 
            score: Number(json.score) || 0, 
            total: Number(json.total) || 0, 
            percent: Number(json.percent) || 0 
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
