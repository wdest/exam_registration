import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkAdminAuth } from ""../../../lib/admin-check";

// Server tərəfdə işləyən Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  // 1. TƏHLÜKƏSİZLİK KİLİDİ: Kuki yoxdursa, qapıdan qovuruq! 🔒
  if (!checkAdminAuth()) {
    return NextResponse.json({ error: "İcazəsiz giriş! (Access Denied)" }, { status: 401 });
  }

  try {
    const { action, table, data, id } = await req.json();
    let query;

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
