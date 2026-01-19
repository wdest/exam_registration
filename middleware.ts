import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Şagird/Müəllim üçün Tokeni oxu
  const token = request.cookies.get('auth_token')?.value
  
  // 2. Admin üçün Gizli Kukini oxu (YENİ)
  const adminCookie = request.cookies.get('super_admin_access')?.value

  const { pathname } = request.nextUrl

  // 3. User məlumatını yoxla (Şagird/Müəllim üçün)
  let user = null
  if (token) {
    try {
      user = JSON.parse(token)
    } catch (e) {
      user = null
    }
  }

  // URL yaratmaq üçün köməkçi funksiya
  const cleanUrl = (path: string) => new URL(path, request.nextUrl.origin)

  // ===========================================================
  // 1. ADMIN PANELİ (GİZLİ QALMALIDIR) 🕵️‍♂️
  // ===========================================================
  if (pathname.startsWith('/admin')) {
    // Əgər gizli kuki yoxdursa -> Ana səhifəyə tulla (Stealth Mode)
    // Loginə atmırıq ki, kimsə admin panelin varlığını bilməsin.
    // ARTIQ "true" YOX, XÜSUSİ HASH YOXLAYIRIQ
    if (adminCookie !== 'v2_secure_hash_99881122_matrix_mode') {
      return NextResponse.redirect(cleanUrl('/'))
    }
    // Kuki varsa, burax keçsin
    return NextResponse.next()
  }

  // ===========================================================
  // 2. LOGIN SƏHİFƏSİ (/login)
  // (Əgər artıq giriş edibsə, onu gözlətmə, kabinetinə tulla)
  // ===========================================================
  if (pathname === '/login') {
    if (user) {
      if (user.role === 'teacher') return NextResponse.redirect(cleanUrl('/teacher-cabinet'))
      if (user.role === 'student') return NextResponse.redirect(cleanUrl('/student'))
    }
    return NextResponse.next()
  }

  // ===========================================================
  // 3. MÜƏLLİM KABİNETİ QORUMASI
  // ===========================================================
  if (pathname.startsWith('/teacher-cabinet')) {
    if (!user || user.role !== 'teacher') {
      return NextResponse.redirect(cleanUrl('/login'))
    }
  }

  // ===========================================================
  // 4. ŞAGİRD KABİNETİ QORUMASI
  // ===========================================================
  if (pathname.startsWith('/student') && pathname !== '/login') {
    if (!user || user.role !== 'student') {
      return NextResponse.redirect(cleanUrl('/login'))
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
