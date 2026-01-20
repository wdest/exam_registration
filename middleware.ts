import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const adminCookie = request.cookies.get('super_admin_access')?.value
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // 1. LOGLAMA (Vercel Loglarında bunu görəcəksən)
  if (pathname.startsWith('/admin')) {
    console.log(`[MIDDLEWARE] Admin Girişi: ${pathname}`);
    console.log(`[MIDDLEWARE] Kuki dəyəri: '${adminCookie}'`);
    
    // Şifrəni yoxlayırıq: 'ACCESS_GRANTED_2026'
    if (adminCookie !== 'ACCESS_GRANTED_2026') {
      console.log(`[MIDDLEWARE] ❌ İcazə yoxdur, ana səhifəyə atılır.`);
      return NextResponse.redirect(cleanUrl('/'))
    }
    console.log(`[MIDDLEWARE] ✅ İcazə verildi!`);
  }

  // Digər login yoxlamaları (Müəllim/Şagird)
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
  // 🛑 MATCHER-i DƏYİŞDİM: /admin sadəcə yox, həm də alt səhifələri tutsun
  matcher: [
    '/teacher-cabinet/:path*', 
    '/student/:path*', 
    '/admin',         // ✅ Bunu əlavə etdim (dəqiq /admin üçün)
    '/admin/:path*',  // ✅ Bu da alt səhifələr üçün
    '/login'
  ],
}
