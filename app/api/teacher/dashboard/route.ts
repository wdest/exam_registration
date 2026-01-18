import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Giriş edilməyib" }, { status: 401 });
  }

  try {
    const user = JSON.parse(token);

    // Yalnız müəllimləri buraxırıq
    if (user.role !== 'teacher') {
      return NextResponse.json({ error: "İcazə yoxdur" }, { status: 403 });
    }

    // Müəllimin məlumatlarını bazadan çəkirik
    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !teacher) {
        return NextResponse.json({ error: "Müəllim tapılmadı" }, { status: 404 });
    }

    return NextResponse.json({ teacher });

  } catch (error) {
    return NextResponse.json({ error: "Sistem xətası" }, { status: 500 });
  }
}
