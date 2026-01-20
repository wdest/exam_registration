import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    // Vercel-dəki Environment Variable-ı oxuyuruq
    const SECRET_PIN = process.env.ADMIN_PASSWORD;

    if (!SECRET_PIN) {
      return NextResponse.json({ success: false, message: "Server Error: Parol tapılmadı" }, { status: 500 });
    }

    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // 🔥 PRODUCTION AYARLARI (Maksimum Təhlükəsizlik)
      response.cookies.set('super_admin_access', 'v2_secure_hash_99881122_matrix_mode', {
        httpOnly: true, // JavaScript oxuya bilməz (XSS-dən qoruyur)
        secure: true,   // 🔒 YALNIZ HTTPS! (Vercel-də mütləq true olmalıdır)
        sameSite: 'lax',// 'Strict' bəzən redirect zamanı kukini itirir. 'Lax' həm təhlükəsizdir, həm login üçün idealdır.
        maxAge: 60 * 60, // 1 saat
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json({ success: false, message: "Yanlış Parol" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false, message: "Sistem xətası" }, { status: 500 });
  }
}
