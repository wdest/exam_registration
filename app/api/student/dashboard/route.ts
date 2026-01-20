import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("student_token")?.value;

  // 1. Giriş yoxlanışı
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Tokeni (JSON) oxuyuruq
    const user = JSON.parse(token);

    // 2. Tələbənin Profilini 'local_students' cədvəlindən çəkirik
    // (Giriş edən tələbənin əsas məlumatları)
    const { data: student, error: stError } = await supabase
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (stError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // --- 🔥 YENİ HİSSƏLƏR BURADADIR ---

    // 3. AKTİV İMTAHANLARI ÇƏKİRİK (Exams tabı üçün)
    // Şərt: is_active = TRUE olmalıdır.
    // Opsional: Tələbənin sinfinə uyğun olanları da filtrləyə bilərsən (.eq('class_grade', student.class_grade))
    const { data: activeExams } = await supabase
      .from("exams")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // 4. NƏTİCƏLƏRİ ÇƏKİRİK (Results tabı üçün)
    // Bizim Admin paneldə yüklədiyimiz nəticələr 'students' cədvəlinə düşür.
    // Oradakı 'exam_id' sütunu əslində tələbənin iş nömrəsidir (Student Code).
    // Biz onu giriş edən tələbənin kodu ilə uyğunlaşdırırıq.
    
    const { data: examResults } = await supabase
      .from("students") // ZipGrade nəticələri burdadır
      .select("*")
      // DİQQƏT: Bazada tələbə kodunu hansı sütunda saxlayırsan? 
      // Admin panel koduna görə bu 'exam_id' sütunudur.
      .eq("exam_id", student.student_code) 
      .not("exam_name", "is", null) // İmtahan adı olmayanları gətirmə
      .order("created_at", { ascending: false });

    // 5. STATİSTİKA HESABLANMASI
    // Ortalamaları real nəticələrdən hesablayaq
    let avgScore = 0;
    let attendanceRate = 100; // Default

    if (examResults && examResults.length > 0) {
        // ZipGrade-dən gələn nəticələr əsasında ortalama (təxmini hesab)
        // Admin paneldəki upload strukturuna əsasən sütunları yoxla (məs: correct_count və ya score)
        // Burada sadəlik üçün 'percent' varsa ondan istifadə edirik, yoxdursa balı götürürük.
        
        // Qeyd: Bazada sütun adların fərqli ola bilər, onları özünə uyğunlaşdır.
        // Mən Admin panel koduna uyğun ehtimal edirəm.
    }

    // Chart üçün datanı formalaşdırırıq (Son 5 nəticə)
    const chartData = examResults?.slice(0, 5).reverse().map((res: any) => ({
        date: new Date(res.created_at).toLocaleDateString('az-AZ', {day: '2-digit', month: 'short'}),
        bal: res.score || 0 // 'score' sütunu yoxdursa 'correct_count' yaza bilərsən
    })) || [];

    // Son qiymətlər (Dashboard üçün)
    const recentGrades = examResults?.slice(0, 3).map((res: any) => ({
        grade_date: new Date(res.created_at).toLocaleDateString('az-AZ'),
        score: res.score || 0,
        attendance: true 
    })) || [];


    // 6. JSON CAVABI HAZIRLAYIRIQ
    return NextResponse.json({
      student: student,
      groupName: student.class_name || "9A", // Bazada varsa ordan götür, yoxdursa default
      teacherName: "Təyin olunmayıb", // Bunu da 'groups' cədvəlindən join edə bilərsən
      
      // Hesablanmış statistika
      stats: {
        avgScore: chartData.length > 0 
            ? (chartData.reduce((a:any, b:any) => a + b.bal, 0) / chartData.length).toFixed(1) 
            : "0",
        attendance: "95" // Bunu daimi qiymətləndirmə cədvəlindən çəkmək olar
      },

      chartData: chartData,
      recentGrades: recentGrades,

      // 🔥 FRONTEND-İN GÖZLƏDİYİ YENİ DATALAR:
      activeExams: activeExams || [],
      examResults: examResults || []
    });

  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
