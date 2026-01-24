import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Admin hüququ ilə qoşuluruq (RLS xətalarını keçmək üçün)
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
    // Sənin tokenindəki user.id yəqin ki rəqəmdir (məs: 16). Bu bizə lazımdır.
    return user;
  } catch { return null; }
}

// --- GET: Statusları gətir ---
export async function GET(request: Request) {
  try {
    const user = await getUser(); // user.id = 16 (rəqəm)
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    // 1. Müəllimin qruplarının ID-lərini tapırıq (Məsələn: [7, 8, 9, 10])
    const { data: teacherGroups } = await supabaseAdmin
        .from('groups')
        .select('id')
        .eq('teacher_id', user.id); // Rəqəm ilə axtarış

    const groupIds = teacherGroups?.map(g => g.id) || [];

    if (groupIds.length === 0) return NextResponse.json({ statuses: [] });

    // 2. Həmin qrupların statuslarını gətiririk
    const { data, error } = await supabaseAdmin
      .from('lesson_status')
      .select('group_id, lesson_date, status')
      .in('group_id', groupIds);

    if (error) throw error;

    return NextResponse.json({ statuses: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: Statusu Yaz ---
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const body = await request.json();
    const { groupId, date, status } = body; 

    // groupId burda rəqəm gəlir (məs: 7). Baza bunu qəbul edəcək.

    if (status === null) {
        // Silmək (Sıfırla)
        const { error } = await supabaseAdmin
            .from('lesson_status')
            .delete()
            .match({ group_id: groupId, lesson_date: date });
        if (error) throw error;
    } else {
        // Yazmaq/Yeniləmək
        const { error } = await supabaseAdmin
            .from('lesson_status')
            .upsert({ 
                group_id: groupId, 
                lesson_date: date, 
                status: status 
            }, { onConflict: 'group_id, lesson_date' }); // Bu constraint SQL-də yaratdığımız unique-ə əsaslanır
        if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
