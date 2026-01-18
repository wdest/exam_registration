"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Eye, EyeOff, Loader2, LogIn, AlertCircle } from "lucide-react";
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
      // 1. ADMIN GİRİŞİ (Statik yoxlama)
      if (email === "admin@moc.com" && password === "moc12345") {
        document.cookie = "super_admin_access=true; path=/; max-age=86400; SameSite=Lax";
        router.push("/admin");
        return;
      }

      // 2. SUPABASE GİRİŞİ (Müəllim və Şagird)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw new Error("Email və ya şifrə yanlışdır.");

      if (data.user) {
         // Rolu yoxla
         const role = data.user.user_metadata?.role || "student"; 
         
         if (role === "teacher") {
             router.push("/teacher-cabinet");
         } else {
             router.push("/student");
         }
      }

    } catch (err: any) {
      setError(err.message || "Giriş zamanı xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- SOL TƏRƏF (DİZAYN) --- */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 items-center justify-center relative overflow-hidden">
        
        {/* Arxa fon bəzəkləri (Blur effektləri) */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-40"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-purple-600 rounded-full blur-[150px] opacity-40"></div>

        {/* ORTADAKI ŞÜŞƏ QUTU (GLASSMORPHISM) */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-16 rounded-3xl shadow-2xl flex items-center justify-center">
             {/* Logo - public/logo.png faylı olmalıdır */}
             <div className="relative w-48 h-48">
                <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                />
             </div>
        </div>
      </div>

      {/* --- SAĞ TƏRƏF (FORM) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white">
        <div className="w-full max-w-md space-y-10">
            
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">Xoş Gəldiniz!</h2>
                <p className="text-gray-500 font-medium">Kabinetə daxil olmaq üçün məlumatlarınızı daxil edin</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 border border-red-100 animate-pulse">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                    <input 
                        type="email" 
                        required
                        placeholder="mail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-gray-800"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Şifrə</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all font-medium text-gray-800 pr-12"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                        </button>
                    </div>
                </div>

                <button 
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <LogIn size={24} />}
                    {loading ? "Gözləyin..." : "Daxil Ol"}
                </button>

            </form>

            <div className="text-center">
                <p className="text-sm text-gray-400">© 2024 Main Olympic Center</p>
            </div>
        </div>
      </div>

    </div>
  );
}
