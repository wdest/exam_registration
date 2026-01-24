import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Admin açarı (RLS-i keçmək üçün)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Köməkçi funksiya: Useri yoxla
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

// --- POST: Yeni Qrup Yarat (Tam Validasiya ilə) ---
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const body = await request.json();
    const { name, schedule } = body;

    // 1. Sadə yoxlamalar
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: "Qrup adı düzgün deyil" }, { status: 400 });
    }

    if (!schedule || typeof schedule !== 'string') {
        return NextResponse.json({ error: "Cədvəl formatı düzgün deyil" }, { status: 400 });
    }

    // 2. Formatı yoxla: "B.e 09:00-10:30"
    const slots = schedule.split(", ");
    
    for (const slot of slots) {
        const parts = slot.trim().split(" ");
        
        // Gün və Saat hissəsi olmalıdır
        if (parts.length !== 2) {
            return NextResponse.json({ error: `Format xətası: "${slot}". Gözlənilən: "Gün Saat-Saat"` }, { status: 400 });
        }

        const timeRange = parts[1]; // "09:00-10:30"
        
        // Tire (-) mütləq olmalıdır
        if (!timeRange.includes("-")) {
             return NextResponse.json({ error: `Bitmə vaxtı qeyd edilməyib: "${slot}"` }, { status: 400 });
        }

        const [start, end] = timeRange.split("-");

        // Saatların düzgünlüyünü yoxla (Regex)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(start) || !timeRegex.test(end)) {
            return NextResponse.json({ error: `Saat formatı yanlışdır: "${timeRange}"` }, { status: 400 });
        }

        // Məntiq: Bitmə vaxtı başlamadan tez ola bilməz
        if (start >= end) {
            return NextResponse.json({ error: `Bitmə vaxtı başlama vaxtından tez ola bilməz: "${slot}"` }, { status: 400 });
        }
    }

    // 3. Bazaya yaz
    const { error } = await supabaseAdmin
      .from('groups')
      .insert([{ 
        name: name.trim(), 
        schedule: schedule.trim(), 
        teacher_id: user.id 
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
