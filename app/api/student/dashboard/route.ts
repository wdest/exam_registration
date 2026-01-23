import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Admin açarı ilə Supabase (RLS-i keçmək üçün)
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

    // 1. Şagirdi tapırıq
    const { data: student, error } = await supabaseAdmin
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !student) return NextResponse.json({ error: "Şagird tapılmadı" }, { status: 404 });

    // 2. Müəllim və Qrup adını tapırıq
    let groupName = "Təyin olunmayıb";
    let teacherName = "Təyin olunmayıb";

    // Müəllim
    if (student.teacher_id) {
        const { data: teacher } = await supabaseAdmin
            .from("teachers")
            .select("full_name")
            .eq("id", student.teacher_id)
            .single();
        if (teacher) teacherName = teacher.full_name;
    }

    // Qrup
    const { data: groupMember } = await supabaseAdmin
        .from("group_members")
        .select("group_id, groups(name)")
        .eq("student_id", student.id)
        .single();

    if (groupMember && groupMember.groups) {
        // @ts-ignore
        groupName = groupMember.groups.name;
    }

    // 3. GÜNDƏLİK QİYMƏTLƏR VƏ STATİSTİKA (Gündəlik dərslər üçün)
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

        // Chart Data (Son 10 dərs - Qrafik üçün)
        chartData = grades.slice(-10).map(g => ({
            date: g.grade_date.slice(5), // Ay-Gün
            bal: g.score
        }));

        // Son Qiymətlər (Cədvəl üçün tərsinə çeviririk)
        recentGrades = [...grades].reverse().slice(0, 5);
    }

    // 4. 🔥 YENİ: AKTİV İMTAHANLAR (Adminin yaratdığı linklər)
    // Şagirdin sinfinə uyğun olanları gətiririk
    const { data: activeExams } = await supabaseAdmin
        .from("exams") // Bazada 'exams' cədvəlin olduğunu fərz edirik
        .select("*")
        .eq("class_grade", student.grade) // Şagirdin sinfinə uyğun
        .order("created_at", { ascending: false });

    // 5. 🔥 YENİ: ŞAGİRDİN İMTAHAN NƏTİCƏLƏRİ (Exceldən yüklənənlər)
    const { data: examResults } = await supabaseAdmin
        .from("results") // Bazada 'results' cədvəli
        .select("*")
        .eq("student_id", student.student_code) // Student Code ilə axtarırıq (ZipGrade ID)
        .order("created_at", { ascending: false });

    // 6. MƏLUMATI GÖNDƏRİRİK
    return NextResponse.json({
        student,
        groupName,
        teacherName,
        stats: { avgScore, attendance: attendanceRate },
        chartData,
        recentGrades,
        // Frontend-dəki yeni tablar üçün:
        activeExams: activeExams || [], 
        examResults: examResults || []
    });

  } catch (error) {
    console.error("Dashboard API xətası:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
