import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  // Tokeni yoxlayırıq
  let user = null
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      user = null
    }
  }

  // -----------------------------------------------------------
  // 1. LOGIN SƏHİFƏSİ (Artıq giriş edibsə, içəri at)
  // -----------------------------------------------------------
  if (pathname === '/login') {
    if (user) {
      if (user.role === 'teacher') return NextResponse.redirect(new URL('/teacher-cabinet', request.url))
      if (user.role === 'student') return NextResponse.redirect(new URL('/student', request.url))
      if (user.role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // -----------------------------------------------------------
  // 2. MÜƏLLİM KABİNETİ QORUMASI
  // -----------------------------------------------------------
  if (pathname.startsWith('/teacher-cabinet')) {
    if (!user || user.role !== 'teacher') {
      // DİQQƏT: Artıq ?type=teacher YOXDUR. Sadəcə login.
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // -----------------------------------------------------------
  // 3. ŞAGİRD KABİNETİ QORUMASI
  // -----------------------------------------------------------
  if (pathname.startsWith('/student') && pathname !== '/login') {
    if (!user || user.role !== 'student') {
      // DİQQƏT: Artıq ?type=student YOXDUR. Sadəcə login.
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // -----------------------------------------------------------
  // 4. ADMIN PANELİ (GİZLİ)
  // -----------------------------------------------------------
  if (pathname.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      // Admin deyilsə, Ana Səhifəyə at
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
    '/login' 
  ],
}
