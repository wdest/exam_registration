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

    // 1. ƏSAS MƏLUMATLAR (Şagird + Qrup + Müəllim) - Bir sorğuda
    // Nested Select: local_students -> group_members -> groups -> teachers
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("local_students")
      .select(`
        *,
        group_members (
            groups (
                name,
                teachers ( full_name )
            )
        )
      `)
      .eq("id", user.id)
      .single();

    if (studentError || !studentData) {
        return NextResponse.json({ error: "Şagird tapılmadı" }, { status: 404 });
    }

    // Datanı parçalayırıq
    const activeGroup = studentData.group_members?.[0]?.groups;
    const groupName = activeGroup?.name || "Təyin olunmayıb";
    const teacherName = activeGroup?.teachers?.full_name || "Təyin olunmayıb";

    // 2. PARALEL SORĞULAR (Sürət üçün hamısını eyni anda göndəririk)
    const [gradesRes, activeExamsRes, examResultsRes, allStudentsRes] = await Promise.all([
        // A. Qiymətlər
        supabaseAdmin
            .from("daily_grades")
            .select("score, attendance, grade_date")
            .eq("student_id", studentData.id)
            .order("grade_date", { ascending: true }),

        // B. Aktiv İmtahanlar (Sinifə uyğun)
        supabaseAdmin
            .from("exams")
            .select("*")
            .eq("class_grade", studentData.grade)
            .order("created_at", { ascending: false }),

        // C. İmtahan Nəticələri
        supabaseAdmin
            .from("results")
            .select("*")
            .eq("student_id", studentData.student_code) // Student Code ilə yoxlanış
            .order("created_at", { ascending: false }),

        // D. Reytinq üçün Bütün Şagirdlər
        supabaseAdmin
            .from("local_students")
            .select("id, student_code, first_name, last_name, grade, daily_grades(score, grade_date)")
    ]);

    // 3. STATİSTİKA HESABLANMASI
    const grades = gradesRes.data || [];
    let avgScore = 0;
    let attendanceRate = "0";
    let chartData: any[] = [];
    let recentGrades: any[] = [];

    if (grades.length > 0) {
        const scores = grades.filter(g => g.score !== null).map(g => g.score);
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            avgScore = parseFloat((sum / scores.length).toFixed(1));
        }

        const presentCount = grades.filter(g => g.attendance).length;
        attendanceRate = ((presentCount / grades.length) * 100).toFixed(0);

        // Qrafik üçün son 10 dərs
        chartData = grades.slice(-10).map(g => ({
            date: g.grade_date.slice(5), // Ay-Gün (MM-DD)
            bal: g.score
        }));
        
        // Gündəlik üçün son 5 nəticə (Tərsinə)
        recentGrades = [...grades].reverse().slice(0, 5);
    }

    // 4. REYTİNQ HESABLANMASI
    let rankings = [];
    const allStudentsRaw = allStudentsRes.data;

    if (allStudentsRaw) {
        const now = new Date();
        const currentMonth = now.getMonth(); 
        const currentYear = now.getFullYear();

        rankings = allStudentsRaw.map((st: any) => {
            const stGrades = st.daily_grades || [];

            // Bütün zamanlar
            const allScores = stGrades.filter((g: any) => g.score !== null).map((g: any) => g.score);
            const allTimeAvg = allScores.length > 0 
                ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length 
                : 0;

            // Bu ay
            const monthlyScores = stGrades.filter((g: any) => {
                if (g.score === null) return false;
                const d = new Date(g.grade_date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            }).map((g: any) => g.score);

            const monthlyAvg = monthlyScores.length > 0
                ? monthlyScores.reduce((a: number, b: number) => a + b, 0) / monthlyScores.length
                : 0;

            const AVATARS = ["👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️", "👩‍🔬", "👨‍🎨"];
            const randomAvatar = AVATARS[st.id % AVATARS.length]; 

            return {
                id: st.id,
                displayId: st.student_code,
                name: `${st.first_name} ${st.last_name}`,
                allTimeScore: parseFloat(allTimeAvg.toFixed(1)),
                monthlyScore: parseFloat(monthlyAvg.toFixed(1)),
                class: st.grade,
                avatar: randomAvatar 
            };
        });

        // Reytinqə görə sırala (Bütün zamanlar default)
        rankings.sort((a, b) => b.allTimeScore - a.allTimeScore);
    }

    // 5. DATA RESPONSE
    return NextResponse.json({
        student: {
            ...studentData,
            group_members: undefined // Lazımsız datanı təmizləyirik
        },
        groupName,
        teacherName,
        stats: { avgScore: avgScore.toFixed(1), attendance: attendanceRate },
        chartData,
        recentGrades,
        activeExams: activeExamsRes.data || [], 
        examResults: examResultsRes.data || [],
        rankings: rankings
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
