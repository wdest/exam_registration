import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
// Import yolun işləyirsə, dəymə. Amma gələcəkdə "@/lib/admin-check" daha səliqəlidir.
import { checkAdminAuth } from "../../../lib/admin-check"; 

export async function POST(req: Request) {
  
  // 1. TƏHLÜKƏSİZLİK KİLİDİ (QAPICI)
  // Bu hissə çox vacibdir! "God Mode" açarını işlətməzdən əvvəl
  // əmin olmalıyıq ki, gələn adam həqiqətən Admindir.
  const isAdmin = await checkAdminAuth(); 

  if (!isAdmin) {
    return NextResponse.json({ error: "İcazəsiz giriş! (Access Denied)" }, { status: 401 });
  }

  // 2. SUPABASE "GOD MODE" CLIENT YARADIRIQ
  // 🔥 DƏYİŞİKLİK: Burada ANON yox, SERVICE_ROLE işlədirik!
  // Bu client RLS qadağalarına ilişmir.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // <-- Gizli Açar (.env-dən gəlir)
  );

  try {
    const body = await req.json();
    const { action, table, data, id } = body;

    let result;

    // 3. ƏMƏLİYYATLAR
    // createClient-i funksiyanın içinə saldım ki, hər sorğuda təmiz işləsin
    if (action === "insert") {
        const { data: resData, error } = await supabase.from(table).insert(data).select();
        if (error) throw error;
        result = resData;
    } 
    else if (action === "update") {
        const { data: resData, error } = await supabase.from(table).update(data).eq("id", id).select();
        if (error) throw error;
        result = resData;
    } 
    else if (action === "delete") {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        result = { success: true };
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
