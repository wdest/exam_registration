import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID göndərilməyib" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("results")
    .select("*")
    .eq("student_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nəticə tapılmadı" }, { status: 404 });
  }

  return NextResponse.json(data);
}
