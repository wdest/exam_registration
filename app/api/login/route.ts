import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(req: Request) {
  const body = await req.json();
  const { password } = body;

  // Şifrəni serverdə yoxlayırıq (Env faylından oxuyur)
  if (password === process.env.ADMIN_PASSWORD) {
    
    // Şifrə düzdürsə, "admin_token" adlı cookie yaradırıq
    const cookie = serialize("admin_token", "true", {
      httpOnly: true, // Hakerlər JS ilə bu cookie-ni oğurlaya bilməz
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 gün qüvvədədir
      path: "/",
    });

    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", cookie);
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
