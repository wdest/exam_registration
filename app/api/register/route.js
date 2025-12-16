import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Adları "İlk hərf böyük, qalan kiçik" edir (AZ/TR/EN hərflərini də saxlayır)
function toTitleCase(s = "") {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toLocaleUpperCase("az") + w.slice(1).toLocaleLowerCase("az"))
    .join(" ");
}

// 8 rəqəm random ID
function random8() {
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

async function generateUniqueId() {
  // çox nadir halda toqquşma olar, buna görə yoxlayıb təkrar edirik
  for (let i = 0; i < 10; i++) {
    const id = random8();
    const { data } = await supabase
      .from("students")
      .select("id")
      .eq("unique_id", id)
      .maybeSingle();

    if (!data) return id;
  }
  throw new Error("Unique ID yaradıla bilmədi");
}

export async function POST(req) {
  try {
    const body = await req.json();

    const firstName = toTitleCase(body.firstName);
    const lastName = toTitleCase(body.lastName);
    const fatherName = toTitleCase(body.fatherName);     // Ata adı
    const parentName = toTitleCase(body.parentName);

    const phone1 = (body.phone1 || "").trim();           // +994xx1234567 kimi göndər
    const phone2 = (body.phone2 || "").trim();           // boş ola bilər
    const className = (body.className || "").trim();

    // minimal yoxlamalar
    if (!firstName || !lastName || !fatherName || !parentName || !phone1 || !className) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    // ✅ DUPLICATE CHECK: eyni data varsa, əvvəlki ID-ni qaytar
    const { data: existing, error: findErr } = await supabase
      .from("students")
      .select("unique_id")
      .eq("first_name", firstName)
      .eq("last_name", lastName)
      .eq("father_name", fatherName)
      .eq("parent_name", parentName)
      .eq("phone1", phone1)
      .eq("class", className)
      .maybeSingle();

    if (findErr) {
      return Response.json({ error: "DB error" }, { status: 500 });
    }

    if (existing?.unique_id) {
      return Response.json({
        status: "already",
        uniqueId: existing.unique_id
      });
    }

    // ✅ yeni qeydiyyat
    const uniqueId = await generateUniqueId();

    const { error: insertErr } = await supabase
      .from("students")
      .insert([{
        unique_id: uniqueId,
        first_name: firstName,
        last_name: lastName,
        father_name: fatherName,
        parent_name: parentName,
        phone1,
        phone2,
        class: className
      }]);

    if (insertErr) {
      return Response.json({ error: "Insert failed" }, { status: 500 });
    }

    return Response.json({
      status: "created",
      uniqueId
    });
  } catch (e) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
