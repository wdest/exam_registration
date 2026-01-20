import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // --- ADMIN YOXLAMASI ---
  if (pathname.startsWith('/admin')) {
    const secret = request.cookies.get('final_access_key')?.value

    // Kuki 'OPEN_SESAME' deyilsə -> Ana səhifəyə
    if (secret !== 'OPEN_SESAME') {
      return NextResponse.redirect(cleanUrl('/'))
    }
    return NextResponse.next()
  }
  // -----------------------

  // (Sənin digər kodların olduğu kimi qalır)
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
  matcher: ['/teacher-cabinet/:path*', '/student/:path*', '/admin/:path*', '/login'],
}
