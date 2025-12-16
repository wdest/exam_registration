import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function POST(req) {
  const body = await req.json();

  const { firstName, lastName, parentName, phone1, phone2, className } = body;

  const { data, error } = await supabase
    .from("students")
    .insert([
      {
        first_name: firstName,
        last_name: lastName,
        parent_name: parentName,
        phone1,
        phone2,
        class: className,
      },
    ])
    .select()
    .single();

  if (error) {
    return new Response("Error", { status: 500 });
  }

  const uniqueId = String(data.id).padStart(8, "0");

  await supabase
    .from("students")
    .update({ unique_id: uniqueId })
    .eq("id", data.id);

  return Response.json({ uniqueId });
}
