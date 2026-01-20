import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;
    const SECRET_PIN = process.env.ADMIN_PASSWORD; 

    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // 🔥 VERCEL ÜÇÜN BETON AYARLAR
      response.cookies.set('super_admin_access', 'v2_secure_hash_99881122_matrix_mode', {
        httpOnly: true, 
        secure: true,      // ✅ Vercel (HTTPS) olduğu üçün TRUE
        sameSite: 'none',  // ✅ 'lax' yox, 'none' qoyuruq (HTTPS-də ən yaxşı işləyən budur)
        maxAge: 60 * 60,   // 1 saat
        path: '/',         // ✅ Kuki bütün saytda keçərli olsun
      });

      return response;
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
