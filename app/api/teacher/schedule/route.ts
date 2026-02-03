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
  try { return JSON.parse(token); } catch { return null; }
}

// --- GET: Məlumatları Gətir ---
export async function GET(request: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    try {
        // Müəllimin qruplarını tapırıq
        const { data: groups } = await supabaseAdmin.from('groups').select('id').eq('teacher_id', user.id);
        const groupIds = groups?.map(g => g.id) || [];

        if (groupIds.length === 0) return NextResponse.json({ extraLessons: [], lessonStatuses: [] });

        // Statusları və Ekstra dərsləri çəkirik
        const [statusesRes, extrasRes] = await Promise.all([
            supabaseAdmin.from('lesson_status').select('*').in('group_id', groupIds),
            supabaseAdmin.from('extra_lessons').select('*').in('group_id', groupIds)
        ]);

        return NextResponse.json({ 
            lessonStatuses: statusesRes.data || [], 
            extraLessons: extrasRes.data || [] 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: Status Dəyiş və ya Əlavə Dərs Yarat (Secure) ---
export async function POST(request: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    try {
        const body = await request.json();
        const { type, ...data } = body;

        // 1. TƏHLÜKƏSİZLİK YOXLAMASI: Qrup bu müəllimindirmi?
        let targetGroupId = data.groupId || data.group_id; // Frontend-dən gələn ada görə
        if (!targetGroupId) return NextResponse.json({ error: "Qrup ID çatışmır" }, { status: 400 });

        const { data: groupCheck } = await supabaseAdmin
            .from('groups')
            .select('id')
            .eq('id', targetGroupId)
            .eq('teacher_id', user.id) // 🔥 YALNIZ ÖZ QRUPU
            .single();

        if (!groupCheck) {
            return NextResponse.json({ error: "Bu qrup üzərində əməliyyat icazəniz yoxdur!" }, { status: 403 });
        }

        // 2. STATUS YENİLƏMƏ
        if (type === 'status') {
            const { groupId, date, status } = data;
            if (status === null) {
                await supabaseAdmin.from('lesson_status').delete().match({ group_id: groupId, lesson_date: date });
            } else {
                const { error } = await supabaseAdmin.from('lesson_status').upsert({ 
                    group_id: groupId, 
                    lesson_date: date, 
                    status: status 
                }, { onConflict: 'group_id, lesson_date' });
                if (error) throw error;
            }
            return NextResponse.json({ success: true });
        }

        // 3. ƏLAVƏ DƏRS YARATMAQ
        if (type === 'extra_lesson') {
            const { error } = await supabaseAdmin.from('extra_lessons').insert([{
                group_id: data.group_id,
                lesson_date: data.lesson_date,
                start_time: data.start_time,
                end_time: data.end_time
            }]);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Yanlış əməliyyat növü" }, { status: 400 });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Server xətası" }, { status: 500 });
    }
}
