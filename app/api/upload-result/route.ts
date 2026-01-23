import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. Service Role Key Yoxlanışı (Yazmaq icazəsi üçün)
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

    // 3. DATA EMALI (Sənin ZipGrade sütunlarına uyğunlaşdırma)
    const processedData = rawExcelData
      // Şərt: Ya "ZipGrade ID" olsun, ya da "StudentID"
      .filter((row: any) => row['ZipGrade ID'] || row['StudentID']) 
      .map((row: any) => {
        
        // A. Şagirdin Kodu (ID)
        const studentCode = row['ZipGrade ID'] || row['StudentID']; 

        // B. Düzgün Cavab Sayı (Score)
        // Bəzi fayllarda "Num Correct", bəzilərində "Earned Points" olur.
        // Hər ikisini yoxlayırıq.
        let correctCount = 0;
        if (row['Num Correct'] !== undefined) {
            correctCount = Number(row['Num Correct']);
        } else if (row['Earned Points'] !== undefined) {
            correctCount = Number(row['Earned Points']);
        }

        // C. Ümumi Sual Sayı (Total)
        // "Num Questions" və ya "Possible Points"
        let totalCount = 0;
        if (row['Num Questions'] !== undefined) {
            totalCount = Number(row['Num Questions']);
        } else if (row['Possible Points'] !== undefined) {
            totalCount = Number(row['Possible Points']);
        }

        // D. Səhv Sayı (Wrong)
        // "Num Incorrect" varsa götürürük, yoxdursa hesablayırıq (Total - Düz)
        let wrongCount = 0;
        if (row['Num Incorrect'] !== undefined) {
            wrongCount = Number(row['Num Incorrect']);
        } else {
            wrongCount = totalCount - correctCount;
        }

        // E. Faiz (Percent)
        // "Percent Correct" sütunu varsa götür, yoxdursa hesabla.
        // ZipGrade bəzən "85.0" verir, bəzən "85". Biz onu ədədə çeviririk.
        let percent = 0;
        if (row['Percent Correct'] !== undefined) {
             percent = parseFloat(String(row['Percent Correct']).replace('%', ''));
        } else if (totalCount > 0) {
             percent = Number(((correctCount / totalCount) * 100).toFixed(1));
        }

        // F. Baza Obyekti (Supabase sütunlarına yazırıq)
        return {
           student_id: String(studentCode).trim(), // ID
           quiz: examName,                         // İmtahan adı (Frontdan gələn)
           score: correctCount,                    // Bal
           total: totalCount,                      // Ümumi sual
           percent: percent,                       // Faiz
           correct_count: correctCount,            // Düz sayı
           wrong_count: wrongCount,                // Səhv sayı
           created_at: new Date().toISOString()    // İndiki vaxt
        };
      });

    if (processedData.length === 0) {
        return NextResponse.json({ success: false, message: "ZipGrade ID tapılmadı. Excel faylını yoxlayın." });
    }

    // 4. BAZA İLƏ ƏLAQƏ (Admin Açarı ilə)
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
    // Addım 1-dəki SQL kodunu işlətməsən, bura xəta verəcək!
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
