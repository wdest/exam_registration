import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// İlk hərfi böyük edən funksiya
function formatName(text) {
  return text
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// 8 rəqəmli RANDOM ID
function generateRandomId() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      fatherName,
      phone1,
      phone2,
      className,
    } = body;

    // 🔴 Phone2 məcburidir və fərqli olmalıdır
    if (!phone2 || phone1 === phone2) {
      return Response.json(
        { error: "İkinci telefon fərqli və məcburidir" },
        { status: 400 }
      );
    }

    const fName = formatName(firstName);
    const lName = formatName(lastName);
    const faName = formatName(fatherName);

    // 🔍 TƏKRAR YOXLA
    const { data: existing } = await supabase
      .from("students")
      .select("unique_id")
      .eq("first_name", fName)
      .eq("last_name", lName)
      .eq("phone1", phone1)
      .eq("phone2", phone2)
      .maybeSingle();

    // Əgər artıq varsa → köhnə ID-ni qaytar
    if (existing) {
      return Response.json({
        uniqueId: existing.unique_id,
        message: "Siz artıq qeydiyyatdan keçmisiniz",
      });
    }

    // 🆔 Random ID (təkrar düşməsin deyə loop)
    let uniqueId;
    let exists = true;

    while (exists) {
      uniqueId = generateRandomId();
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("unique_id", uniqueId)
        .maybeSingle();

      if (!data) exists = false;
    }

    // 📝 INSERT
    const { error } = await supabase.from("students").insert([
      {
        unique_id: uniqueId,
        first_name: fName,
        last_name: lName,
        father_name: faName,
        phone1,
        phone2,
        class: className,
      },
    ]);

    if (error) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    return Response.json({
      uniqueId,
      message: "Qeydiyyat uğurla tamamlandı",
    });

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
