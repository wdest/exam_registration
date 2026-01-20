import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get('pin');
  const cleanUrl = (path: string) => new URL(path, request.url);

  // 1. Şifrəni Yoxlayırıq (Test üçün: 123456)
  if (pin === 'zpOb0PT2RMTIK4WC') {
    
    // 2. Birbaşa Admin səhifəsinə yönləndirmə hazırlayırıq
    const response = NextResponse.redirect(cleanUrl('/admin'));

    // 3. KUKİNİ BİRBAŞA RESPONSE ÜZƏRİNƏ YAZIRIQ (Ən Qarantili Yol)
    response.cookies.set('final_access_key', 'OPEN_SESAME', {
      httpOnly: true,
      secure: true,      // Vercel (HTTPS) üçün vacibdir
      sameSite: 'lax',   // Lax qoyuruq ki, redirect zamanı kuki düşsün
      maxAge: 3600,      // 1 saat
      path: '/',
    });

    return response;
  } else {
    // Səhvdirsə ana səhifəyə at
    return NextResponse.redirect(cleanUrl('/'));
  }
}
