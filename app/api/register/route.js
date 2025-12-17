import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function toTitleCaseAz(s) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

function normalizeAzPhone(operator, sevenDigits) {
  const op = digitsOnly(operator);
  const rest = digitsOnly(sevenDigits);
  return `+994${op}${rest}`;
}

async function generateExamId() {
  // Funksiyanın adını da məntiqə uyğun dəyişdik
  for (let i = 0; i < 8; i++) {
    const id = String(Math.floor(10000000 + Math.random() * 90000000));
    
    // YENİLƏNDİ: unique_id əvəzinə exam_id axtarırıq
    const { data } = await supabase
      .from("students")
      .select("exam_id")
      .eq("exam_id", id)
      .maybeSingle();
      
    if (!data) return id;
  }
  return String(Date.now()).slice(-8);
}

export async function POST(req) {
  try {
    const body = await req.json();

    const firstName = toTitleCaseAz(body.firstName);
    const lastName = toTitleCaseAz(body.lastName);
    const fatherName = toTitleCaseAz(body.fatherName); // Frontenddən yenə fatherName gəlir, amma DB-də parent_name-ə yazacağıq

    const phone1 = normalizeAzPhone(body.operator1, body.phone7_1);
    const phone2 = normalizeAzPhone(body.operator2, body.phone7_2);

    const className = String(body.className || "").trim();

    if (!firstName || !lastName || !fatherName) {
      return Response.json({ error: "Ad/Soyad/Ata adı boş ola bilməz" }, { status: 400 });
    }
    if (!/^\+994\d{9}$/.test(phone1) || !/^\+994\d{9}$/.test(phone2)) {
      return Response.json({ error: "Telefon formatı yanlışdır" }, { status: 400 });
    }
    if (phone1 === phone2) {
      return Response.json({ error: "Telefon 2, Telefon 1-dən fərqli olmalıdır" }, { status: 400 });
    }
    if (!className) {
      return Response.json({ error: "Sinif seçilməlidir" }, { status: 400 });
    }

    // 1) Yoxlama (Dedupe): exam_id və parent_name sorğulanır
    // YENİLƏNDİ: unique_id -> exam_id, father_name -> parent_name
    const { data: existing, error: exErr } = await supabase
      .from("students")
      .select("exam_id, first_name, last_name, parent_name, phone2, class")
      .eq("phone1", phone1)
      .maybeSingle();

    if (exErr) {
      return Response.json({ error: "DB oxuma xətası" }, { status: 500 });
    }

    if (existing?.exam_id) {
      // Artıq qeydiyyatdan keçibsə, exam_id qaytarırıq
      return Response.json({ examId: existing.exam_id, already: true });
    }

    // 2) Yeni qeydiyyat
    const examId = await generateExamId();

    // YENİLƏNDİ: Insert zamanı father_name yox, parent_name işlədirik
    const { error: insErr } = await supabase.from("students").insert([
      {
        exam_id: examId,        // DB sütunu: exam_id
        first_name: firstName,
        last_name: lastName,
        parent_name: fatherName, // DB sütunu: parent_name (Input dəyəri: fatherName)
        phone1,
        phone2,
        class: className,
      },
    ]);

    if (insErr) {
      const { data: again } = await supabase
        .from("students")
        .select("exam_id")
        .eq("phone1", phone1)
        .maybeSingle();

      if (again?.exam_id) return Response.json({ examId: again.exam_id, already: true });

      return Response.json({ error: "DB insert xətası" }, { status: 500 });
    }

    // Frontend tərəfdə artıq "result.uniqueId" yox, "result.examId" gözləməlisən
    return Response.json({ examId, already: false });
    
  } catch {
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}
