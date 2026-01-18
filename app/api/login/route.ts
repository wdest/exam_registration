import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Supabase "Service Role" açarı ilə (RLS-i yan keçmək üçün)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, identifier, password } = body; // type: 'teacher' | 'student' | 'admin'
    const cookieStore = cookies();

    let user = null;
    let role = "";
    let redirectUrl = "";

    // ------------------------------------------
    // 1. MÜƏLLİM GİRİŞİ (Database)
    // ------------------------------------------
    if (type === "teacher") {
      const { data, error } = await supabaseAdmin
        .from("teachers")
        .select("id, full_name, username")
        .ilike("username", identifier.trim())
        .eq("password", password)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "İstifadəçi adı və ya şifrə yanlışdır" }, { status: 401 });
      }
      user = data;
      role = "teacher";
      redirectUrl = "/teacher-cabinet";
    }

    // ------------------------------------------
    // 2. ŞAGİRD GİRİŞİ (Database)
    // ------------------------------------------
    else if (type === "student") {
      const { data, error } = await supabaseAdmin
        .from("local_students")
        .select("id, first_name, last_name")
        .eq("student_code", identifier.trim())
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Bu ID ilə şagird tapılmadı" }, { status: 401 });
      }
      user = data;
      role = "student";
      redirectUrl = "/student";
    }

    // ------------------------------------------
    // 3. ADMIN GİRİŞİ (Əlavə olaraq köhnə funksiyanı saxlamaq istəsən)
    // ------------------------------------------
    else if (type === "admin") {
      if (password === process.env.ADMIN_PASSWORD) {
         role = "admin";
         user = { id: 0, first_name: "Admin" }; // Saxta user obyekti
         redirectUrl = "/admin";
      } else {
         return NextResponse.json({ error: "Admin şifrəsi yanlışdır" }, { status: 401 });
      }
    } 
    
    else {
      return NextResponse.json({ error: "Yanlış giriş növü" }, { status: 400 });
    }

    // ------------------------------------------
    // COOKIE YARADILMASI (Möhür)
    // ------------------------------------------
    const tokenData = JSON.stringify({ 
      role, 
      id: user.id, 
      name: user.full_name || user.first_name 
    });

    // Next.js-in öz 'cookies' funksiyası (daha rahatdır)
    cookieStore.set("auth_token", tokenData, {
      httpOnly: true, // 🔒 JS oxuya bilməz
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 gün
    });

    return NextResponse.json({ success: true, redirect: redirectUrl });

  } catch (error: any) {
    console.error("Login Error:", error.message);
    return NextResponse.json({ error: "Sistem xətası" }, { status: 500 });
  }
}
