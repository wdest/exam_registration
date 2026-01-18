"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. ADMIN GİRİŞİ (Sadəlik üçün hardcode edirik, istəsən bazadan yoxla)
      if (email === "admin@moc.com" && password === "moc123") {
        // Admin üçün kuki yaradırıq
        const adminData = JSON.stringify({ role: "admin", name: "Admin" });
        // Kukini 1 günlük təyin edirik
        document.cookie = `auth_token=${adminData}; path=/; max-age=86400; SameSite=Lax`;
        router.push("/admin");
        return;
      }

      // 2. SUPABASE GİRİŞİ (Müəllim və Şagirdlər üçün)
      // Əvvəlcə 'students' cədvəlini yoxlayaq (Şagird kodu və ya email ilə)
      // QEYD: Burda sadəlik üçün email/password login fərz edirik.
      // Sənin sistemdə şagird kodla girirsə, bura həmin məntiqi yazmalısan.
      
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
         // Userin rolunu tapmaq üçün metadata və ya cədvələ baxmaq lazımdır
         // Tutaq ki, metadata-da role var
         const role = user.user_metadata.role || "student"; 
         
         const userData = JSON.stringify({ 
             role: role, 
             id: user.id, 
             email: user.email 
         });
         
         document.cookie = `auth_token=${userData}; path=/; max-age=86400; SameSite=Lax`;

         if (role === "teacher") router.push("/teacher-cabinet");
         else router.push("/student");
      }

    } catch (error: any) {
      alert("Xəta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Giriş</h1>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 p-3 border rounded-lg"
        />
        <input 
          type="password" 
          placeholder="Şifrə" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-6 p-3 border rounded-lg"
        />
        <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">
          {loading ? "Giriş edilir..." : "Daxil Ol"}
        </button>
      </form>
    </div>
  );
}
