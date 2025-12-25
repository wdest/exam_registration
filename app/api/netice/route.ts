import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// 1. Gemini Şeması (Dəyişmədi)
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

// 2. GET Metodu - YENİLƏNDİ (İmtahan adına görə yoxlama)
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Server xətası" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const examName = searchParams.get("examName"); // <--- YENİ: İmtahan adı

    if (!id) return NextResponse.json({ error: "ID yoxdur" }, { status: 400 });

    // Sorğunu hazırlayırıq
    let query = supabase
      .from("results")
      // !inner istifadə edirik ki, əlaqəli cədvəldə (students) filterləmə apara bilək
      .select("*, students!inner(first_name, last_name, class, exam_name)")
      .eq("student_id", id); // Nəticələr cədvəlindəki unikal kod

    // Əgər frontend-dən imtahan adı gəlibsə, onu da yoxlayırıq
    if (examName) {
       query = query.eq("students.exam_name", examName);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: "Məlumat bazasında xəta" }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: "Nəticə tapılmadı. İmtahan adını və kodu düzgün seçdiyinizə əmin olun." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// 3. POST Metodu (Dəyişmədi - PDF yükləmək üçün)
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!supabase || !apiKey) return NextResponse.json({ error: "Konfiqurasiya xətası" }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
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

    const result = await model.generateContent([
      "Bu PDF-in hər səhifəsi fərqli bir şagirdin nəticəsidir. BÜTÜN səhifələri oxu və hər şagird üçün məlumatları JSON siyahısı (array) formatında qaytar. 'student_id' sahəsinə kağızdakı ID-ni (unikal kodu) yaz.",
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
    ]);

    const resultsArray = JSON.parse(result.response.text());

    if (!Array.isArray(resultsArray)) {
        return NextResponse.json({ error: "Gemini düzgün formatda cavab vermədi" }, { status: 500 });
    }

    // Bazaya yazırıq
    const { error: dbError } = await supabase
      .from("results")
      .upsert(
        resultsArray.map((item: any) => ({
          student_id: String(item.student_id), // Bu kod students cədvəlindəki exam_id ilə eyni olmalıdır
          quiz: item.quiz || "İmtahan",
          score: Number(item.score),
          total: Number(item.total),
          percent: Number(item.percent),
        })),
        { onConflict: "student_id" } // Conflict olanda yenilə
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
