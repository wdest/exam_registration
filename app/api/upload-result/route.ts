import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export async function POST(req: Request) {
  try {
    // 1. Admin yoxlanışı
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });
    }

    // 2. Service Role Client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
        return NextResponse.json({ error: "Məlumat formatı yanlışdır." }, { status: 400 });
    }

    // 🔥 DÜZƏLİŞ BURADADIR: DUBLİKATLARI SİLİRİK 🔥
    // Eyni student_id və quiz cütlüyündən yalnız birini saxlayırıq.
    const uniqueDataMap = new Map();

    data.forEach((item) => {
        // Hər sətir üçün unikal açar yaradırıq (məs: "12345-Almaniya")
        const uniqueKey = `${item.student_id}-${item.quiz}`;
        // Map-ə yazırıq. Əgər eyni açar varsa, üstündən yazır (sonuncunu saxlayır)
        uniqueDataMap.set(uniqueKey, item);
    });

    // Təmizlənmiş listi alırıq
    const cleanedData = Array.from(uniqueDataMap.values());

    console.log(`Gələn sətir: ${data.length}, Təmizlənmiş sətir: ${cleanedData.length}`);

    // 3. Bazaya yazırıq (Upsert)
    const { error } = await supabase
      .from("results")
      .upsert(cleanedData, { onConflict: "student_id,quiz" });

    if (error) {
        // Əgər yenə xəta olsa, dəqiq səbəbi görək
        console.error("Supabase Error:", error);
        throw new Error(error.message);
    }

    return NextResponse.json({ 
        success: true, 
        processed_count: cleanedData.length, 
        message: "Uğurla yükləndi." 
    });

  } catch (e: any) {
    console.error("API Xətası:", e.message);
    return NextResponse.json({ error: "Xəta: " + e.message }, { status: 500 });
  }
}
