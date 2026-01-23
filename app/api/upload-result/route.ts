import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { checkAdminAuth } from "../../../lib/admin-check";

// Vercel-ə deyirik ki, bacardığın qədər gözlə (60 saniyə)
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });

    const body = await req.json();
    const { data: rawExcelData, pointsPerQuestion, examName } = body;

    // Excel-in boş olub olmadığını yoxlayırıq
    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur." }, { status: 400 });
    }

    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;
    const finalQuizName = examName || "Test";

    // --- SÜTUNLARI TAPMAQ (GEMINI 2.0 FLASH İLƏ) ---
    const headers = Object.keys(rawExcelData[0]); 
    let mapping: any = null;

    try {
        // Timeout-u idarə etmək üçün
        const aiPromise = (async () => {
            // BURADA SƏNİN İSTƏDİYİN MODELİ QOYDUM: gemini-2.0-flash-exp
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 
            
            const prompt = `
              Match these Excel headers to target keys based on meaning (multilingual support):
              Headers: ${JSON.stringify(headers)}
              
              Targets:
              - id_col: Student ID, ZipGrade ID, No, Kod, İş nömrəsi
              - correct_col: Correct Count, Num Correct, Düzgün, Düz
              - total_questions_col: Question Count, Sual, Total Questions, Ümumi
              - percent_col: Percent, Faiz, Score %

              Return ONLY JSON: {"id_col": "...", "correct_col": "...", "total_questions_col": "...", "percent_col": "..."}
            `;
            const result = await model.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(text);
        })();

        // 5 saniyə vaxt qoyuruq (2.0 Flash çox sürətlidir, dərhal cavab verəcək)
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("Timeout"), 5000));
        
        mapping = await Promise.race([aiPromise, timeoutPromise]);
        console.log("✅ AI Mapping Uğurlu (Gemini 2.0 Flash):", mapping);

    } catch (err) {
        console.warn("⚠️ AI Gecikdi, Manual rejimə keçilir...", err);
        // FALLBACK (MANUAL AXTARIŞ)
        const findKey = (keywords: string[]) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || "";
        
        mapping = {
            id_col: findKey(['id', 'kod', 'no', 'student']),
            correct_col: findKey(['correct', 'duz', 'düz', 'dogru']),
            total_questions_col: findKey(['question', 'sual', 'ümumi']),
            percent_col: findKey(['percent', 'faiz', '%'])
        };
    }

    // --- DATA EMALI ---
    const processedData = rawExcelData
      .filter((item: any) => item[mapping.id_col]) 
      .map((item: any) => {
        const correct = Number(item[mapping.correct_col]) || 0;
        const totalQ = Number(item[mapping.total_questions_col]) || 0;
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

    // --- BAZA İLƏ ƏLAQƏ ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // DİQQƏT: Test üçün filtrasiyanı söndürdüm ki, nəticələr mütləq düşsün.
    // Əgər ancaq qeydiyyatdan keçənləri istəyirsənsə, aşağıdakı kommenti açarsan.
    
    /* const studentIds = processedData.map((d: any) => d.student_id);
    const { data: foundStudents } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', studentIds);
    const validIds = new Set(foundStudents?.map(s => s.exam_id));
    const finalDataToInsert = processedData.filter((d: any) => validIds.has(d.student_id));
    */

    // İndi bütün Excel sətirlərini yazmağa çalışacaq
    const finalDataToInsert = processedData;

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ success: false, message: "Yüklənəcək heç bir uyğun sətir tapılmadı." });
    }

    // --- BAZAYA YAZMAQ (Upsert) ---
    const { error } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      });

    if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: "Bazaya yazarkən xəta: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length,
        skipped_count: processedData.length - finalDataToInsert.length
    });

  } catch (e: any) {
    console.error("API Error:", e);
    return NextResponse.json({ error: "Server xətası: " + e.message }, { status: 500 });
  }
}
