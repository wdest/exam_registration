import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Tokenləri oxu
  const token = request.cookies.get('auth_token')?.value
  const adminCookie = request.cookies.get('super_admin_access')?.value

  // URL yaratmaq üçün köməkçi funksiya
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // User datasını pars edirik
  let user = null
  
  // Login loop problemini həll etmək üçün:
  // Əgər token var amma JSON səhvdirsə, onu aşağıda siləcəyik.
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      user = null
      // JSON xətası varsa, deməli token zədəlidir, onu nəzərə almırıq
    }
  }

  // ===========================================================
  // 1. ADMIN PANELİ (GİZLİ QALMALIDIR)
  // ===========================================================
 // middleware.ts içində bu hissəni tap və dəyiş:

  // ===========================================================
  // 1. ADMIN PANELİ (GİZLİ QALMALIDIR)
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    
    // 🕵️‍♂️ DEBUG KAMERASI: Bunu Vercel Loglarında görəcəksən
    console.log("------------------------------------------------");
    console.log("🛑 ADMIN GİRİŞ CƏHDİ: " + pathname);
    console.log("🍪 Brauzerdən gələn kuki: ", adminCookie);
    console.log("🔑 Gözlənilən şifrə: v2_secure_hash_99881122_matrix_mode");
    
    // Şifrəni yoxlayırıq
    if (adminCookie !== 'v2_secure_hash_99881122_matrix_mode') {
      console.log("❌ UĞURSUZ! Kuki uyğun gəlmir və ya yoxdur.");
      console.log("------------------------------------------------");
      return NextResponse.redirect(cleanUrl('/'))
    }

    console.log("✅ UĞURLU! Admin panel açılır.");
    console.log("------------------------------------------------");
    return NextResponse.next()
  }
  // ===========================================================
  // 3. ROL ƏSASLI QORUMA
  // ===========================================================
  const isTeacherRoute = pathname.startsWith('/teacher-cabinet')
  const isStudentRoute = pathname.startsWith('/student') && pathname !== '/login'

  if (isTeacherRoute && (!user || user.role !== 'teacher')) {
    return NextResponse.redirect(cleanUrl('/login'))
  }

  if (isStudentRoute && (!user || user.role !== 'student')) {
    return NextResponse.redirect(cleanUrl('/login'))
  }

  // ===========================================================
  // 4. COOKIE VAXTINI YENİLƏMƏK (10 DƏQİQƏ İNAKTİVLİK)
  // ===========================================================
  // Bura çatıbsa, deməli istifadəçinin icazəsi var.
  // Biz indi cavabı (response) hazırlayıb, cookie-ni yeniləyib göndəririk.
  
  const response = NextResponse.next()

  if (token) {
    // Cookie-ni yenidən set edirik ki, ömrü uzansın (Sliding Expiration)
    response.cookies.set('auth_token', token, {
      httpOnly: true, // JavaScript oxuya bilməsin (təhlükəsizlik üçün vacibdir)
      secure: process.env.NODE_ENV === 'production', // Https tələbi
      sameSite: 'strict',
      maxAge: 10 , // 10 dəqiqə (saniyə ilə)
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: [
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin/:path*',
    '/login' 
  ],
}
