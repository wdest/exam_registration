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

// --- GET: Statusları və Əlavə Dərsləri Çəkmək ---
export async function GET(request: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    try {
        // Müəllimin bütün qruplarını tapırıq
        const { data: groups } = await supabaseAdmin.from('groups').select('id').eq('teacher_id', user.id);
        const groupIds = groups?.map(g => g.id) || [];

        if (groupIds.length === 0) return NextResponse.json({ extraLessons: [], lessonStatuses: [] });

        // 1. Statusları çəkirik
        const { data: statuses } = await supabaseAdmin
            .from('lesson_status')
            .select('*')
            .in('group_id', groupIds);

        // 2. Əlavə dərsləri çəkirik
        const { data: extras } = await supabaseAdmin
            .from('extra_lessons')
            .select('*')
            .in('group_id', groupIds);

        return NextResponse.json({ 
            lessonStatuses: statuses || [], 
            extraLessons: extras || [] 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// --- POST: Yeni Əlavə Dərs və ya Status Yeniləmə ---
export async function POST(request: Request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    try {
        const body = await request.json();
        const { type, ...data } = body;

        // A. Status Yeniləmə (Keçirildi / Ləğv)
        if (type === 'status') {
            const { groupId, date, status } = data;
            
            if (status === null) {
                // Statusu sil (Reset)
                await supabaseAdmin.from('lesson_status').delete().match({ group_id: groupId, lesson_date: date });
            } else {
                // Upsert (Varsa yenilə, yoxsa yarat)
                await supabaseAdmin.from('lesson_status').upsert({ 
                    group_id: groupId, 
                    lesson_date: date, 
                    status: status 
                }, { onConflict: 'group_id, lesson_date' });
            }
            return NextResponse.json({ success: true });
        }

        // B. Əlavə Dərs Yaratmaq
        if (type === 'extra_lesson') {
            const { error } = await supabaseAdmin.from('extra_lessons').insert([data]);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
