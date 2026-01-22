import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { checkAdminAuth } from "../../../lib/admin-check";

// 🔥 ƏN VACİB HİSSƏ: Timeout-u artırırıq (Vercel/Next.js üçün)
export const maxDuration = 60; // 60 saniyə vaxt veririk (Standart 10 olur)
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    // ... kodun qalanı olduğu kimi davam edir ...
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    
    // Frontend-dən gələn məlumatlar
    const { data: rawExcelData, pointsPerQuestion, examName } = body;

    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;
    // Əgər examName gəlməsə, default "Test" götürür (amma frontend-dən gəlməlidir)
    const finalQuizName = examName || "Test"; 

    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur." }, { status: 400 });
    }

    // --- GEMINI AI (MODEL BURDA SEÇİLİR) ---
    // Qeyd: 'gemini-3-flash-preview' əgər aktiv deyilsə, 'gemini-2.0-flash-exp' istifadə et.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    // Sütunları tapmaq üçün AI prompt
    const columnPrompt = `
      Analyze these JSON keys from an Excel file header:
      ${JSON.stringify(Object.keys(rawExcelData[0]))}
      
      Identify which key corresponds to:
      1. Student ID (e.g., ZipGrade ID, External Id, StudentID)
      2. Correct Answers Count (e.g., Num Correct, Corrects)
      3. Total Questions Count (e.g., Num Questions, Questions)
      4. Percent (e.g., Percent, Percent Correct)

      Return ONLY a JSON object:
      {
        "id_col": "key_name",
        "correct_col": "key_name",
        "total_questions_col": "key_name",
        "percent_col": "key_name"
      }
    `;
    
    const result = await model.generateContent(columnPrompt);
    const mappingText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const mapping = JSON.parse(mappingText);
    
    console.log("AI Tapdı:", mapping);

    // --- DATA EMALI ---
    const processedData = rawExcelData
      .filter((item: any) => item[mapping.id_col]) 
      .map((item: any) => {
        const correct = Number(item[mapping.correct_col]) || 0;
        const totalQ = Number(item[mapping.total_questions_col]) || 0;
        
        return {
           student_id: String(item[mapping.id_col]).trim(),
           quiz: finalQuizName, // ARTIQ SEÇİLƏN AD OLACAQ
           correct_count: correct,
           wrong_count: totalQ - correct,
           score: correct * multiplier,
           total: totalQ * multiplier,
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
        return NextResponse.json({ success: false, message: "Bazada uyğun şagird tapılmadı." });
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
    console.error("API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
