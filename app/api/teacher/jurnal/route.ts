import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    const user = JSON.parse(token);
    // Əgər rol yoxlanışı lazımdırsa:
    // if (user.role !== 'teacher') return null;
    return user;
  } catch { return null; }
}

// --- GET: Məlumatları Oxumaq ---
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const groupId = searchParams.get('groupId');
  const date = searchParams.get('date');

  try {
    // A. Qrup Üzvlərini Gətir
    if (type === 'members' && groupId) {
        const { data } = await supabaseAdmin
            .from('group_members')
            .select(`student_id, local_students ( * )`)
            .eq('group_id', groupId);
        
        // @ts-ignore
        const students = data?.map((item: any) => item.local_students) || [];
        return NextResponse.json({ students });
    }

    // B. Konkret Tarix üçün Qiymətləri Gətir
    if (type === 'grades' && groupId && date) {
        const { data } = await supabaseAdmin
            .from('daily_grades')
            .select('*')
            .eq('group_id', groupId)
            .eq('grade_date', date);
        return NextResponse.json({ grades: data });
    }

    // C. Analiz
    if (type === 'analytics' && groupId) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const { data } = await supabaseAdmin
            .from('daily_grades')
            .select('*')
            .eq('group_id', groupId)
            .gte('grade_date', oneYearAgo.toISOString())
            .order('grade_date', { ascending: true });
        return NextResponse.json({ allGrades: data });
    }

    return NextResponse.json({ error: "Yanlış sorğu" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: Məlumat Yazmaq ---
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, groupId, studentId, date, gradesData } = body;

    // 1. Şagirdi Qrupa Əlavə Et
    if (action === 'add_member') {
        // Yoxlayaq ki, bu qrup həqiqətən bu müəllimindir
        const { data: group } = await supabaseAdmin
            .from('groups')
            .select('id')
            .eq('id', groupId)
            .eq('teacher_id', user.id)
            .single();
            
        if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 404 });

        // a) Qrupa əlavə edirik (Dynamic Join üçün bu kifayətdir!)
        const { error } = await supabaseAdmin
            .from('group_members')
            .insert({ group_id: groupId, student_id: studentId });
        
        if (error) throw error;

        // 🔥 DÜZƏLİŞ: local_students cədvəlini update etməyə ehtiyac yoxdur.
        // Çünki teacher_id artıq group_members -> groups zənciri ilə tapılır.

        return NextResponse.json({ success: true });
    }

    // 2. Qiymətləri Yadda Saxla
    if (action === 'save_grades') {
         // Köhnə qiymətləri silirik ki, dublikat olmasın
         await supabaseAdmin.from('daily_grades').delete().eq('group_id', groupId).eq('grade_date', date);
         
         // Yeni qiymətləri yazırıq
         const { error } = await supabaseAdmin.from('daily_grades').insert(gradesData);
         if (error) throw error;
         
         return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
