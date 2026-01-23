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

    if (!examName) {
        return NextResponse.json({ error: "İmtahan adı seçilməyib." }, { status: 400 });
    }

    // 2. DATA EMALI (Şəkillərdəki sütun adlarına uyğun)
    const processedData = rawExcelData
      // Şəkil 6-da görünür ki, başlıq "StudentID"-dir. Hər ehtimala qarşı "ZipGrade ID"-ni də yoxlayırıq.
      .filter((row: any) => row['StudentID'] || row['ZipGrade ID']) 
      .map((row: any) => {
        
        // A. Dəyərləri oxuyuruq
        // Şəkil 6-ya əsasən: StudentID, Earned Points, Possible Points
        const studentCode = row['StudentID'] || row['ZipGrade ID']; 
        const earnedPoints = Number(row['Earned Points']) || 0;      // Score
        const possiblePoints = Number(row['Possible Points']) || 0;  // Total
        
        // ZipGrade bəzən "Num Incorrect" sütunu verir, vermirsə hesablayırıq
        // (Maksimum bal - Topladığı bal = Səhv sayı + Boş sayı)
        // Əgər Excel-də "Num Incorrect" varsa onu götür, yoxdursa fərqi yaz.
        let numIncorrect = Number(row['Num Incorrect']);
        if (isNaN(numIncorrect)) {
            numIncorrect = possiblePoints - earnedPoints;
        }

        // Düzgün cavab sayı (adətən bala bərabərdir, amma yenə də varsa götürək)
        let numCorrect = Number(row['Num Correct']);
        if (isNaN(numCorrect)) {
            numCorrect = earnedPoints; // Sadə məntiqlə: 1 sual = 1 baldırsa
        }

        // B. Faizi hesablayırıq
        // Şəkil 6-da "PercentCorrect" var, amma sən dedin özümüz hesablayaq.
        // (Score / Total) * 100
        let calculatedPercent = 0;
        if (possiblePoints > 0) {
            // Nöqtədən sonra 1 rəqəm saxlayırıq (məs: 92.5)
            calculatedPercent = Number(((earnedPoints / possiblePoints) * 100).toFixed(1));
        }

        // C. Obyekti hazırlayırıq (Supabase sütunlarına uyğun)
        return {
           student_id: String(studentCode).trim(), // ID String kimi
           quiz: examName,                         // Frontdan gələn imtahan adı
           score: earnedPoints,                    // Earned Points
           total: possiblePoints,                  // Possible Points
           percent: calculatedPercent,             // Bizim hesabladığımız faiz
           wrong_count: numIncorrect,              // Hesabladığımız səhv sayı
           correct_count: numCorrect               // Düz sayı
        };
      });

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "StudentID olan heç bir sətir tapılmadı. Excel faylını yoxlayın." });
    }

    // 3. BAZA İLƏ ƏLAQƏ
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. BAZAYA YAZMAQ (Upsert)
    // DİQQƏT: Bazada (student_id, quiz) cütlüyü üçün constraint olmalıdır!
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
