import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Giriş edilməyib" }, { status: 401 });
    }

    const user = JSON.parse(token);

    // Yalnız şagirdlər üçün işləsin
    if (user.role !== 'student') {
        return NextResponse.json({ error: "İcazəniz yoxdur" }, { status: 403 });
    }

    // Şagirdin şəxsi məlumatlarını çəkirik
    const { data: student, error } = await supabaseAdmin
      .from("local_students")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ student });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
