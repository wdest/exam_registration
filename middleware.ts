import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Admin Kukisini oxuyuruq
  const adminCookie = request.cookies.get('super_admin_access')?.value
  
  // URL yaratmaq üçün köməkçi
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // ===========================================================
  // 1. ADMIN PANELİ YOXLAMASI
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    // Sadəcə bu sözü yoxlayırıq. Hərfi-hərfinə eyni olmalıdır.
    if (adminCookie !== 'ACCESS_GRANTED_2026') {
      // Kuki yoxdursa və ya səhvdirsə -> Ana səhifəyə at
      return NextResponse.redirect(cleanUrl('/'))
    }
    // Düzdürsə -> Keç
    return NextResponse.next()
  }

  // ... (Kodun qalan hissəsi - Login, Student, Teacher olduğu kimi qalır) ...
  // ... (Burdan aşağısını öz kodunda saxla, dəyişməyə ehtiyac yoxdur) ...
  
  // Sadəcə Login hissəsini qısa xatırlatma olaraq qoyuram:
  const token = request.cookies.get('auth_token')?.value
  let user = null
  if (token) { try { user = JSON.parse(token) } catch (e) { user = null } }

  if (pathname === '/login') {
    if (user?.role === 'teacher') return NextResponse.redirect(cleanUrl('/teacher-cabinet'))
    if (user?.role === 'student') return NextResponse.redirect(cleanUrl('/student'))
    return NextResponse.next()
  }

  // Digər yoxlamalar...
  const isTeacherRoute = pathname.startsWith('/teacher-cabinet')
  const isStudentRoute = pathname.startsWith('/student') && pathname !== '/login'

  if (isTeacherRoute && (!user || user.role !== 'teacher')) return NextResponse.redirect(cleanUrl('/login'))
  if (isStudentRoute && (!user || user.role !== 'student')) return NextResponse.redirect(cleanUrl('/login'))

  const response = NextResponse.next()
  // Vaxt uzatma
  if (token) {
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 dəqiqə
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: ['/teacher-cabinet/:path*', '/student/:path*', '/admin/:path*', '/login'],
}
