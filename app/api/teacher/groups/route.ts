import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Admin açarı (RLS-i keçmək üçün)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Köməkçi funksiya
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

// --- GET: Qrupları Gətir ---
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ groups: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: Yeni Qrup Yarat ---
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const body = await request.json();
    const { name, schedule } = body;

    const { error } = await supabaseAdmin
      .from('groups')
      .insert([{ 
        name, 
        schedule, 
        teacher_id: user.id 
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
