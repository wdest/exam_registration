import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Supabase Service Role (Admin icazəsi ilə)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, identifier, password } = body;
    const cookieStore = await cookies();

    let user = null;
    let role = "";
    let redirectUrl = "";

    // ==========================================
    // 1. MÜƏLLİM GİRİŞİ
    // ==========================================
    if (type === "teacher") {
      // Müəllimi bazada axtarırıq
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
      
      // 🛑 ƏN VACİB YER: Müəllimi hara ataq?
      redirectUrl = "/teacher-cabinet"; 
    }

    // ==========================================
    // 2. ŞAGİRD GİRİŞİ
    // ==========================================
    else if (type === "student") {
      // Şagird kodunu yoxlayırıq
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
      
      // Şagirdi hara ataq?
      redirectUrl = "/student";
    }

    // ==========================================
    // 3. ADMIN GİRİŞİ (Gizli)
    // ==========================================
    else if (type === "admin") {
       // Check against env var or fallback for development if needed.
       // Ideally should only be env var.
       if (password === process.env.ADMIN_PASSWORD) {
          user = { id: 0, first_name: "Admin" };
          role = "admin";
          redirectUrl = "/admin"; // Admin bura gedir
       } else {
          return NextResponse.json({ error: "Admin şifrəsi yanlışdır" }, { status: 401 });
       }
    }
    
    else {
      return NextResponse.json({ error: "Yanlış giriş növü" }, { status: 400 });
    }

    // ==========================================
    // KUKİ YARADILMASI
    // ==========================================
    
    // Köhnə kukiləri silirik (Təmizlik işi)
    cookieStore.delete("auth_token");
    cookieStore.delete("student_token");

    const tokenData = JSON.stringify({ 
      role, 
      id: user.id, 
      name: user.full_name || user.first_name 
    });

    cookieStore.set("auth_token", tokenData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 gün
    });

    // Admin üçün xüsusi kuki
    if (role === "admin") {
      cookieStore.set("super_admin_access", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 gün
      });
    }

    return NextResponse.json({ success: true, redirect: redirectUrl });

  } catch (error: any) {
    console.error("Login Server Xətası:", error.message);
    return NextResponse.json({ error: "Sistem xətası baş verdi" }, { status: 500 });
  }
}
