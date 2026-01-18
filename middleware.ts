import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Tokeni oxu
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // 2. User məlumatını yoxla
  let user = null
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      user = null
    }
  }

  // URL yaratmaq üçün təmiz funksiya (Bu `?type=` zibilini təmizləyir)
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // ===========================================================
  // 1. LOGIN SƏHİFƏSİ (/login)
  // (Əgər artıq giriş edibsə, onu gözlətmə, kabinetinə tulla)
  // ===========================================================
  if (pathname === '/login') {
    if (user) {
      if (user.role === 'teacher') return NextResponse.redirect(cleanUrl('/teacher-cabinet'))
      if (user.role === 'student') return NextResponse.redirect(cleanUrl('/student'))
      if (user.role === 'admin') return NextResponse.redirect(cleanUrl('/admin'))
    }
    // Giriş etməyibsə, qoy Login səhifəsini görsün
    return NextResponse.next()
  }

  // ===========================================================
  // 2. MÜƏLLİM KABİNETİ QORUMASI
  // ===========================================================
  if (pathname.startsWith('/teacher-cabinet')) {
    // User yoxdursa VƏ YA rolu müəllim deyilsə -> TƏMİZ LOGINƏ AT
    if (!user || user.role !== 'teacher') {
      return NextResponse.redirect(cleanUrl('/login'))
    }
  }

  // ===========================================================
  // 3. ŞAGİRD KABİNETİ QORUMASI
  // ===========================================================
  if (pathname.startsWith('/student') && pathname !== '/login') {
    // User yoxdursa VƏ YA rolu şagird deyilsə -> TƏMİZ LOGINƏ AT
    if (!user || user.role !== 'student') {
      return NextResponse.redirect(cleanUrl('/login'))
    }
  }

  // ===========================================================
  // 4. ADMIN PANELİ (GİZLİ QALMALIDIR) 🕵️‍♂️
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    // Admin deyilsə -> Ana Səhifəyə at (Gizlilik üçün)
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(cleanUrl('/'))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin/:path*',
    '/login' 
  ],
}
