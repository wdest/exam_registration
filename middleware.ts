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
  if (pathname.startsWith('/admin')) {
    if (adminCookie !== 'v2_secure_hash_99881122_matrix_mode') {
      return NextResponse.redirect(cleanUrl('/'))
    }
    // Admin üçün hərəkət varsa, admin cookie vaxtını da uzada bilərik (opsional)
    const response = NextResponse.next()
    return response
  }

  // ===========================================================
  // 2. LOGIN SƏHİFƏSİ (/login)
  // ===========================================================
  if (pathname === '/login') {
    if (user) {
      if (user.role === 'teacher') return NextResponse.redirect(cleanUrl('/teacher-cabinet'))
      if (user.role === 'student') return NextResponse.redirect(cleanUrl('/student'))
    }
    // Əgər token var amma user null-dırsa (yəni JSON səhvdrisə), 
    // login səhifəsində cookie-ni təmizləyən response qaytarırıq.
    if (token && !user) {
      const response = NextResponse.next()
      response.cookies.delete('auth_token')
      return response
    }
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
