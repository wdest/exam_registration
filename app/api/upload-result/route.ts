import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; // <--- Yeni
import { checkAdminAuth } from "../../../lib/admin-check";

// Gemini-ni işə salırıq
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });
    }

    // 2. Supabase Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { data: rawExcelData, pointsPerQuestion, examName } = body;

    // Default dəyərlər
    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;
    const finalQuizName = examName || "Test";

    if (!rawExcelData || !Array.isArray(rawExcelData)) {
      return NextResponse.json({ error: "Excel məlumatı boşdur" }, { status: 400 });
    }

    // 3. GEMINI ANALİZİ (Ən vacib hissə) 🧠
    // Modeli seçirik (Flash modeli sürətli və ucuzdur)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI-ya əmr veririk (Prompt)
    const prompt = `
      You are a data processing assistant for a school exam system.
      I will provide raw JSON data from an Excel file.
      
      YOUR GOAL:
      Convert this raw data into a specific JSON structure for my database.
      
      PARAMETERS:
      - Points per question: ${multiplier}
      - Quiz Name override: "${finalQuizName}"

      INSTRUCTIONS:
      1. Find the student ID. It is usually named "ZipGrade ID", "Student ID", or similar. It MUST be a string. Trim whitespace.
      2. Find the "Number of Correct Answers". It might be "Num Correct", "Num Correc", "Corrects", etc.
      3. Find the "Total Number of Questions". It might be "Num Questions", "Questions", etc.
      4. Find the "Percent". It might be "Percent Correct", "Percent", etc.
      
      CALCULATIONS:
      - score = (Number of Correct Answers) * ${multiplier}
      - total = (Total Number of Questions) * ${multiplier}
      - wrong_count = (Total Number of Questions) - (Number of Correct Answers)
      - quiz = Use "${finalQuizName}" as the name.

      OUTPUT FORMAT:
      Return ONLY a JSON array with objects matching this interface:
      {
        "student_id": string,
        "quiz": string,
        "correct_count": number,
        "wrong_count": number,
        "score": number,
        "total": number,
        "percent": number
      }

      RAW DATA TO PROCESS:
      ${JSON.stringify(rawExcelData)}
    `;

    console.log("Gemini analiz edir...");
    
    // AI-dan cavab alırıq
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // AI cavabını təmizləyirik (bəzən ```json ... ``` əlavə edir)
    const cleanedJsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const processedData = JSON.parse(cleanedJsonString);

    console.log(`AI ${processedData.length} nəfəri analiz etdi.`);

    // 4. BAZADA ŞAGİRDLƏRİ YOXLAYIRIQ (Supabase tərəfi)
    const studentIds = processedData.map((d: any) => d.student_id);
    const { data: foundStudents, error: findError } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', studentIds);

    if (findError) return NextResponse.json({ error: findError.message }, { status: 500 });

    const validIds = new Set(foundStudents?.map(s => s.exam_id));
    
    // Yalnız bazada olanları saxlayırıq
    const finalDataToInsert = processedData.filter((d: any) => validIds.has(d.student_id));

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ success: false, message: "Bazada heç bir uyğun şagird tapılmadı." });
    }

    // 5. BAZAYA YAZIRIQ
    const { data: insertedData, error: insertError } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
        console.error("Supabase Error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length,
        message: `AI Analizi Uğurlu! ${finalDataToInsert.length} nəfər yükləndi.` 
    });

  } catch (e: any) {
    console.error("AI/API Xətası:", e);
    return NextResponse.json({ error: "Xəta baş verdi: " + e.message }, { status: 500 });
  }
}
