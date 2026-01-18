"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ======================================================
      // 1. ADMIN GİRİŞİ (Hardcoded - Ən sadə və təhlükəsiz yol)
      // ======================================================
      // Sən admin panelə bu email və parol ilə girəcəksən:
      if (email === "admin@moc.com" && password === "moc12345") {
        
        // Admin üçün xüsusi "auth_token" yaradırıq
        const adminData = JSON.stringify({ 
            role: "admin", 
            name: "Baş Admin",
            email: "admin@moc.com" 
        });

        // Kukini brauzerə yazırıq (1 gün müddətinə)
        document.cookie = `auth_token=${adminData}; path=/; max-age=86400; SameSite=Lax`;
        
        // Admin panelə yönləndiririk
        router.push("/admin");
        return;
      }

      // ======================================================
      // 2. ŞAGİRD / MÜƏLLİM GİRİŞİ (Supabase User Table)
      // ======================================================
      
      // Supabase-dən yoxlayırıq
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Email və ya şifrə yanlışdır.");
      }

      if (data.user) {
         // İstifadəçinin rolunu təyin edirik.
         // (Gələcəkdə 'profiles' cədvəlindən də oxuya bilərik)
         // Hələlik metadata-dan oxuyuruq, yoxdursa 'student' sayırıq.
         const role = data.user.user_metadata?.role || "student"; 
         
         const userData = JSON.stringify({ 
             role: role, 
             id: data.user.id, 
             email: data.user.email 
         });
         
         // Middleware üçün token yaradırıq
         document.cookie = `auth_token=${userData}; path=/; max-age=86400; SameSite=Lax`;

         // Roluna uyğun səhifəyə atırıq
         if (role === "teacher") {
             router.push("/teacher-cabinet");
         } else {
             router.push("/student");
         }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Giriş zamanı xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      
      {/* Arxa fon bəzəkləri */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="flex flex-col items-center mb-8">
            {/* Logo yeri (əgər varsa) */}
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-800">Xoş Gəldiniz</h1>
            <p className="text-gray-400 mt-2 font-medium">Kabinetə daxil olmaq üçün məlumatları yazın</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100 animate-pulse">
                <AlertCircle size={20} />
                {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email Ünvanı</label>
            <input 
              type="email" 
              required
              placeholder="nümunə@gmail.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Şifrə</label>
            <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition font-medium text-gray-800 pr-12"
                />
                <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
            {loading ? "Giriş edilir..." : "Daxil Ol"}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
                Şifrəni unutmusunuz? <span className="text-blue-600 font-bold cursor-pointer hover:underline">Adminlə əlaqə saxlayın</span>
            </p>
        </div>

      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 text-center text-gray-400 text-xs">
          &copy; 2024 Main Olympic Center. All rights reserved.
      </div>

    </div>
  );
}

// İkon üçün əlavə
function AlertCircle({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    )
}
