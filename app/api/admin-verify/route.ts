import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;
    const SECRET_PIN = process.env.ADMIN_PASSWORD;

    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // 🔥 PRODUCTION STANDARTI
      response.cookies.set('super_admin_access', 'v2_secure_hash_99881122_matrix_mode', {
        httpOnly: true, 
        
        // Bu kod avtomatik başa düşür: Sayt Vercel-dədirsə -> Secure: TRUE
        // Yox əgər Localhost-dursa -> Secure: FALSE (xəta verməsin deyə)
        secure: process.env.NODE_ENV === 'production', 
        
        // ⚠️ BU ÇOX VACİBDİR: 'Lax' qoy ki, redirect zamanı kuki itməsin!
        sameSite: 'lax', 
        
        maxAge: 60 * 60, // 1 saat
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
