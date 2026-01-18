import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Tokeni yoxla
  let user = null
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      user = null
    }
  }

  // -----------------------------------------------------------
  // 1. LOGIN SƏHİFƏSİ (Artıq giriş edibsə, təkrar görməsin)
  // -----------------------------------------------------------
  // DƏYİŞİKLİK BURADA: /student-login əvəzinə /login oldu
  if (pathname === '/login') {
    if (user) {
      if (user.role === 'teacher') return NextResponse.redirect(new URL('/teacher-cabinet', request.url))
      if (user.role === 'student') return NextResponse.redirect(new URL('/student', request.url))
      if (user.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // -----------------------------------------------------------
  // 2. QORUNAN SƏHİFƏLƏR (Müəllim, Şagird)
  // -----------------------------------------------------------
  if (pathname.startsWith('/teacher-cabinet')) {
    if (!user || user.role !== 'teacher') {
      // DƏYİŞİKLİK: /login-ə yönləndiririk
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname.startsWith('/student') && pathname !== '/login') {
    if (!user || user.role !== 'student') {
      // DƏYİŞİKLİK: /login-ə yönləndiririk
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // -----------------------------------------------------------
  // 3. ADMIN PANELİ (Gizli)
  // -----------------------------------------------------------
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      // Admin deyilsə, Ana səhifəyə at (Gizlilik üçün)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin/:path*',
    '/login' // DƏYİŞİKLİK: student-login əvəzinə login
  ],
}
