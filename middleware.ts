import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // ===========================================================
  // 1. ADMIN PANELİ (URL-dən Kuki Yaratmaq)
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    
    // A. Əvvəlcə baxırıq: Brauzerdə kuki varmı?
    const secretCookie = request.cookies.get('super_admin_access')?.value

    // B. Əgər URL-də şifrə varsa (Məsələn: /admin?pass=123456)
    // Biz dərhal kuki yaradıb içəri salırıq
    const urlPass = searchParams.get('pass')

    if (urlPass === '123456') {
       const response = NextResponse.redirect(cleanUrl('/admin')) // Təmiz URL-ə atırıq
       
       // 🔥 MIDDLEWARE ÖZÜ KUKİ YAZIR (Bu 100% işləyir)
       response.cookies.set('super_admin_access', 'OPEN_SESAME', {
         httpOnly: true,
         secure: true,
         sameSite: 'lax',
         maxAge: 3600,
         path: '/'
       })
       return response
    }

    // C. Əgər kuki yoxdursa və ya səhvdirsə -> Çölə at
    if (secretCookie !== 'OPEN_SESAME') {
      return NextResponse.redirect(cleanUrl('/'))
    }
    
    // D. Hər şey qaydasındadırsa -> Davam
    return NextResponse.next()
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
  const isStudentRoute = pathname.startsWith('/student') && pathname !== '/login'

  if (isTeacherRoute && (!user || user.role !== 'teacher')) return NextResponse.redirect(cleanUrl('/login'))
  if (isStudentRoute && (!user || user.role !== 'student')) return NextResponse.redirect(cleanUrl('/login'))

  return NextResponse.next()
}

export const config = {
  matcher: ['/teacher-cabinet/:path*', '/student/:path*', '/admin/:path*', '/login'],
}
