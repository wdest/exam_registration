import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  // Next.js 15 üçün await lazımdır
  const cookieStore = await cookies();

  // Bütün giriş kukilərini server tərəfdən silirik
  cookieStore.delete("auth_token");
  cookieStore.delete("student_token"); // Hər ehtimala qarşı köhnəni də silək

  return NextResponse.json({ success: true });
}
