import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase client yaradılması
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
        return NextResponse.json({ error: "Məlumat formatı yanlışdır." }, { status: 400 });
    }

    // Gələn məlumatları 'results' cədvəlinə yazırıq (Upsert - əgər varsa yeniləyir)
    const { error } = await supabase
      .from("results")
      .upsert(data, { onConflict: "student_id,quiz" });

    if (error) {
        throw new Error(error.message);
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: data.length, 
        message: "Uğurla yükləndi." 
    });

  } catch (e: any) {
    console.error("API Xətası:", e.message);
    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
