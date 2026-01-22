import { cookies } from "next/headers";

export async function checkAdminAuth() {
  try {
    const cookieStore = cookies();
    
    // Middleware-in yaratdığı kukini oxuyuruq
    const adminSession = cookieStore.get('super_admin_session')?.value;

    // Əgər kuki varsa və dəyəri 'ACCESS_GRANTED'-dirsə, deməli Admindir
    if (adminSession === 'ACCESS_GRANTED') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
