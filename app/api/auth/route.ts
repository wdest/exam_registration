import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Form məlumatlarını alırıq
  const formData = await request.formData();
  const pin = formData.get('pin'); // Frontend-də input name="pin" olmalıdır!
  const cleanUrl = (path: string) => new URL(path, request.url);

  // 2. Parolu Serverin Yaddaşından (.env) oxuyuruq
  // .env faylında: ADMIN_SECRET_PASS=MOC_ULTRA_SECURE_2026
  const SECRET = process.env.ADMIN_SECRET_PASS;

  if (pin === SECRET) {
    // 3. Parol düzdürsə -> Admin səhifəsinə Redirect (303 statusu ilə)
    const response = NextResponse.redirect(cleanUrl('/admin'), 303);

    // 4. KUKİNİ YAPIŞDIRIRIQ (Middleware bunu yoxlayacaq)
    // Diqqət: Value 'ACCESS_GRANTED' olmalıdır ki, Middleware buraxsın.
    response.cookies.set('super_admin_session', 'ACCESS_GRANTED', {
      httpOnly: true,  // JavaScript oxuya bilməz (Təhlükəsizlik)
      secure: process.env.NODE_ENV === 'production', // HTTPS məcburiyyəti
      sameSite: 'lax',
      maxAge: 3600,    // 1 saatlıq sessiya
      path: '/',
    });

    return response;
  } else {
    // Səhvdirsə -> Səhifəyə error qaytarırıq
    return NextResponse.redirect(cleanUrl('/system-config-v2?error=1'));
  }
}
