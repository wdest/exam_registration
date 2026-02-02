import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, identifier, password } = body;
    const cookieStore = await cookies();

    console.log("\n================ GİRİŞ CƏHDİ BAŞLADI ================");
    console.log(`👤 Növ: ${type}`);
    console.log(`🔢 Daxil edilən ID/Kod: '${identifier}'`);
    console.log(`🔑 Daxil edilən Access Code: '${password}'`);

    let user = null;
    let role = "";
    let redirectUrl = "";

    // 1. MÜƏLLİM
    if (type === "teacher") {
      const { data, error } = await supabaseAdmin
        .from("teachers")
        .select("*")
        .ilike("username", identifier.trim())
        .eq("password", password)
        .single();

      if (error || !data) {
        console.log("❌ Müəllim tapılmadı. Səbəb:", error ? error.message : "Məlumat yoxdur");
        return NextResponse.json({ error: "Məlumatlar yanlışdır" }, { status: 401 });
      }
      user = data;
      role = "teacher";
      redirectUrl = "/teacher-cabinet";
    }

    // 2. ŞAGİRD (DEBUG REJİMİ)
    else if (type === "student") {
      
      // A) Əvvəlcə yoxlayaq görək belə bir Şagird Kodu varmı?
      console.log("🔍 Şagird axtarılır...");
      
      const { data: studentFound, error: searchError } = await supabaseAdmin
        .from("local_students")
        .select("student_code, access_code")
        .eq("student_code", identifier.trim()) // Kodun özünü yoxlayırıq
        .single();

      if (searchError || !studentFound) {
        console.log("❌ SƏHV: Bu 'student_code' bazada tapılmadı!");
        console.log("   --> Sən yazdın:", identifier);
        console.log("   --> Bazada axtarıldı: student_code sütunu");
        return NextResponse.json({ error: "Bu kodla şagird tapılmadı!" }, { status: 401 });
      }

      console.log("✅ Şagird tapıldı! İndi Access Code yoxlanır...");
      console.log(`   --> Bazadakı Access Code: '${studentFound.access_code}'`);
      console.log(`   --> Sənin yazdığın:       '${password}'`);

      // B) İndi Access Code-u yoxlayaq
      if (studentFound.access_code !== password.trim()) {
        console.log("❌ SƏHV: Access Code uyğun gəlmir!");
        return NextResponse.json({ error: "Access Code yanlışdır!" }, { status: 401 });
      }

      // C) Hər şey düzdürsə, tam datanı alaq
      const { data: fullData } = await supabaseAdmin
        .from("local_students")
        .select("id, first_name, last_name")
        .eq("student_code", identifier.trim())
        .single();

      console.log("🎉 UĞURLU: Giriş edilir...");
      user = fullData;
      role = "student";
      redirectUrl = "/student";
    }

    // 3. ADMIN
    else if (type === "admin") {
       if (password === process.env.ADMIN_PASSWORD) {
          user = { id: 0, first_name: "Admin" };
          role = "admin";
          redirectUrl = "/admin"; 
       } else {
          return NextResponse.json({ error: "Admin şifrəsi səhvdir" }, { status: 401 });
       }
    }

    // KUKİ YAZILMASI
    cookieStore.delete("auth_token");
    const tokenData = JSON.stringify({ role, id: user.id, name: user.full_name || user.first_name });
    cookieStore.set("auth_token", tokenData, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 86400 });

    console.log("================ GİRİŞ UĞURLU SONLANDI ================\n");
    return NextResponse.json({ success: true, redirect: redirectUrl });

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
