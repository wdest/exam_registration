import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });

    const body = await req.json();
    const { data: rawExcelData, examName } = body;

    // Excel-in boş olub olmadığını yoxlayırıq
    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur." }, { status: 400 });
    }

    // Əgər imtahan adı seçilməyibsə, xəta verək
    if (!examName) {
        return NextResponse.json({ error: "İmtahan adı seçilməyib." }, { status: 400 });
    }

    // 2. DATA EMALI (Sənin istədiyin məntiqlə)
    const processedData = rawExcelData
      // Yalnız ID-si olan sətirləri götürürük
      .filter((row: any) => row['ZipGrade ID'] || row['Student ID']) 
      .map((row: any) => {
        
        // A. Dəyərləri oxuyuruq (ZipGrade standart başlıqları)
        const studentCode = row['ZipGrade ID'] || row['Student ID']; // ID
        const earnedPoints = Number(row['Earned Points']) || 0;      // Topladığı bal (Score)
        const possiblePoints = Number(row['Possible Points']) || 0;  // Maksimum bal (Total)
        const numIncorrect = Number(row['Num Incorrect']) || 0;      // Səhv sayı
        const numCorrect = Number(row['Num Correct']) || 0;          // Düz sayı (Lazım olsa)

        // B. Faizi hesablayırıq (Özümüz)
        // (Topladığı / Maksimum) * 100. Nöqtədən sonra 1 rəqəm saxlayırıq.
        let calculatedPercent = 0;
        if (possiblePoints > 0) {
            calculatedPercent = parseFloat(((earnedPoints / possiblePoints) * 100).toFixed(1));
        }

        // C. Obyekti hazırlayırıq (Supabase sütunlarına uyğun)
        return {
           student_id: String(studentCode).trim(), // ID String kimi
           quiz: examName,                         // Frontdan gələn imtahan adı
           score: earnedPoints,                    // Earned Points -> Score
           total: possiblePoints,                  // Possible Points -> Total
           percent: calculatedPercent,             // Hesabladığımız faiz
           wrong_count: numIncorrect,              // Səhv sayı
           correct_count: numCorrect               // Düz sayı (əlavə olaraq yazırıq)
        };
      });

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "ZipGrade ID-si olan heç bir sətir tapılmadı. Excel başlıqlarını yoxlayın." });
    }

    // 3. BAZA İLƏ ƏLAQƏ
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. BAZAYA YAZMAQ (Upsert)
    // 'student_id' və 'quiz' cütlüyü təkrarlanarsa, məlumatı yeniləyir.
    const { error } = await supabase
      .from("results")
      .upsert(processedData, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      });

    if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: "Baza xətası: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: processedData.length
    });

  } catch (e: any) {
    console.error("API Error:", e);
    return NextResponse.json({ error: "Server xətası: " + e.message }, { status: 500 });
  }
}
