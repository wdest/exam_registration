import { cookies } from "next/headers";

export function checkAdminAuth() {
  const cookieStore = cookies();
  const adminCookie = cookieStore.get("super_admin_access"); 

  // Əgər kuki yoxdursa və ya dəyəri 'true' deyilsə -> YALAN
  return adminCookie?.value === "true";
}
