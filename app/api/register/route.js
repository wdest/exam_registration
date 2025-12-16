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
  return `+994${op}${rest}`; // +994 + 2 rəqəm + 7 rəqəm = 12 rəqəmli format
}

async function generateUniqueId() {
  // 8 rəqəm random (10000000 - 99999999)
  for (let i = 0; i < 8; i++) {
    const id = String(Math.floor(10000000 + Math.random() * 90000000));
    const { data } = await supabase
      .from("students")
      .select("unique_id")
      .eq("unique_id", id)
      .maybeSingle();
    if (!data) return id;
  }
  // ehtiyat: çox nadir hallarda
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

    // minimal yoxlamalar
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

    // 1) Dedupe: phone1 üzrə artıq var?
    const { data: existing, error: exErr } = await supabase
      .from("students")
      .select("unique_id, first_name, last_name, father_name, phone2, class")
      .eq("phone1", phone1)
      .maybeSingle();

    if (exErr) {
      return Response.json({ error: "DB oxuma xətası" }, { status: 500 });
    }

    if (existing?.unique_id) {
      // artıq keçib
      return Response.json({ uniqueId: existing.unique_id, already: true });
    }

    // 2) Yeni qeydiyyat
    const uniqueId = await generateUniqueId();

    const { error: insErr } = await supabase.from("students").insert([
      {
        unique_id: uniqueId,
        first_name: firstName,
        last_name: lastName,
        father_name: fatherName,
        phone1,
        phone2,
        class: className,
      },
    ]);

    if (insErr) {
      // eyni anda 2 nəfər eyni phone1 yazdısa, unique constraintə düşə bilər:
      const { data: again } = await supabase
        .from("students")
        .select("unique_id")
        .eq("phone1", phone1)
        .maybeSingle();

      if (again?.unique_id) return Response.json({ uniqueId: again.unique_id, already: true });

      return Response.json({ error: "DB insert xətası" }, { status: 500 });
    }

    return Response.json({ uniqueId, already: false });
  } catch {
    return Response.json({ error: "Server xətası" }, { status: 500 });
  }
}
