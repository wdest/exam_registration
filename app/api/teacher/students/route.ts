import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Supabase Admin Client (Admin hüququ ilə işləyir)
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

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, id, studentData, ids } = body;

    // --- CREATE: Şagird "Ümumi Baza"ya düşür (Müəllimsiz) ---
    if (action === 'create') {
        const { error } = await supabaseAdmin
            .from("local_students")
            .insert([{
                ...studentData,
                user_id: null // 🔥 DÜZDÜR: Hələ ki heç kimin deyil
            }]);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    if (action === 'update') {
        const { error } = await supabaseAdmin.from("local_students").update(studentData).eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
        const { error } = await supabaseAdmin.from("local_students").delete().eq("id", id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }
    
    if (action === 'bulk_delete') {
        const { error } = await supabaseAdmin.from("local_students").delete().in("id", ids);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔥 ƏSAS DƏYİŞİKLİK BURADADIR
export async function GET(request: Request) {
    // 1. Şagirdləri, qruplarını və MÜƏLLİMLƏRİNİ çəkirik
    // Nested Select: local_students -> group_members -> groups -> teachers
    
    const { data, error } = await supabaseAdmin
        .from("local_students")
        .select(`
            *,
            group_members (
                groups (
                    id,
                    name,
                    teacher_id,
                    teachers (
                        full_name,
                        username
                    )
                )
            )
        `)
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 2. Datanı Frontend üçün sadələşdiririk
    
    const formattedStudents = data.map((student: any) => {
        // Əgər şagird hər hansı bir qrupdadırsa, ilk tapılanı götürürük
        const activeGroupInfo = student.group_members?.[0]?.groups;
        const teacherInfo = activeGroupInfo?.teachers;

        return {
            ...student,
            // Filterləmə və Görüntü üçün sahələr:
            teacher_id: activeGroupInfo?.teacher_id || null, 
            group_name: activeGroupInfo?.name || null,
            
            // Müəllimin adı (yoxdursa username götürürük)
            teacher_name: teacherInfo?.full_name || teacherInfo?.username || null,
            
            // Artıq yükləri təmizləyirik
            group_members: undefined 
        };
    });

    return NextResponse.json({ students: formattedStudents });
}
