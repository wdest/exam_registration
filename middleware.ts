import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Token varsa parse edirik, yoxdursa null
  let user = null
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      user = null
    }
  }

  // -----------------------------------------------------------
  // 1. LOGIN SƏHİFƏSİNDƏN YÖNLƏNDİRMƏ
  // (Əgər artıq giriş edibsə, təkrar login səhifəsini görməsin)
  // -----------------------------------------------------------
  if (pathname === '/student-login') {
    if (user) {
      if (user.role === 'teacher') return NextResponse.redirect(new URL('/teacher-cabinet', request.url))
      if (user.role === 'student') return NextResponse.redirect(new URL('/student', request.url))
      if (user.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // -----------------------------------------------------------
  // 2. MÜƏLLİM KABİNETİNİ QORUYURUQ
  // -----------------------------------------------------------
  if (pathname.startsWith('/teacher-cabinet')) {
    if (!user || user.role !== 'teacher') {
      return NextResponse.redirect(new URL('/student-login', request.url))
    }
  }

  // -----------------------------------------------------------
  // 3. ŞAGİRD KABİNETİNİ QORUYURUQ
  // -----------------------------------------------------------
  if (pathname.startsWith('/student') && pathname !== '/student-login') {
    if (!user || user.role !== 'student') {
      return NextResponse.redirect(new URL('/student-login', request.url))
    }
  }

  // -----------------------------------------------------------
  // 4. ADMIN PANELİ (GİZLİ QALMALIDIR) 🕵️‍♂️
  // -----------------------------------------------------------
  if (pathname.startsWith('/admin')) {
    // Əgər istifadəçi giriş etməyibsə və ya Admin deyilsə
    if (!user || user.role !== 'admin') {
      
      // VARİANT A: Onu Ana Səhifəyə at (Sanki belə yer yoxdur)
      return NextResponse.redirect(new URL('/', request.url)) 
      
      // VARİANT B: Əgər tamamilə 404 vermək istəyirsənsə (daha çətindir, rewrite lazımdır), 
      // ən yaxşısı sadəcə '/' ana səhifəyə atmaqdır ki, şübhələnməsinlər.
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin/:path*',
    '/student-login'
  ],
}
