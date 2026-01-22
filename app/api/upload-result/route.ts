import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check"; // Admin yoxlama funksiyan

export async function POST(req: Request) {
  try {
    // 1. TƏHLÜKƏSİZLİK: Admin olub olmadığını yoxlayırıq
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "Giriş qadağandır! (Hacker detected 🚨)" }, { status: 401 });
    }

    // 2. Body-ni oxuyuruq
    const body = await req.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
        return NextResponse.json({ error: "Məlumat formatı yanlışdır." }, { status: 400 });
    }

    // 3. Supabase Admin Client yaradırıq (Service Role ilə)
    // Bu kod yalnız serverdə işlədiyi üçün açar gizli qalır
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    // 4. Məlumatları yazırıq
    const { error } = await supabase
      .from("results") // Cədvəl adının düzgünlüyünə əmin ol (students və ya results)
      .upsert(data, { onConflict: "student_id,quiz" }); // Təkrarı qarşısını alır

    if (error) throw error;

    return NextResponse.json({ 
        success: true, 
        processed_count: data.length, 
        message: "Uğurla və təhlükəsiz yükləndi." 
    });

  } catch (e: any) {
    console.error("API Xətası:", e.message);
    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
