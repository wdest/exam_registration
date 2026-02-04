// app/api/exam/start/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Front-dan gələn məlumatları alırıq
  const body = await request.json();
  const { exam_id, exam_name, student_info } = body;

  // 1. İstifadəçini yoxlayırıq (Login olubmu?)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 401 });
  }

  // 2. Məlumatları 'students' cədvəlinə yazırıq
  // Şəkildəki cədvəl strukturuna uyğunlaşdırdım
  const { error } = await supabase
    .from('students') 
    .insert({
      user_id: user.id, // vacibdir ki, bilim kimdir
      exam_id: exam_id,
      exam_name: exam_name,
      first_name: student_info.first_name, // Xarici şagirdlərin adı burdan gələcək
      last_name: student_info.last_name,
      phone1: student_info.phone, // Əgər varsa
      class: student_info.grade || "Naməlum",
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error("Baza xətası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
