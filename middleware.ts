import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Kukini oxuyuruq (Yeni API "auth_token" yaradır)
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // User məlumatlarını parse edirik (əgər token varsa)
  let user = null
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      // Token xarabdırsa, user yox sayılır
      user = null
    }
  }

  // -----------------------------------------------------------
  // 1. LOGIN SƏHİFƏSİNDƏN QORUMA (Artıq giriş edibsə, login-ə girməsin)
  // -----------------------------------------------------------
  if (pathname === '/student-login') {
    if (user) {
      if (user.role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher-cabinet', request.url))
      } else if (user.role === 'student') {
        return NextResponse.redirect(new URL('/student', request.url))
      } else if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    // Giriş etməyibsə, login səhifəsində qalsın
    return NextResponse.next()
  }

  // -----------------------------------------------------------
  // 2. MÜƏLLİM KABİNETİNİ QORUYURUQ
  // -----------------------------------------------------------
  if (pathname.startsWith('/teacher-cabinet')) {
    // Token yoxdursa və ya rolu müəllim deyilsə -> Loginə at
    if (!user || user.role !== 'teacher') {
      return NextResponse.redirect(new URL('/student-login?type=teacher', request.url))
    }
  }

  // -----------------------------------------------------------
  // 3. ŞAGİRD KABİNETİNİ QORUYURUQ
  // -----------------------------------------------------------
  // Diqqət: /student-login də /student ilə başlayır, onu istisna etməliyik
  if (pathname.startsWith('/student') && pathname !== '/student-login') {
    // Token yoxdursa və ya rolu şagird deyilsə -> Loginə at
    // QEYD: Əgər müəllim şagirdin səhifəsini görməlidirsə, bura `|| user.role === 'teacher'` əlavə edə bilərsən.
    if (!user || user.role !== 'student') {
      return NextResponse.redirect(new URL('/student-login?type=student', request.url))
    }
  }

  // -----------------------------------------------------------
  // 4. ADMIN PANELİ QORUYURUQ (Köhnə sistemin də işləsin)
  // -----------------------------------------------------------
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/student-login', request.url))
    }
  }

  return NextResponse.next()
}

// Middleware hansı səhifələrdə işə düşsün?
export const config = {
  matcher: [
    // Bütün qorunan yollar və login səhifəsi
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin/:path*',
    '/student-login'
  ],
}
