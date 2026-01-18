import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// 🛑 DİQQƏT: Burda Service Role Key (Admin Açarı) işlədirik
// Bu bizə imkan verir ki, RLS-ə ilişmədən müəllimin adını oxuyaq.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return NextResponse.json({ error: "Token yoxdur" }, { status: 401 });

  try {
    const user = JSON.parse(token);

    // 1. Şagirdi tapırıq (Admin açarı ilə)
    const { data: student, error } = await supabaseAdmin
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !student) return NextResponse.json({ error: "Şagird tapılmadı" }, { status: 404 });

    // 2. Məlumatları hazırlayırıq
    let groupName = "Təyin olunmayıb";
    let teacherName = "Təyin olunmayıb";

    // A. Müəllimi tapmaq
    // student.teacher_id varsa, gidib teachers cədvəlindən adını gətiririk
    if (student.teacher_id) {
        const { data: teacher } = await supabaseAdmin
            .from("teachers")
            .select("full_name")
            .eq("id", student.teacher_id)
            .single();
        
        if (teacher) {
            teacherName = teacher.full_name;
        }
    }

    // B. Qrupu tapmaq
    const { data: groupMember } = await supabaseAdmin
        .from("group_members")
        .select("group_id, groups(name)")
        .eq("student_id", student.id)
        .single();

    if (groupMember && groupMember.groups) {
        // @ts-ignore
        groupName = groupMember.groups.name;
    }

    // 3. Statistikaları Hesablamaq
    const { data: grades } = await supabaseAdmin
        .from("daily_grades")
        .select("score, attendance, grade_date")
        .eq("student_id", student.id)
        .order("grade_date", { ascending: true });

    let avgScore = "0";
    let attendanceRate = "0";
    let chartData: any[] = [];
    let recentGrades: any[] = [];

    if (grades && grades.length > 0) {
        // Ortalama Bal
        const scores = grades.filter(g => g.score !== null).map(g => g.score);
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            avgScore = (sum / scores.length).toFixed(1);
        }

        // Davamiyyət
        const presentCount = grades.filter(g => g.attendance).length;
        attendanceRate = ((presentCount / grades.length) * 100).toFixed(0);

        // Chart Data (Son 10 dərs)
        chartData = grades.slice(-10).map(g => ({
            date: g.grade_date.slice(5), // Ay-Gün
            bal: g.score
        }));

        // Son Qiymətlər (Tərsinə çeviririk)
        recentGrades = [...grades].reverse().slice(0, 5);
    }

    // 4. Hazır Məlumatı Göndəririk
    return NextResponse.json({
        student,
        groupName,
        teacherName, // <--- Bu artıq düzgün gələcək (Məs: "Əli Vəliyev")
        stats: { avgScore, attendance: attendanceRate },
        chartData,
        recentGrades
    });

  } catch (error) {
    console.error("Server xətası:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
