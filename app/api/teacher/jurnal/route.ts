import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  try {
    const user = JSON.parse(token);
    if (user.role !== 'teacher') return null;
    return user;
  } catch { return null; }
}

// --- GET METODU (Olduğu kimi qalır) ---
export async function GET(request: Request) {
  // ... (Bura dəymə, əvvəlki kimi qalsın) ...
  // Sadəlik üçün buranı qısaldıram, sən özündəki GET-i saxlaya bilərsən
  return NextResponse.json({ message: "GET is working" });
}

// --- POST METODU (YENİLƏNƏCƏK HİSSƏ) ---
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, groupId, studentId, date, gradesData } = body;

    // 1. Şagirdi Qrupa Əlavə Et
    if (action === 'add_member') {
        // Yoxlayaq ki, bu qrup həqiqətən bu müəllimindir
        const { data: group } = await supabaseAdmin.from('groups').select('id').eq('id', groupId).eq('teacher_id', user.id).single();
        if (!group) return NextResponse.json({ error: "Qrup tapılmadı" }, { status: 404 });

        // a) Qrupa əlavə edirik (insert)
        const { error: insertError } = await supabaseAdmin
            .from('group_members')
            .insert({ group_id: groupId, student_id: studentId });
        
        // 🔥 DÜZƏLİŞ: Əgər uşaq artıq qrupdadırsa, xəta verməsin, davam etsin
        if (insertError) {
            // "23505" kodu Postgres-də unique violation (təkrar qeyd) deməkdir.
            // Yəni uşaq qrupda varsa, bunu error sayma, davam et.
            if (insertError.code !== '23505') {
                throw insertError; 
            }
        }

        // 🔥 b) Şagirdi bu müəllimə mənimsədirik (Ən vacib hissə)
        // İstər yeni əlavə olunsun, istər köhnə qrupda olsun, bu kod mütləq işləməlidir
        const { error: updateError } = await supabaseAdmin
            .from('local_students')
            .update({ user_id: user.id })
            .eq('id', studentId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    }

    // 2. Qiymətləri Yadda Saxla (Olduğu kimi)
    if (action === 'save_grades') {
         await supabaseAdmin.from('daily_grades').delete().eq('group_id', groupId).eq('grade_date', date);
         const { error } = await supabaseAdmin.from('daily_grades').insert(gradesData);
         if (error) throw error;
         return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Yanlış əməliyyat" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
