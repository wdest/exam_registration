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
      // 1. ADMIN GİRİŞİ (Sənin kodun)
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
         // Rolu yoxla (metadata-dan)
         const role = data.user.user_metadata?.role || "student"; 
         
         // Kabinetə yönləndir
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
    <div className="min-h-screen flex bg-white">
      
      {/* --- SOL TƏRƏF (LOGO) --- */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-900 items-center justify-center relative overflow-hidden">
        {/* Arxa fon bəzəkləri */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-purple-500 rounded-full blur-3xl opacity-30"></div>

        {/* LOGO QUTUSU */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-12 rounded-3xl shadow-2xl flex items-center justify-center">
             {/* Logo şəkli - public qovluğunda logo.png olmalıdır */}
             <Image 
                src="/logo.png" 
                alt="Logo" 
                width={250} 
                height={250} 
                className="object-contain drop-shadow-lg"
                priority
             />
        </div>
      </div>

      {/* --- SAĞ TƏRƏF (FORM) --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-gray-50">
        <div className="w-full max-w-md space-y-8">
            
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Xoş Gəldiniz!</h2>
                <p className="mt-2 text-gray-500">Kabinetə daxil olmaq üçün məlumatlarınızı daxil edin</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100 animate-pulse">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input 
                        type="email" 
                        required
                        placeholder="mail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition font-medium"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Şifrə</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition font-medium pr-12"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button 
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                    {loading ? "Gözləyin..." : "Daxil Ol"}
                </button>

            </form>

            <div className="text-center text-sm text-gray-400 mt-6">
                © 2024 Main Olympic Center
            </div>
        </div>
      </div>

    </div>
  );
}
