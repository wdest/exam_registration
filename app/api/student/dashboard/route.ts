import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // 🔥 Next.js 15+ üçün cookies() await edilməlidir
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("student_token")?.value;

    if (!tokenValue) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(tokenValue);

    // Local student yoxlanışı
    const { data: localData } = await supabase
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    let studentProfile = localData;
    let isLocal = !!localData;
    let studentCode = localData?.student_code || "";

    // Əgər local deyilsə, ödənişli tələbəni yoxla
    if (!studentProfile) {
      const { data: extData } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (extData) {
        studentProfile = extData;
        studentCode = extData.exam_id || extData.id.toString();
      }
    }

    if (!studentProfile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Aktiv imtahanlar
    const { data: activeExams } = await supabase
      .from("exams")
      .select("*")
      .eq("is_active", true);

    // Nəticələr
    let examResults = [];
    if (isLocal) {
        const { data: results } = await supabase
            .from("students")
            .select("*")
            .eq("exam_id", studentCode)
            .not("exam_name", "is", null);
        examResults = results || [];
    } else {
        const searchKey = studentProfile.phone1;
        if (searchKey) {
            const { data: results } = await supabase
                .from("students")
                .select("*")
                .eq("phone1", searchKey);
            examResults = results || [];
        }
    }

    return NextResponse.json({
      student: {
          id: studentProfile.id,
          first_name: studentProfile.first_name,
          last_name: studentProfile.last_name,
      },
      groupName: isLocal ? (studentProfile.class_name || "Kurs") : "Ödənişli",
      teacherName: isLocal ? "Təyin olunub" : "Mərkəz",
      stats: { avgScore: "0", attendance: "100" },
      chartData: [],
      recentGrades: [],
      activeExams: activeExams || [],
      examResults: examResults || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
