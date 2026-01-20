import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // --- ADMIN GİRİŞİ ---
  if (pathname.startsWith('/admin')) {
    
    // Kukini yoxlayırıq
    const secret = request.cookies.get('super_admin_session')?.value

    // Əgər kuki bizim gizli token deyilsə -> QOV!
    if (secret !== 'ACCESS_GRANTED_SECURE_V2') {
      return NextResponse.redirect(cleanUrl('/'))
    }
    
    // İcazə ver
    return NextResponse.next()
  }

  // --- (Digər kodların - Login/Student/Teacher - Olduğu kimi saxla) ---
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
