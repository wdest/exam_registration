import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase Client funksiyası
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Server xətası: Supabase qoşulmadı" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const examName = searchParams.get("examName");

    if (!id) return NextResponse.json({ error: "ID daxil edilməyib" }, { status: 400 });

    // 1. ADDIM: Əvvəlcə Şagirdi axtarırıq (Kod və İmtahan adına görə)
    // Diqqət: 'exam_id' sizin şagirdə verdiyiniz unikal koddur (məs: 19576598)
    let studentQuery = supabase
      .from("students")
      .select("first_name, last_name, class, exam_name, exam_id")
      .eq("exam_id", id);

    // Əgər imtahan adı seçilibsə, onu da yoxlayırıq
    if (examName) {
       studentQuery = studentQuery.eq("exam_name", examName);
    }

    const { data: student, error: studentError } = await studentQuery.maybeSingle();

    if (studentError) {
        console.error("Student Error:", studentError);
        return NextResponse.json({ error: "Şagird axtarışında xəta oldu" }, { status: 500 });
    }

    if (!student) {
        return NextResponse.json({ error: "Bu imtahan üzrə belə bir kod tapılmadı." }, { status: 404 });
    }

    // 2. ADDIM: İndi bu şagirdin Nəticəsini axtarırıq
    // 'results' cədvəlindəki 'student_id' ilə 'students' cədvəlindəki 'exam_id' eynidir
    const { data: result, error: resultError } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", id) // Burada da həmin kodu yoxlayırıq
        .maybeSingle();

    if (resultError) {
         console.error("Result Error:", resultError);
         return NextResponse.json({ error: "Nəticə axtarışında xəta oldu" }, { status: 500 });
    }

    if (!result) {
        // Şagird var, amma nəticə hələ yüklənməyib
        return NextResponse.json({ 
            students: student,
            message: "Nəticə hələ yoxdur"
        });
    }

    // 3. ADDIM: Məlumatları birləşdirib Frontend-ə göndəririk
    const finalData = {
        ...result,       // Nəticə məlumatları (score, percent və s.)
        students: student // Şagird məlumatları (ad, soyad)
    };

    return NextResponse.json(finalData);

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST metodu olduğu kimi qalır...
// (Bura əvvəlki POST metodunu olduğu kimi saxlaya bilərsiniz)
