import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Service Key Yoxlanışı (Ən vacib!)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("❌ SƏHV: SUPABASE_SERVICE_ROLE_KEY tapılmadı (.env faylını yoxlayın)");
        return NextResponse.json({ error: "Serverdə açar tapılmadı. .env faylını yoxlayın." }, { status: 500 });
    }

    // 2. Admin yoxlanışı
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

    // 3. DATA EMALI (Sənin Excel Sütunlarına uyğun)
    const processedData = rawExcelData
      // "StudentID" sütunu varsa götürürük
      .filter((row: any) => row['StudentID'] || row['ZipGrade ID']) 
      .map((row: any) => {
        
        // Şəkil 5-dəki başlıqlar: StudentID, Earned Points, Possible Points
        const studentCode = row['StudentID'] || row['ZipGrade ID']; 
        
        // Rəqəmləri təmizləyirik
        const earnedPoints = Number(row['Earned Points']) || 0;     // Düzgün bal
        const possiblePoints = Number(row['Possible Points']) || 0; // Maksimum bal
        
        // Sənin Exceldə "Num Incorrect" yoxdur, ona görə hesablayırıq:
        // Səhv = Ümumi - Düzgün (boş qalanları da səhv saya bilərik və ya ayrıca)
        // Sadəlik üçün: Toplanmayan hər balı "wrong" kimi yazırıq.
        const numIncorrect = possiblePoints - earnedPoints; 
        const numCorrect = earnedPoints; 

        // Faiz Hesablanması (Exceldə PercentCorrect var, amma özümüz dəqiq hesablayaq)
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
           wrong_count: numIncorrect,   // Hesabladığımız səhv sayı
           correct_count: numCorrect    // Hesabladığımız düz sayı
        };
      });

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "StudentID tapılmadı. Excel formatını yoxlayın." });
    }

    // 4. BAZA İLƏ ƏLAQƏ (Service Role ilə)
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

    // 5. YAZMAQ (Upsert)
    // Addım 1-dəki SQL-i işlətməsən, bura XƏTA verəcək!
    const { error } = await supabase
      .from("results")
      .upsert(processedData, { 
          onConflict: "student_id,quiz",
          ignoreDuplicates: false 
      });

    if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: "Bazaya yazarkən xəta: " + error.message }, { status: 500 });
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
