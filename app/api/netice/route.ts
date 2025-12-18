import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Supabase-i LAZY init edirik */
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase ENV yoxdur");
  }

  return createClient(url, key);
}

export async function GET(req: Request) {
  const supabase = getSupabase(); // ⬅️ BURADA yaradılır

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID göndərilməyib" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("results")
    .select("student_id, score, total, percent, created_at")
    .eq("student_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Nəticə tapılmadı" }, { status: 404 });
  }

  return NextResponse.json(data);
}
