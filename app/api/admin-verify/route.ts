import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    // 🛑 TEST REJİMİ: Parol konkret "123456"
    if (pin === "123456") {
      
      const response = NextResponse.json({ success: true });

      // 🔥 VERCEL ÜÇÜN BETON KUKİ AYARLARI
      response.cookies.set('final_test_cookie', 'OPEN_SESAME', {
        httpOnly: true,
        secure: true,      // Vercel (HTTPS) üçün vacibdir
        sameSite: 'none',  // ⚠️ Redirect zamanı kuki itməməsi üçün ən güclü ayar
        maxAge: 3600,      // 1 saat
        path: '/',         // Bütün saytda keçərlidir
      });

      return response;
    } else {
      return NextResponse.json({ success: false, message: "Səhvdir" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
