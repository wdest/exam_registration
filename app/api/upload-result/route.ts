import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Service Role Key Yoxlanışı
    // Bu açar RLS (Policies) qaydalarından yan keçmək üçün lazımdır.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Server Xətası: SUPABASE_SERVICE_ROLE_KEY tapılmadı." }, { status: 500 });
    }

    // 2. Admin Yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });

    const body = await req.json();
    const { data: rawExcelData, examName } = body;

    // Excel yoxlanışı
    if (!rawExcelData || !Array.isArray(rawExcelData) || rawExcelData.length === 0) {
      return NextResponse.json({ error: "Excel boşdur." }, { status: 400 });
    }

    if (!examName) {
        return NextResponse.json({ error: "İmtahan adı seçilməyib." }, { status: 400 });
    }

    // 3. DEBUG: Sütun adlarını konsola yazırıq (Vercel Log-da görmək üçün)
    const headers = Object.keys(rawExcelData[0]);
    console.log("Excel Headers:", headers);

    // 4. DATA EMALI
    const processedData = rawExcelData
      // "StudentID" və ya "ZipGrade ID" olan sətirləri götürürük
      .filter((row: any) => row['StudentID'] || row['ZipGrade ID']) 
      .map((row: any) => {
        
        // Şəkil 5-dəki başlıqlara uyğun oxuyuruq
        const studentCode = row['StudentID'] || row['ZipGrade ID']; 
        
        // Rəqəmləri təmizləyirik (Vergül varsa nöqtə ilə əvəz edirik)
        const parseNum = (val: any) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            return Number(String(val).replace(',', '.')) || 0;
        };

        const earnedPoints = parseNum(row['Earned Points']);
        const possiblePoints = parseNum(row['Possible Points']);
        
        // Səhv sayını hesablayırıq: (Maksimum - Düzgün)
        const numIncorrect = possiblePoints - earnedPoints; 
        
        // Düzgün cavab sayı = Bal (əgər 1 sual 1 baldırsa)
        const numCorrect = earnedPoints; 

        // Faizi hesablayırıq
        let calculatedPercent = 0;
        if (possiblePoints > 0) {
            calculatedPercent = Number(((earnedPoints / possiblePoints) * 100).toFixed(1));
        }

        return {
           student_id: String(studentCode).trim(), // ID-ni mətnə çeviririk
           quiz: examName,
           score: earnedPoints,
           total: possiblePoints,
           percent: calculatedPercent,
           wrong_count: numIncorrect,
           correct_count: numCorrect
        };
      });

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "StudentID tapılmadı. Excel faylını yoxlayın." });
    }

    // 5. BAZA İLƏ ƏLAQƏ (Admin Açarı ilə)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
      }
    );

    // 6. BAZAYA YAZMAQ (Upsert)
    // Addım 1-dəki SQL kodunu işlətməsən, bura xəta verəcək!
    const { error } = await supabase
      .from("results")
      .upsert(processedData, { 
          onConflict: "student_id,quiz", // Bu constraint bazada olmalıdır
          ignoreDuplicates: false 
      });

    if (error) {
        console.error("Supabase Error:", error);
        // Xətanı dəqiq qaytarırıq ki, "Bilinməyən xəta" olmasın
        return NextResponse.json({ error: "Baza Xətası: " + error.message + " (Constraint yoxdur?)" }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: processedData.length
    });

  } catch (e: any) {
    console.error("API Error:", e);
    return NextResponse.json({ error: "Server Xətası: " + e.message }, { status: 500 });
  }
}
