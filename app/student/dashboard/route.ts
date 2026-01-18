import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = JSON.parse(token);
    if (user.role !== 'student') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 1. Şagird Məlumatı
    const { data: student } = await supabaseAdmin
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Qrup və Müəllim Məlumatı
    let groupName = "Qrup yoxdur";
    let teacherName = "Təyin edilməyib";

    const { data: memberData } = await supabaseAdmin
      .from("group_members")
      .select("group_id")
      .eq("student_id", user.id)
      .single();

    if (memberData) {
      const { data: groupData } = await supabaseAdmin
        .from("groups")
        .select("name, teacher_id")
        .eq("id", memberData.group_id)
        .single();

      if (groupData) {
        groupName = groupData.name;
        
        if (groupData.teacher_id) {
          const { data: teacherData } = await supabaseAdmin
            .from("teachers")
            .select("first_name, last_name")
            .eq("id", groupData.teacher_id)
            .single();
          
          if (teacherData) {
            teacherName = `${teacherData.first_name} ${teacherData.last_name}`;
          }
        }
      }
    }

    // 3. Qiymətlər və Analitika
    const { data: grades } = await supabaseAdmin
      .from("daily_grades")
      .select("*")
      .eq("student_id", user.id)
      .order("grade_date", { ascending: true });

    let stats = { avgScore: "0", attendance: "0" };
    let chartData: any[] = [];
    let recentGrades: any[] = [];

    if (grades && grades.length > 0) {
      // Ortalama
      const scoredGrades = grades.filter((g: any) => g.score !== null);
      const avg = scoredGrades.length > 0 
        ? scoredGrades.reduce((a: number, b: any) => a + b.score, 0) / scoredGrades.length 
        : 0;
      
      // Davamiyyət
      const presentCount = grades.filter((g: any) => g.attendance === true).length;
      const attRate = (presentCount / grades.length) * 100;

      stats = {
        avgScore: avg.toFixed(1),
        attendance: attRate.toFixed(0)
      };

      // Qrafik üçün son 10 nəticə
      chartData = scoredGrades.slice(-10).map((g: any) => ({
        date: g.grade_date.slice(5), 
        bal: g.score 
      }));

      // Son cədvəl üçün son 5 nəticə (tərsinə)
      recentGrades = [...grades].reverse().slice(0, 5);
    }

    return NextResponse.json({
      student,
      groupName,
      teacherName,
      stats,
      chartData,
      recentGrades
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
