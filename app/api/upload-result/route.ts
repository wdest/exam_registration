import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Service Role Key Yoxlanışı (Çox vacib!)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Server Xətası: .env faylında SUPABASE_SERVICE_ROLE_KEY yoxdur!" }, { status: 500 });
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

    // 3. DATA EMALI (Hər iki Excel formatını nəzərə alırıq)
    const processedData = rawExcelData
      // Şərt: ID mütləq olmalıdır
      .filter((row: any) => row['ZipGrade ID'] || row['StudentID']) 
      .map((row: any) => {
        
        // A. Şagirdin Kodu (ID)
        const studentCode = row['ZipGrade ID'] || row['StudentID']; 

        // B. Rəqəmləri təmizləyən köməkçi funksiya (Vergülü nöqtəyə çevirir)
        const cleanNum = (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
            return 0;
        };

        // C. Düzgün Cavab Sayı (Score)
        // Bəzi fayllarda "Num Correct", bəzilərində "Earned Points" olur.
        let correctCount = cleanNum(row['Num Correct'] ?? row['Earned Points']);

        // D. Ümumi Sual Sayı (Total)
        // "Num Questions" və ya "Possible Points"
        let totalCount = cleanNum(row['Num Questions'] ?? row['Possible Points']);

        // E. Səhv Sayı (Wrong)
        // "Num Incorrect" varsa götürürük, yoxdursa hesablayırıq (Total - Düz)
        let wrongCount = 0;
        if (row['Num Incorrect'] !== undefined) {
            wrongCount = cleanNum(row['Num Incorrect']);
        } else {
            wrongCount = totalCount - correctCount;
        }

        // F. Faiz (Percent)
        // "Percent Correct" sütunu varsa götür, yoxdursa hesabla.
        let percent = 0;
        if (row['Percent Correct'] !== undefined) {
             let pVal = String(row['Percent Correct']).replace('%', '');
             percent = cleanNum(pVal);
        } else if (totalCount > 0) {
             percent = Number(((correctCount / totalCount) * 100).toFixed(1));
        }

        return {
           student_id: String(studentCode).trim(), // ID
           quiz: examName,                         // İmtahan adı
           score: correctCount,                    // Bal
           total: totalCount,                      // Ümumi sual
           percent: percent,                       // Faiz
           correct_count: correctCount,            // Düz sayı
           wrong_count: wrongCount,                // Səhv sayı
           created_at: new Date().toISOString()    // Tarix
        };
      });

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "Faylda 'StudentID' və ya 'ZipGrade ID' tapılmadı." });
    }

    // 4. BAZA İLƏ ƏLAQƏ
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

    // 5. BAZAYA YAZMAQ (Upsert)
    // Addım 1-dəki SQL-i işlətməsən, bura XƏTA verəcək!
    const { error } = await supabase
      .from("results")
      .upsert(processedData, { 
          onConflict: "student_id,quiz", // Bu constraint bazada olmalıdır
          ignoreDuplicates: false 
      });

    if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: "Baza Xətası: " + error.message }, { status: 500 });
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
