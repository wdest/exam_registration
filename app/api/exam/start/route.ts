import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Supabase bağlantısını yaradırıq
  const supabase = createRouteHandlerClient({ cookies });
  
  // Front-dan gələn datanı oxuyuruq
  const body = await request.json();
  const { exam_id, exam_name, student_info } = body;

  // 1. Yoxlayırıq: Uşaq login olubmu?
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 401 });
  }

  // 2. Məlumatları DƏQİQ 'students' cədvəlinə yazırıq
  // Sənin 2-ci şəkildəki 'students' cədvəlinin sütunlarına uyğunlaşdırdım
  const { error } = await supabase
    .from('students') // <--- BURA 'students' OLMALIDIR
    .insert({
      user_id: user.id, // Login olan userin ID-si (Foreign Key)
      exam_id: String(exam_id), // Şəkildə varchar görünür
      exam_name: exam_name,
      first_name: student_info.first_name,
      last_name: student_info.last_name,
      phone1: student_info.phone, 
      class: student_info.grade || "Naməlum",
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("Baza xətası (students insert):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
