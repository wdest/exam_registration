import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;

    // Şəkildəki dəyişəni çağırırıq: ADMIN_PASSWORD
    const SECRET_PIN = process.env.ADMIN_PASSWORD;

    // Təhlükəsizlik: Əgər serverdə parol yoxdursa, xəta versin
    if (!SECRET_PIN) {
      console.error("XƏTA: Environment variable (ADMIN_PASSWORD) tapılmadı!");
      return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }

    // Parol yoxlanışı
    // Frontend-dən gələn 'pin' ilə serverdəki 'SECRET_PIN' eynidirmi?
    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // Middleware üçün lazım olan 'sehrli' kuki
      response.cookies.set('super_admin_access', 'v2_secure_hash_99881122_matrix_mode', {
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 saat vaxt
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
