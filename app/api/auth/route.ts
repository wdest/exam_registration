import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Gizli form paketini açırıq
  const formData = await request.formData();
  const pin = formData.get('pin');
  const cleanUrl = (path: string) => new URL(path, request.url);

  // 2. Parolu Seyfdən (.env) oxuyuruq -> KODDA PAROL YOXDUR!
  const SECRET = process.env.ADMIN_SECRET_PASS;

  if (pin === SECRET) {
    // 3. Admin səhifəsinə bilet kəsirik (Status 303 vacibdir)
    const response = NextResponse.redirect(cleanUrl('/admin'), 303);

    // 4. KUKİNİ YAPIŞDIRIRIQ (Beton kimi)
    response.cookies.set('super_admin_session', 'ACCESS_GRANTED_SECURE_V2', {
      httpOnly: true,  // JavaScript oxuya bilməz
      secure: true,    // Vercel (HTTPS) üçün vacibdir
      sameSite: 'lax', // Redirect zamanı kuki düşsün deyə
      maxAge: 3600,    // 1 saat
      path: '/',
    });

    return response;
  } else {
    // Səhvdirsə ana səhifəyə at
    return NextResponse.redirect(cleanUrl('/'));
  }
}
