import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

// API Key yoxlanışı
const apiKey = process.env.GEMINI_API_KEY;
// Əgər key yoxdursa null qaytarır, aşağıda yoxlayacağıq
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "İcazəsiz giriş (Admin deyil)!" }, { status: 401 });

    const body = await req.json();
    const { data: rawExcelData, pointsPerQuestion, examName } = body;

    // Excel yoxlanışı
    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel faylı boşdur və ya oxunmadı." }, { status: 400 });
    }

    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;
    const finalQuizName = examName || "Test";
    const headers = Object.keys(rawExcelData[0]); 

    let mapping: any = null;

    // --- GEMINI 3 MƏRHƏLƏSİ ---
    try {
        if (!genAI) throw new Error("GEMINI_API_KEY tapılmadı (.env faylını yoxla)");

        // SƏNİN İSTƏDİYİN MODEL
        // DİQQƏT: Əgər Google bu adı dəyişibsə, burada xəta çıxacaq.
        const modelName = "gemini-3-flash-preview"; 
        const model = genAI.getGenerativeModel({ model: modelName }); 
        
        console.log(`🤖 Gemini model işə düşür: ${modelName}`);

        const prompt = `
          MAPPING TASK:
          Match these Excel headers: ${JSON.stringify(headers)}
          To these target keys:
          - id_col: (Student ID, Kod, İş nömrəsi, No)
          - correct_col: (Correct Count, Düz, Düzgün, Num Correct)
          - total_questions_col: (Total Questions, Sual Sayı, Ümumi)
          - percent_col: (Percent, Faiz, %)

          Return valid JSON only: {"id_col": "...", "correct_col": "...", "total_questions_col": "...", "percent_col": "..."}
        `;
        
        // Timeout qoruyucusu (5 saniyə)
        const aiPromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini Timeout (5s)")), 5000));

        const result: any = await Promise.race([aiPromise, timeoutPromise]);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        mapping = JSON.parse(text);
        
        console.log("✅ AI Uğurlu:", mapping);

    } catch (aiError: any) {
        console.warn("⚠️ AI Xətası (Manual rejimə keçilir):", aiError.message);
        
        // Əgər Gemini 3 adı səhvdirsə və ya cavab vermirsə, bura düşəcək
        // MANUAL FALLBACK
        const findKey = (keywords: string[]) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || "";
        mapping = {
            id_col: findKey(['id', 'kod', 'no', 'student', 'iş']),
            correct_col: findKey(['correct', 'duz', 'düz', 'dogru']),
            total_questions_col: findKey(['question', 'sual', 'ümumi', 'total']),
            percent_col: findKey(['percent', 'faiz', '%'])
        };
    }

    // Sütun tapılmadısa
    if (!mapping.id_col || !mapping.correct_col) {
        return NextResponse.json({ 
            error: `Sütunlar tapılmadı. Excel başlıqları: ${headers.join(", ")}. Gemini xətası ola bilər.` 
        }, { status: 400 });
    }

    // --- DATA HAZIRLANMASI ---
    const processedData = rawExcelData
      .filter((item: any) => item[mapping.id_col])
      .map((item: any) => {
        const correct = Number(item[mapping.correct_col]) || 0;
        const totalQ = Number(item[mapping.total_questions_col]) || 0;
        const validTotal = totalQ === 0 ? correct : totalQ; 
        
        return {
           student_id: String(item[mapping.id_col]).trim(), // String-ə çeviririk
           quiz: finalQuizName,
           correct_count: correct,
           wrong_count: validTotal - correct,
           score: correct * multiplier,
           total: validTotal * multiplier,
           percent: Number(item[mapping.percent_col]) || 0
        };
      });

    // --- SUPABASE MƏRHƏLƏSİ ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log(`💾 Bazaya ${processedData.length} sətir yazılır...`);

    // UPSERT ƏMƏLİYYATI
    // DİQQƏT: onConflict işləməsi üçün bazada Unique Constraint olmalıdır!
    const { data, error } = await supabase
      .from("results")
      .upsert(processedData, { 
          onConflict: "student_id,quiz", 
          ignoreDuplicates: false 
      })
      .select(); // Nəticəni qaytar ki, görək yazıldı mı

    if (error) {
        console.error("❌ Supabase Xətası:", error);
        // Xətanı dəqiq qaytarırıq ki, sən görəsən
        return NextResponse.json({ error: "Verilənlər bazası xətası: " + error.message + " (Kod: " + error.code + ")" }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: processedData.length,
        db_response: data ? data.length : 0
    });

  } catch (e: any) {
    console.error("🔥 Kritik Server Xətası:", e);
    return NextResponse.json({ error: "Serverdə kritik xəta: " + e.message }, { status: 500 });
  }
}
