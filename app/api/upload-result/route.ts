import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log("🚀 API Started: Upload Results"); // Log 1

  try {
    // 1. Service Role Key Yoxlanışı
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY tapılmadı! .env faylını yoxlayın.");
    }

    // 2. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
        console.log("❌ Admin deyil");
        return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });
    }

    const body = await req.json();
    const { data: rawExcelData, examName } = body;

    console.log(`📂 Gələn data sayı: ${rawExcelData?.length}, İmtahan: ${examName}`); // Log 2

    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur." }, { status: 400 });
    }

    if (!examName) {
        return NextResponse.json({ error: "İmtahan adı seçilməyib." }, { status: 400 });
    }

    // 3. DATA EMALI
    const processedData = rawExcelData
      .filter((row: any) => row['StudentID'] || row['ZipGrade ID']) 
      .map((row: any) => {
        const studentCode = row['StudentID'] || row['ZipGrade ID']; 
        // Dəyərləri təmizləyirik (vergül varsa nöqtə ilə əvəz edirik)
        const parseNum = (val: any) => {
            if (typeof val === 'string') return Number(val.replace(',', '.'));
            return Number(val) || 0;
        };

        const earnedPoints = parseNum(row['Earned Points']);
        const possiblePoints = parseNum(row['Possible Points']);
        
        let numIncorrect = parseNum(row['Num Incorrect']);
        if (!row['Num Incorrect'] && row['Num Incorrect'] !== 0) {
            numIncorrect = possiblePoints - earnedPoints;
        }

        let numCorrect = parseNum(row['Num Correct']);
        if (!row['Num Correct'] && row['Num Correct'] !== 0) {
            numCorrect = earnedPoints; 
        }

        let calculatedPercent = 0;
        if (possiblePoints > 0) {
            calculatedPercent = Number(((earnedPoints / possiblePoints) * 100).toFixed(1));
        }

        return {
           student_id: String(studentCode).trim(),
           quiz: examName,
           score: earnedPoints,
           total: possiblePoints,
           percent: calculatedPercent,
           wrong_count: numIncorrect,
           correct_count: numCorrect
        };
      });

    console.log(`✅ Emal edilmiş data: ${processedData.length} sətir.`); // Log 3

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "StudentID tapılmadı. Excel formatını yoxlayın." });
    }

    // 4. BAZA ƏLAQƏSİ
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bu mütləq olmalıdır
      {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      }
    );

    console.log("💾 Bazaya yazılır..."); // Log 4

    // 5. YAZMAQ
    // DİQQƏT: Əgər SQL Constraint yoxdursa, bura partlayacaq
    const { data, error } = await supabase
      .from("results")
      .upsert(processedData, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      })
      .select();

    if (error) {
        console.error("❌ Supabase Error:", error); // Terminalda qırmızı xəta görəcəksən
        return NextResponse.json({ error: "Baza xətası (SQL Constraint yoxdur?): " + error.message }, { status: 500 });
    }

    console.log("🎉 Uğurla yazıldı!", data?.length); // Log 5

    return NextResponse.json({ 
        success: true, 
        processed_count: processedData.length
    });

  } catch (e: any) {
    console.error("🔥 SERVER CRASH:", e); // Ən vacib log
    return NextResponse.json({ error: "Server xətası: " + e.message }, { status: 500 });
  }
}
