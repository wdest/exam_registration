import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin } = body;
    const SECRET_PIN = process.env.ADMIN_PASSWORD; // Vercel-də Environment Variable-a bunu yazdığına əmin ol!

    if (pin === SECRET_PIN) {
      const response = NextResponse.json({ success: true });

      // 🔥 VERCEL ÜÇÜN XÜSUSİ AYARLAR
      response.cookies.set('super_admin_access', 'v2_secure_hash_99881122_matrix_mode', {
        httpOnly: true, 
        secure: true,    // ✅ Vercel (HTTPS) olduğu üçün MÜTLƏQ TRUE
        sameSite: 'lax', // ✅ BU ÇOX VACİBDİR! 'Strict' olsa redirect edəndə kuki itir. 'Lax' qoy.
        maxAge: 60 * 60, // 1 saat
        path: '/',       // Bütün saytda keçərli olsun
      });

      return response;
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
