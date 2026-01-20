import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // 🔥 GİZLİ PAROL (Bunu Page.tsx ilə eyni saxla)
  const MASTER_KEY = "MOC_ULTRA_SECURE_2026";

  // ===========================================================
  // 1. ADMIN PANELİ QORUMASI
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    
    // A. KUKİ VARMI? (Varsa keçsin)
    const cookie = request.cookies.get('super_admin_session')?.value
    if (cookie === 'ACCESS_GRANTED') {
      return NextResponse.next()
    }

    // B. URL-DƏ AÇAR GƏLDİMİ? (Login olanda bu işləyəcək)
    const urlToken = searchParams.get('access_token')

    if (urlToken === MASTER_KEY) {
      // Kodu gördük -> Kukini veririk -> Adminə salırıq
      const response = NextResponse.redirect(cleanUrl('/admin'))
      
      response.cookies.set('super_admin_session', 'ACCESS_GRANTED', {
        httpOnly: true,
        secure: true,    // Vercel üçün
        sameSite: 'lax',
        maxAge: 3600,    // 1 saat
        path: '/'
      })
      
      return response
    }

    // C. KUKİ YOXDURSA -> O GİZLİ SƏHİFƏYƏ TULLA! (Ana səhifəyə yox)
    // 👇 Dəyişiklik buradadır:
    return NextResponse.redirect(cleanUrl('/system-config-v2'))
  }

  // ===========================================================
  // 2. DIGƏR HİSSƏLƏR (Login, Student, Teacher - Olduğu kimi)
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
  if (isTeacherRoute && (!user || user.role !== 'teacher')) return NextResponse.redirect(cleanUrl('/login'))
  
  const isStudentRoute = pathname.startsWith('/student') && pathname !== '/login'
  if (isStudentRoute && (!user || user.role !== 'student')) return NextResponse.redirect(cleanUrl('/login'))

  return NextResponse.next()
}

export const config = {
  matcher: ['/teacher-cabinet/:path*', '/student/:path*', '/admin/:path*', '/login'],
}
