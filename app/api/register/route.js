import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function formatName(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function randomId() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export async function POST(req) {
  const b = await req.json();

  const { error } = await supabase.from("students").insert([{
    unique_id: randomId(),
    first_name: formatName(b.firstName),
    last_name: formatName(b.lastName),
    parent_name: formatName(b.fatherName),
    phone1: b.phone,
    class: b.className,
  }]);

  if (error) return new Response("Error", { status: 500 });

  return Response.json({ uniqueId: randomId() });
}
