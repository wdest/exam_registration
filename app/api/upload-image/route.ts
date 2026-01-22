import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "../../../lib/admin-check";

export async function POST(req: Request) {
  try {
    // 1. Admin Yoxlanışı (Ən vacib hissə)
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: "İcazəsiz giriş!" }, { status: 401 });
    }

    // 2. Form Data-nı oxuyuruq (Fayl buradan gəlir)
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "gallery"; // Default olaraq gallery

    if (!file) {
      return NextResponse.json({ error: "Fayl seçilməyib." }, { status: 400 });
    }

    // 3. Faylın adını unikallaşdırırıq
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    // 4. Supabase Admin Client (Service Role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Storage-ə yükləyirik
    const { data, error } = await supabase.storage
      .from("images") // Bucket adı
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    // 6. Public URL əldə edirik
    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error: any) {
    console.error("Upload xətası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
