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
    if (user.role !== 'teacher') return null;
    return user;
  } catch { return null; }
}

// GET: Şagirdləri gətir
export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { data, error } = await supabaseAdmin
        .from('local_students')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ students: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Yarat, Yenilə, Sil, Toplu Sil
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const body = await request.json();
    const { action, studentData, id, ids } = body; // ids -> Toplu silmək üçün

    // 1. YENİ ŞAGİRD
    if (action === 'create') {
        const { error } = await supabaseAdmin.from('local_students').insert([{ ...studentData, teacher_id: user.id }]);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    // 2. YENİLƏMƏ
    if (action === 'update') {
        const { error } = await supabaseAdmin.from('local_students').update(studentData).eq('id', id).eq('teacher_id', user.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    // 3. TƏK SİLMƏ
    if (action === 'delete') {
        const { error } = await supabaseAdmin.from('local_students').delete().eq('id', id).eq('teacher_id', user.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    // 4. 🔥 YENİ: TOPLU SİLMƏ (BULK DELETE)
    if (action === 'bulk_delete') {
        if (!ids || ids.length === 0) return NextResponse.json({ error: "Seçim yoxdur" }, { status: 400 });
        
        const { error } = await supabaseAdmin
            .from('local_students')
            .delete()
            .in('id', ids) // ID-ləri massivdən yoxlayır
            .eq('teacher_id', user.id); // Təhlükəsizlik: Yalnız öz şagirdlərini

        if (error) throw error;
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
