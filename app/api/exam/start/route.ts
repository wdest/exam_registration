import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Front-dan sadəcə imtahanın adını alırıq (Məlumat olsun deyə)
  const body = await request.json();
  const { exam_name } = body;

  // 1. İstifadəçini tapırıq (user_id lazımdır)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 401 });
  }

  // 2. 'local_students' cədvəlindən bu userin kodunu və adını çəkirik
  const { data: localStudent, error: fetchError } = await supabase
    .from('local_students')
    .select('student_code, first_name, last_name') // Bizə lazım olanlar
    .eq('user_id', user.id)
    .single();

  if (fetchError || !localStudent) {
    console.error("Local Student tapılmadı:", fetchError);
    return NextResponse.json({ error: "Profil məlumatları tapılmadı." }, { status: 404 });
  }

  // 3. İndi sənin dediyin kimi 'students' cədvəlinə yazırıq
  // student_code -> exam_id yerinə gedir
  
  const insertData = {
      user_id: user.id,
      
      // 🔥 DİQQƏT: Sənin istədiyin mapping burdadır:
      exam_id: String(localStudent.student_code), // Student Code-u Exam ID yerinə yazırıq
      
      first_name: localStudent.first_name,
      last_name: localStudent.last_name,
      
      // İmtahanın adı da düşsün ki, hansı imtahan olduğunu biləsən
      exam_name: exam_name, 
      
      created_at: new Date().toISOString()
  };

  const { error: insertError } = await supabase
    .from('students')
    .insert(insertData);

  if (insertError) {
    console.error("Insert Xətası:", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
