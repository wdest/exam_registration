import { cookies } from "next/headers";

// DİQQƏT: Funksiya 'async' olmalıdır
export async function checkAdminAuth() {
  const cookieStore = await cookies(); // <-- await əlavə olundu
  const adminCookie = cookieStore.get("super_admin_access"); 

  return adminCookie?.value === "true";
}
