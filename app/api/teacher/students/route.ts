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

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, id, studentData, ids } = body;

    if (action === 'create') {
        const { error } = await supabaseAdmin
            .from("local_students")
            .insert([{
                ...studentData,
                user_id: null // 🔥 Manual əlavədə də müəllim NULL olur
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

export async function GET(request: Request) {
    // Bütün şagirdləri gətirir ki, axtarışda hamı çıxsın
    const { data, error } = await supabaseAdmin
        .from("local_students")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ students: data });
}
