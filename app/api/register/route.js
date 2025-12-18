import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// DƏYİŞİKLİK 1: Azərbaycan hərflərini (ə, ı, ğ, ş, ç, ö, İ) düzgün böyüdüb-kiçiltmək üçün
function toTitleCaseAz(s) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase('az') + w.slice(1).toLocaleLowerCase('az'))
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
  // Cəhd sayını 8-dən 10-a qaldırdıq, daha etibarlı olsun
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

export async function POST(req) {
  try {
    const body = await req.json();

    const firstName = toTitleCaseAz(body.firstName);
    const lastName = toTitleCaseAz(body.lastName);
    const fatherName = toTitleCaseAz(body.fatherName); 

    const phone1 = normalizeAzPhone(body.operator1, body.phone7_1);
    const phone2 = normalizeAzPhone(body.operator2, body.phone7_2);

    const className = String(body.className || "").trim();

    // Validasiyalar
    if (!firstName || !lastName || !fatherName) {
      return Response.json({ error: "Ad, Soyad və Ata adı boş ola bilməz" }, { status: 400 });
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

    // --- DƏYİŞİKLİK 2: BACI-QARDAŞ MƏNTİQİ ---
    // Əvvəlki kod: .eq("phone1", phone1) -> Bu, eyni nömrəli ikinci uşağa icazə vermirdi.
    // Yeni kod: .match(...) -> İndi sistem Nömrə + Ad + Soyad eyni olanda "artıq varsan" deyir.
    
    const { data: existing, error: exErr } = await supabase
      .from("students")
      .select("exam_id, first_name, last_name, parent_name, phone2, class")
      .match({ 
          phone1: phone1, 
          first_name: firstName, 
          last_name: lastName 
      })
      .maybeSingle();

    if (exErr) {
      return Response.json({ error: "DB oxuma xətası" }, { status: 500 });
    }

    if (existing?.exam_id) {
      // Əgər Ad, Soyad və Nömrə eynidirsə -> deməli eyni adamdır
      return Response.json({ examId: existing.exam_id, already: true });
    }

    // 2) Yeni qeydiyyat
    const examId = await generateExamId();

    const { error: insErr } = await supabase.from("students").insert([
      {
        exam_id: examId,        
        first_name: firstName,
        last_name: lastName,
        parent_name: fatherName, 
        phone1,
        phone2,
        class: className,
      },
    ]);

    if (insErr) {
      // DƏYİŞİKLİK 3: Race condition (eyni anda basılan düymə) yoxlaması
      // Burada da sadəcə telefona görə yox, kombinasiyaya görə yoxlayırıq
      const { data: again } = await supabase
        .from("students")
        .select("exam_id")
        .match({ 
            phone1: phone1, 
            first_name: firstName, 
            last_name: lastName 
        })
        .maybeSingle();

      if (again?.exam_id) return Response.json({ examId: again.exam_id, already: true });

      return Response.json({ error: "DB insert xətası" }, { status: 500 });
    }

    return Response.json({ examId, already: false });
    
  } catch {
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}
