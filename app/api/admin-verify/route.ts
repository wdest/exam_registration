import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;
    const SECRET_PIN = process.env.ADMIN_PASSWORD; 

    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // 🔥 VERCEL + CHROME ÜÇÜN "QIZIL ORTA" AYARI
      response.cookies.set('super_admin_access', 'v2_secure_hash_99881122_matrix_mode', {
        httpOnly: true,  // JavaScript oxuya bilməz (Təhlükəsizlik)
        secure: true,    // Vercel (HTTPS) olduğu üçün TRUE
        sameSite: 'lax', // ✅ 'lax' qoyuruq. Redirect zamanı kuki itmir.
        maxAge: 60 * 60, // 1 saat
        path: '/',       // Bütün saytda keçərli olsun
      });

      return response;
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
