import { cookies } from "next/headers";

export async function checkAdminAuth() {
  try {
    // 🔥 DƏYİŞİKLİK BURADADIR: 'await' əlavə etdik
    const cookieStore = await cookies();
    
    // İndi artıq .get() işləyəcək
    const adminSession = cookieStore.get('super_admin_session')?.value;

    if (adminSession === 'ACCESS_GRANTED') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
