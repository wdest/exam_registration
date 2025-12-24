import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- KÖMƏKÇİ FUNKSİYALAR (Sənin yazdığın kimi qaldı) ---

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

function digitsOnly(s: any) {
  return String(s || "").replace(/\D/g, "");
}

function normalizeAzPhone(operator: any, sevenDigits: any) {
  const op = digitsOnly(operator);
  const rest = digitsOnly(sevenDigits);
  return `+994${op}${rest}`;
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
    const examName = body.examName; // <-- YENİ: İmtahan adı

    // Telefonları düzəldirik
    const phone1 = normalizeAzPhone(body.operator1, body.phone7_1);
    // İkinci nömrə varsa düzəldirik, yoxdursa null
    const phone2Raw = body.phone7_2 ? normalizeAzPhone(body.operator2, body.phone7_2) : null;
    // Əgər phone2 phone1 ilə eynidirsə və ya boşdursa, null edirik (dublikat olmasın)
    const phone2 = (phone2Raw && phone2Raw !== phone1) ? phone2Raw : null;

    // --- 2. VALİDASİYALAR ---
    if (!firstName || !lastName || !fatherName) {
      return NextResponse.json({ error: "Ad, Soyad və Ata adı boş ola bilməz" }, { status: 400 });
    }
    if (!/^\+994\d{9}$/.test(phone1)) {
      return NextResponse.json({ error: "Telefon nömrəsi yanlışdır" }, { status: 400 });
    }
    if (!className) {
      return NextResponse.json({ error: "Sinif seçilməlidir" }, { status: 400 });
    }
    if (!examName) {
      return NextResponse.json({ error: "İmtahan seçilməlidir" }, { status: 400 });
    }

    // --- 3. İMTAHANIN AKTİVLİK YOXLANIŞI (YENİ) ---
    // Bazadan baxırıq: Belə imtahan varmı və aktivdirmi?
    const { data: activeExam, error: examCheckErr } = await supabase
      .from("exams")
      .select("id")
      .eq("name", examName)
      .eq("is_active", true)
      .maybeSingle();

    if (examCheckErr || !activeExam) {
      return NextResponse.json({ error: "Bu imtahan mövcud deyil və ya qeydiyyat dayandırılıb." }, { status: 400 });
    }

    // --- 4. TƏKRAR QEYDİYYAT YOXLANIŞI (YENİLƏNDİ) ---
    // Məntiq: Ad + Soyad + Telefon + İMTAHAN ADI eynidirsə, deməli artıq yazılıb.
    // Amma başqa imtahana yazılırsa, icazə veririk.
    
    const { data: existing, error: exErr } = await supabase
      .from("students")
      .select("exam_id")
      .match({ 
          phone1: phone1, 
          first_name: firstName, 
          last_name: lastName,
          exam_name: examName // <-- Əsas fərq buradadır
      })
      .maybeSingle();

    if (exErr) {
      return NextResponse.json({ error: "Sistem xətası (DB Read)" }, { status: 500 });
    }

    if (existing?.exam_id) {
      // Artıq bu imtahana yazılıb
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
        phone2: phone2, // Artıq yuxarıda təmizləmişik
        class: className,
        exam_name: examName // <-- Bazaya yazırıq
      },
    ]);

    if (insErr) {
      // Race condition yoxlaması (Eyni anda basanda)
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
