import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;
    
    // Vercel-dəki parolun (Settings-də yazdığın)
    const SECRET_PIN = process.env.ADMIN_PASSWORD; 

    // Əgər parol düzdürsə
    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // 🔥 KUKİNİ BELƏ YAZIRIQ (Vercel üçün)
      response.cookies.set('super_admin_access', 'ACCESS_GRANTED_2026', {
        httpOnly: true, 
        secure: true,    // Vercel (HTTPS) olduğu üçün TRUE
        sameSite: 'lax', // Redirect zamanı itməməsi üçün 'Lax'
        maxAge: 60 * 60, // 1 saat
        path: '/',       // Bütün saytda keçərli olsun
      });

      return response;
    } else {
      return NextResponse.json({ success: false, message: "Parol Səhvdir" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false, message: "Xəta" }, { status: 500 });
  }
}
