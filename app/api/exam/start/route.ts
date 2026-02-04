import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 🔥 DÜZƏLİŞ BURDADIR:
    // Cookies-i əvvəlcədən çağırırıq ki, Supabase onu düzgün oxuya bilsin.
    const cookieStore = cookies();
    
    // Supabase-ə birbaşa 'cookies' funksiyasını yox, 'cookieStore' obyektini veririk
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Front-dan gələn datanı oxuyuruq
    const body = await request.json();
    const { exam_name } = body; 

    // 1. Useri yoxlayırıq
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı (Login olunmayıb)" }, { status: 401 });
    }

    // 2. 'local_students' cədvəlindən məlumatı çəkirik
    const { data: localStudent, error: fetchError } = await supabase
      .from('local_students')
      .select('first_name, last_name, student_code, phone') 
      .eq('user_id', user.id)
      .single();

    if (fetchError || !localStudent) {
      console.error("Local Student Fetch Error:", fetchError);
      return NextResponse.json({ error: "Sizin tələbə profiliniz tapılmadı. Zəhmət olmasa adminlə əlaqə saxlayın." }, { status: 404 });
    }

    // 3. Mapping edirik
    // student_code yoxdursa 'KOD_YOXDUR' yazırıq ki, baza xəta verməsin
    const examIdValue = localStudent.student_code ? String(localStudent.student_code) : "KOD_YOXDUR";

    const insertData = {
        user_id: user.id,
        exam_id: examIdValue,         
        exam_name: exam_name || "Naməlum İmtahan",
        first_name: localStudent.first_name,
        last_name: localStudent.last_name,
        phone1: localStudent.phone || "",
        created_at: new Date().toISOString()
    };

    console.log("Insert Data:", insertData);

    // 4. 'students' cədvəlinə yazırıq
    const { error: insertError } = await supabase
      .from('students')
      .insert(insertData);

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json({ error: "Bazaya yazarkən xəta: " + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    return NextResponse.json({ 
      error: "Sistem xətası: " + (error.message || "Naməlum xəta") 
    }, { status: 500 });
  }
}
