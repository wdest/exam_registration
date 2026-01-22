import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { checkAdminAuth } from "../../../lib/admin-check";

// Vercel-ə deyirik ki, bacardığın qədər gözlə (lakin Hobby planında max 10s olur)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { data: rawExcelData, pointsPerQuestion, examName } = body;

    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;
    const finalQuizName = examName || "Test";

    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur." }, { status: 400 });
    }

    // --- SÜTUNLARI TAPMAQ STRATEGİYASI ---
    // Əvvəl AI ilə yoxlayırıq, gecikərsə sadə məntiqlə tapırıq.

    const headers = Object.keys(rawExcelData[0]); // Yalnız başlıqları götürürük
    let mapping: any = null;

    try {
        // AI funksiyasını çağırırıq (Timeout ilə)
        // 5 saniyə vaxt qoyuruq. Əgər 5 saniyəyə cavab gəlməsə, "Manual" rejimə keçirik.
        const aiPromise = (async () => {
            // Model adı: 'gemini-1.5-flash' (Preview modellər bəzən donur)
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
            
            const prompt = `
              Match these Excel headers to target keys based on meaning (multilingual support):
              Headers: ${JSON.stringify(headers)}
              
              Targets:
              - id_col: Student ID, ZipGrade ID, No, Kod
              - correct_col: Correct Count, Num Correct, Düzgün
              - total_questions_col: Question Count, Sual, Total Questions
              - percent_col: Percent, Faiz, Score %

              Return ONLY JSON: {"id_col": "...", "correct_col": "...", "total_questions_col": "...", "percent_col": "..."}
            `;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(text);
        })();

        // Yarış: Ya AI cavab verir, ya da 5 saniyə bitir
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("Timeout"), 5000));
        
        mapping = await Promise.race([aiPromise, timeoutPromise]);
        console.log("✅ AI Mapping Uğurlu:", mapping);

    } catch (err) {
        console.warn("⚠️ AI Gecikdi və ya Xəta verdi, Manual rejimə keçilir...", err);
        // FALLBACK (MANUAL AXTARIŞ) - Əgər AI işləməsə bu işə düşür
        const findKey = (keywords: string[]) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || "";
        
        mapping = {
            id_col: findKey(['id', 'kod', 'no', 'student']),
            correct_col: findKey(['correct', 'duz', 'düz', 'dogru']),
            total_questions_col: findKey(['question', 'sual', 'ümumi']),
            percent_col: findKey(['percent', 'faiz', '%'])
        };
        console.log("🔧 Manual Mapping:", mapping);
    }

    // --- DATA EMALI ---
    const processedData = rawExcelData
      .filter((item: any) => item[mapping.id_col]) 
      .map((item: any) => {
        const correct = Number(item[mapping.correct_col]) || 0;
        const totalQ = Number(item[mapping.total_questions_col]) || 0;
        // Əgər Total 0-dırsa, təxmini hesablayırıq (və ya səhv sayını 0 götürürük)
        const validTotal = totalQ === 0 ? correct : totalQ; 
        
        return {
           student_id: String(item[mapping.id_col]).trim(),
           quiz: finalQuizName,
           correct_count: correct,
           wrong_count: validTotal - correct,
           score: correct * multiplier,
           total: validTotal * multiplier,
           percent: Number(item[mapping.percent_col]) || 0
        };
      });

    // --- BAZA YOXLAMASI ---
    const studentIds = processedData.map((d: any) => d.student_id);
    const { data: foundStudents } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', studentIds);

    const validIds = new Set(foundStudents?.map(s => s.exam_id));
    const finalDataToInsert = processedData.filter((d: any) => validIds.has(d.student_id));

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ success: false, message: "Bazada uyğun şagird tapılmadı. ID-ləri yoxlayın." });
    }

    // --- YAZMAQ ---
    const { error } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      });

    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length,
        skipped_count: processedData.length - finalDataToInsert.length
    });

  } catch (e: any) {
    console.error("Critical API Error:", e);
    return NextResponse.json({ error: "Server xətası: " + e.message }, { status: 500 });
  }
}
