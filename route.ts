import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const cookieStore = await cookies();

    // PIN Kodu yoxlayırıq (Bunu .env faylında saxlamaq daha yaxşıdır)
    if (pin === "zpOb0PT2RMTIK4WC") {
      
      // "true" əvəzinə təxmin edilməsi çətin olan xüsusi bir HASH dəyəri yazırıq
      // HttpOnly: true -> JavaScript bu kukini oxuya bilməz (Hakerlər konsoldan görə bilməz)
      cookieStore.set("super_admin_access", "v2_secure_hash_99881122_matrix_mode", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 gün
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Yanlış PIN" }, { status: 401 });
    }

  } catch (error) {
    return NextResponse.json({ error: "Xəta baş verdi" }, { status: 500 });
  }
}