import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { checkAdminAuth } from "../../../lib/admin-check";

// API Key-in .env faylında olduğundan əmin ol!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    console.log("🚀 Yükləmə prosesi başladı...");

    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });
    }

    // 2. Supabase Client (Service Role ilə - RLS-i aşmaq üçün)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { data: rawExcelData, pointsPerQuestion, examName } = body;

    // Default dəyərlər
    const multiplier = pointsPerQuestion ? Number(pointsPerQuestion) : 4;
    const finalQuizName = examName || "Test";

    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur və ya format səhvdir." }, { status: 400 });
    }

    // --- 3. GEMINI AI ANALİZİ 🧠 ---
    // Sənin istədiyin model (və ya 'gemini-1.5-flash' yaza bilərsən)
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // AI-a tapşırıq veririk
    const prompt = `
      Sən məktəb imtahan sistemi üçün verilənləri emal edən köməkçisən.
      Sənə Excel-dən çıxarılmış xam JSON məlumatı verəcəm.
      
      MƏQSƏD:
      Bu qarışıq datadan mənə lazım olan dəqiq JSON strukturunu çıxart.
      
      PARAMETRLƏR:
      - Bir sualın balı: ${multiplier}
      - Sınaq adı (Quiz Name): "${finalQuizName}"

      TƏLİMATLAR:
      1. Şagird ID-sini tap. Adətən "ZipGrade ID", "Student ID", "External Id" kimi olur. Mütləq String olmalıdır. Boşluqları sil.
      2. Düzgün cavab sayını tap ("Num Correct", "Corrects", "Düzgün" və s.).
      3. Sual sayını tap ("Num Questions", "Questions", "Sual sayı" və s.).
      4. Faizi tap ("Percent", "Percent Correct" və s.).
      
      HESABLAMALAR:
      - score = (Düzgün cavab sayı) * ${multiplier}
      - total = (Sual sayı) * ${multiplier}
      - wrong_count = (Sual sayı) - (Düzgün cavab sayı)
      - quiz = Əgər excel-də varsa onu götür, yoxdursa "${finalQuizName}" istifadə et.

      ÇIXIŞ FORMATI (YALNIZ JSON ARRAY):
      [
        {
          "student_id": "string",
          "quiz": "string",
          "correct_count": 0,
          "wrong_count": 0,
          "score": 0,
          "total": 0,
          "percent": 0
        }
      ]

      EMAL EDİLƏCƏK DATA:
      ${JSON.stringify(rawExcelData.slice(0, 50))} 
      (Qeyd: Yalnız ilk 50 sətri nümunə kimi göndərirəm ki, strukturu anlayasan, amma sənə hamısı lazımdırsa, məntiqi qur)
    `;
    
    // QEYD: Böyük fayllar üçün hamısını birbaşa prompta qoymaq limitə sala bilər. 
    // Ona görə AI-dan sadəcə "hansı sütunun hansı olduğunu" soruşub, map-i özümüz etsək daha sürətli olar.
    // AMMA sən "AI tapsın" dediyin üçün, gəl sadə mapping edək:

    // Daha sadə yanaşma: Biz AI-sız da, sütun adlarını dinamik tapa bilərik. 
    // Gəl AI əvəzinə, universal bir mapping yazaq, çünki bu daha dəqiq işləyir.
    
    // YENİ PLAN: AI-nı "Sütun adlarını tapmaq" üçün istifadə edirik.
    const columnPrompt = `
      Analyze these keys from a JSON object and identify which key corresponds to what:
      Keys: ${JSON.stringify(Object.keys(rawExcelData[0]))}
      
      Return ONLY a JSON object like this:
      {
        "id_col": "matching_key_for_id",
        "correct_col": "matching_key_for_correct_count",
        "total_questions_col": "matching_key_for_total_questions",
        "percent_col": "matching_key_for_percent",
        "quiz_name_col": "matching_key_for_quiz_name_or_null"
      }
    `;
    
    const result = await model.generateContent(columnPrompt);
    const mappingText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const mapping = JSON.parse(mappingText);
    
    console.log("AI Sütunları tapdı:", mapping);

    // --- 4. DATANIN HAZIRLANMASI ---
    const processedData = rawExcelData
      .filter((item: any) => item[mapping.id_col]) // ID-si olmayanları atırıq
      .map((item: any) => {
        const correct = Number(item[mapping.correct_col]) || 0;
        const totalQ = Number(item[mapping.total_questions_col]) || 0;
        
        return {
           student_id: String(item[mapping.id_col]).trim(),
           quiz: finalQuizName, // Adminin seçdiyi ad
           correct_count: correct,
           wrong_count: totalQ - correct,
           score: correct * multiplier,
           total: totalQ * multiplier,
           percent: Number(item[mapping.percent_col]) || 0
        };
      });

    console.log(`Emal olunan şagird sayı: ${processedData.length}`);

    // --- 5. BAZADA ŞAGİRDLƏRİ YOXLAYIRIQ (Foreign Key Xətası Olmasın) ---
    // Bu addım ÇOX VACİBDİR. Çünki şəkildə student_id -> students.exam_id əlaqəsi var.
    const studentIds = processedData.map((d: any) => d.student_id);
    
    const { data: foundStudents, error: findError } = await supabase
        .from('students')
        .select('exam_id')
        .in('exam_id', studentIds);

    if (findError) {
        console.error("Şagird axtarış xətası:", findError);
        return NextResponse.json({ error: "Baza xətası: " + findError.message }, { status: 500 });
    }

    const validIds = new Set(foundStudents?.map(s => s.exam_id));
    
    // Yalnız "students" cədvəlində olanları saxlayırıq
    const finalDataToInsert = processedData.filter((d: any) => validIds.has(d.student_id));

    console.log(`Bazada tapılan və yüklənəcək: ${finalDataToInsert.length} nəfər`);

    if (finalDataToInsert.length === 0) {
        return NextResponse.json({ 
            success: false, 
            message: `Excel-dəki ${processedData.length} şagirddən heç biri bazada tapılmadı. Şagird ID-lərini yoxlayın.` 
        });
    }

    // --- 6. BAZAYA YAZMAQ (UPSERT) ---
    // onConflict: "student_id, quiz" -> Eyni şagirdin eyni sınağı varsa, yeniləyir.
    const { data: insertedData, error: insertError } = await supabase
      .from("results")
      .upsert(finalDataToInsert, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      })
      .select();

    if (insertError) {
        console.error("YAZMA XƏTASI:", insertError);
        return NextResponse.json({ error: "Yazma xətası: " + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: finalDataToInsert.length,
        skipped_count: processedData.length - finalDataToInsert.length,
        message: `Uğurlu! ${finalDataToInsert.length} nəfər yükləndi.` 
    });

  } catch (e: any) {
    console.error("Ümumi Xəta:", e);
    return NextResponse.json({ error: "Kritik xəta: " + e.message }, { status: 500 });
  }
}
