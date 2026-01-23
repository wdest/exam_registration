import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    // 1. ŞAGİRDİ TAPIRIQ
    const { data: student, error } = await supabaseAdmin
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !student) return NextResponse.json({ error: "Şagird tapılmadı" }, { status: 404 });

    // 2. MÜƏLLİM VƏ QRUP
    let groupName = "Təyin olunmayıb";
    let teacherName = "Təyin olunmayıb";

    if (student.teacher_id) {
        const { data: teacher } = await supabaseAdmin.from("teachers").select("full_name").eq("id", student.teacher_id).single();
        if (teacher) teacherName = teacher.full_name;
    }

    const { data: groupMember } = await supabaseAdmin.from("group_members").select("group_id, groups(name)").eq("student_id", student.id).single();
    if (groupMember && groupMember.groups) {
        // @ts-ignore
        groupName = groupMember.groups.name;
    }

    // 3. STATİSTİKA VƏ CHART (Şagirdin özü üçün)
    const { data: grades } = await supabaseAdmin
        .from("daily_grades")
        .select("score, attendance, grade_date")
        .eq("student_id", student.id)
        .order("grade_date", { ascending: true });

    let avgScore = 0;
    let attendanceRate = "0";
    let chartData: any[] = [];
    let recentGrades: any[] = [];

    if (grades && grades.length > 0) {
        const scores = grades.filter(g => g.score !== null).map(g => g.score);
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            avgScore = parseFloat((sum / scores.length).toFixed(1));
        }

        const presentCount = grades.filter(g => g.attendance).length;
        attendanceRate = ((presentCount / grades.length) * 100).toFixed(0);

        chartData = grades.slice(-10).map(g => ({
            date: g.grade_date.slice(5),
            bal: g.score
        }));
        recentGrades = [...grades].reverse().slice(0, 5);
    }

    // 4. İMTAHANLAR (Sadəcə məlumat üçün, sıralamaya təsir etmir)
    const { data: activeExams } = await supabaseAdmin
        .from("exams")
        .select("*")
        .eq("class_grade", student.grade)
        .order("created_at", { ascending: false });

    const { data: examResults } = await supabaseAdmin
        .from("results")
        .select("*")
        .eq("student_id", student.student_code)
        .order("created_at", { ascending: false });

    // 5. 🔥 SIRALAMA (YALNIZ DAILY_GRADES İLƏ) 🔥
    // Bütün şagirdləri və onların gündəlik qiymətlərini çəkirik
    const { data: allStudentsRaw } = await supabaseAdmin
        .from("local_students")
        .select("id, first_name, last_name, grade, daily_grades(score, grade_date)");

    let rankings = [];

    if (allStudentsRaw) {
        const now = new Date();
        const currentMonth = now.getMonth(); // 0-11
        const currentYear = now.getFullYear();

        rankings = allStudentsRaw.map((st: any) => {
            const grades = st.daily_grades || [];

            // A. BÜTÜN ZAMANLAR ÜÇÜN ORTALAMA
            const allScores = grades.filter((g: any) => g.score !== null).map((g: any) => g.score);
            const allTimeAvg = allScores.length > 0 
                ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length 
                : 0;

            // B. BU AY ÜÇÜN ORTALAMA
            const monthlyScores = grades.filter((g: any) => {
                if (g.score === null) return false;
                const d = new Date(g.grade_date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).map((g: any) => g.score);

            const monthlyAvg = monthlyScores.length > 0
                ? monthlyScores.reduce((a: number, b: number) => a + b, 0) / monthlyScores.length
                : 0; // Əgər bu ay qiymət yoxdursa 0 olur

            // Avatar (Random)
            const AVATARS = ["👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️", "👩‍🔬", "👨‍🎨"];
            const randomAvatar = AVATARS[st.id % AVATARS.length]; 

            return {
                id: st.id,
                name: `${st.first_name} ${st.last_name}`,
                allTimeScore: parseFloat(allTimeAvg.toFixed(1)),
                monthlyScore: parseFloat(monthlyAvg.toFixed(1)),
                class: st.grade,
                avatar: randomAvatar 
            };
        });

        // Default olaraq All Time-a görə sıralayıb göndəririk (Front-end yenidən sıralayacaq)
        rankings.sort((a, b) => b.allTimeScore - a.allTimeScore);
    }

    return NextResponse.json({
        student,
        groupName,
        teacherName,
        stats: { avgScore: avgScore.toFixed(1), attendance: attendanceRate },
        chartData,
        recentGrades,
        activeExams: activeExams || [], 
        examResults: examResults || [],
        rankings: rankings // Hesablanmış təmiz data
    });

  } catch (error) {
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
