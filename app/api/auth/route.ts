import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const pin = formData.get('pin');
  const cleanUrl = (path: string) => new URL(path, request.url);

  // .env faylından oxuyur
  const SECRET = process.env.ADMIN_SECRET_PASS;

  if (pin === SECRET) {
    // 303 Redirect - Form post edildikdən sonra yönləndirmə üçün idealdır
    const response = NextResponse.redirect(cleanUrl('/admin'), 303);

    // 🔥 DÜZƏLİŞ: Middleware ilə eyni dəyəri istifadə edirik: 'ACCESS_GRANTED'
    response.cookies.set('super_admin_session', 'ACCESS_GRANTED', {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', // Production-da HTTPS məcburidir
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } else {
    // Səhvdirsə, giriş səhifəsinə qaytar (və ya ana səhifəyə)
    return NextResponse.redirect(cleanUrl('/system-config-v2?error=1'));
  }
}
