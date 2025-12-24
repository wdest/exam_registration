import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Azərbaycan hərflərini düzgün böyüdüb-kiçiltmək üçün
function toTitleCaseAz(s: any) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase('az') + w.slice(1).toLocaleLowerCase('az'))
    .join(" ");
}

async function generateExamId() {
  for (let i = 0; i < 10; i++) {
    const id = String(Math.floor(10000000 + Math.random() * 90000000));
    
    const { data } = await supabase
      .from("students")
      .select("exam_id")
      .eq("exam_id", id)
      .maybeSingle();
      
    if (!data) return id;
  }
  return String(Date.now()).slice(-8);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Dataları təmizləyirik
    const firstName = toTitleCaseAz(body.firstName);
    const lastName = toTitleCaseAz(body.lastName);
    const fatherName = toTitleCaseAz(body.fatherName); 
    const className = String(body.className || "").trim();
    const examName = body.examName; 

    // --- DƏYİŞİKLİK 1: TELEFONLAR ---
    // Frontend-dən nömrə artıq hazır gəlir (+994501234567), ona görə 'normalizeAzPhone' lazım deyil.
    // Sadəcə stringə çevirib boşluqları silirik.
    const phone1 = String(body.phone7_1 || "").trim();
    
    // 2-ci nömrə: Əgər boşdursa null olsun, doludursa götürək
    let phone2 = body.phone7_2 ? String(body.phone7_2).trim() : null;

    // Əgər 2-ci nömrə 1-ci ilə eynidirsə, onu ləğv edirik (dublikat olmasın)
    if (phone2 === phone1) phone2 = null;


    // --- 2. VALİDASİYALAR ---
    if (!firstName || !lastName || !fatherName) {
      return NextResponse.json({ error: "Ad, Soyad və Ata adı boş ola bilməz" }, { status: 400 });
    }

    // Telefon formatı (+994 və 9 rəqəm)
    const phoneRegex = /^\+994\d{9}$/;

    if (!phoneRegex.test(phone1)) {
      return NextResponse.json({ error: "Əsas nömrənin formatı yanlışdır" }, { status: 400 });
    }

    // --- DƏYİŞİKLİK 2: İKİNCİ NÖMRƏ İSTƏYƏ BAĞLIDIR ---
    // Yalnız phone2 doludursa yoxlayırıq. Boşdursa xəta vermirik.
    if (phone2 && !phoneRegex.test(phone2)) {
      return NextResponse.json({ error: "Əlavə nömrənin formatı yanlışdır" }, { status: 400 });
    }

    if (!className) {
      return NextResponse.json({ error: "Sinif seçilməlidir" }, { status: 400 });
    }
    if (!examName) {
      return NextResponse.json({ error: "İmtahan seçilməlidir" }, { status: 400 });
    }

    // --- 3. İMTAHANIN AKTİVLİK YOXLANIŞI ---
    const { data: activeExam, error: examCheckErr } = await supabase
      .from("exams")
      .select("id")
      .eq("name", examName)
      .eq("is_active", true)
      .maybeSingle();

    if (examCheckErr || !activeExam) {
      return NextResponse.json({ error: "Bu imtahan mövcud deyil və ya qeydiyyat dayandırılıb." }, { status: 400 });
    }

    // --- 4. TƏKRAR QEYDİYYAT YOXLANIŞI ---
    const { data: existing, error: exErr } = await supabase
      .from("students")
      .select("exam_id")
      .match({ 
          phone1: phone1, 
          first_name: firstName, 
          last_name: lastName,
          exam_name: examName 
      })
      .maybeSingle();

    if (exErr) {
      return NextResponse.json({ error: "Sistem xətası (DB Read)" }, { status: 500 });
    }

    if (existing?.exam_id) {
      return NextResponse.json({ examId: existing.exam_id, already: true });
    }

    // --- 5. YENİ QEYDİYYAT ---
    const examId = await generateExamId();

    const { error: insErr } = await supabase.from("students").insert([
      {
        exam_id: examId,        
        first_name: firstName,
        last_name: lastName,
        parent_name: fatherName, 
        phone1: phone1,
        phone2: phone2, 
        class: className,
        exam_name: examName 
      },
    ]);

    if (insErr) {
      // Race condition yoxlaması
      const { data: again } = await supabase
        .from("students")
        .select("exam_id")
        .match({ 
            phone1: phone1, 
            first_name: firstName, 
            last_name: lastName,
            exam_name: examName
        })
        .maybeSingle();

      if (again?.exam_id) return NextResponse.json({ examId: again.exam_id, already: true });

      console.error("Insert Error:", insErr);
      return NextResponse.json({ error: "Qeydiyyat zamanı xəta baş verdi" }, { status: 500 });
    }

    return NextResponse.json({ examId, already: false });
    
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
