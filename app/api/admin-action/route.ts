import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
// Əgər "../../../" xəta versə, "@/" ilə yoxla. Amma sən dedin relative işləyir.
import { checkAdminAuth } from "../../../lib/admin-check"; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  
  // 1. TƏHLÜKƏSİZLİK KİLİDİ
  // checkAdminAuth() artıq Promise qaytarır, ona görə await etməliyik
  const isAdmin = await checkAdminAuth(); // <-- await əlavə olundu

  if (!isAdmin) {
    return NextResponse.json({ error: "İcazəsiz giriş! (Access Denied)" }, { status: 401 });
  }

  try {
    const { action, table, data, id } = await req.json();

    // 2. ƏMƏLİYYATLAR
    if (action === "insert") {
        const { error } = await supabase.from(table).insert(data);
        if (error) throw error;
    } 
    else if (action === "update") {
        const { error } = await supabase.from(table).update(data).eq("id", id);
        if (error) throw error;
    } 
    else if (action === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
