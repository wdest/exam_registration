import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // ===========================================================
  // 1. ADMIN PANELİ YOXLAMASI (TEST REJİMİ)
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    
    // Kukini oxuyuruq
    const secret = request.cookies.get('final_test_cookie')?.value

    // Əgər kuki 'OPEN_SESAME' deyilsə -> Ana səhifəyə at
    if (secret !== 'OPEN_SESAME') {
      return NextResponse.redirect(cleanUrl('/'))
    }
    
    // Düzdürsə -> İcazə ver
    return NextResponse.next()
  }

  // ===========================================================
  // 2. MÜƏLLİM VƏ ŞAGİRD (Sənin köhnə kodların)
  // ===========================================================
  const token = request.cookies.get('auth_token')?.value
  let user = null
  if (token) { try { user = JSON.parse(token) } catch (e) { user = null } }

  if (pathname === '/login') {
    if (user?.role === 'teacher') return NextResponse.redirect(cleanUrl('/teacher-cabinet'))
    if (user?.role === 'student') return NextResponse.redirect(cleanUrl('/student'))
    return NextResponse.next()
  }

  const isTeacherRoute = pathname.startsWith('/teacher-cabinet')
  const isStudentRoute = pathname.startsWith('/student') && pathname !== '/login'

  if (isTeacherRoute && (!user || user.role !== 'teacher')) return NextResponse.redirect(cleanUrl('/login'))
  if (isStudentRoute && (!user || user.role !== 'student')) return NextResponse.redirect(cleanUrl('/login'))

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin/:path*', // Admin qovluğu
    '/login'
  ],
}
