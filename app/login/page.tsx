"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, Hash, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Giriş növü: 'teacher' | 'student' | 'admin'
  const [loginType, setLoginType] = useState<"teacher" | "student" | "admin">("teacher");

  // İnputlar
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let body = {};

    // Struktura uyğun məlumatların hazırlanması
    if (loginType === "teacher") {
      body = { type: "teacher", identifier: username, password };
    } else if (loginType === "student") {
      body = { type: "student", identifier: studentCode };
    } else {
      body = { type: "admin", identifier: adminEmail, password };
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Giriş zamanı xəta baş verdi");
      }

      // Uğurlu giriş -> Yönləndirmə
      router.push(data.redirect);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* SOL TƏRƏF - Dizayn və Logo */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 to-indigo-900 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 text-center text-white p-12">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl mb-8 inline-block">
            <Image src="/logo.png" alt="MOC Logo" width={200} height={80} className="object-contain" priority />
          </div>
          <h1 className="text-4xl font-bold mb-4">Tədris İdarəetmə Sistemi</h1>
          <p className="text-blue-100 text-lg max-w-md mx-auto">
            Müəllim və şagirdlər üçün vahid platforma. İmtahan nəticələri, davamiyyət və daha çoxu.
          </p>
        </div>
      </div>

      {/* SAĞ TƏRƏF - Giriş Formu */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Xoş Gəlmisiniz</h2>
            <p className="text-gray-500 mt-2">Zəhmət olmasa hesabınıza daxil olun</p>
          </div>

          {/* TABLAR: Müəllim vs Şagird */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button
              onClick={() => setLoginType("teacher")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginType === "teacher" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Müəllim
            </button>
            <button
              onClick={() => setLoginType("student")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                loginType === "student" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Şagird
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* MÜƏLLİM FORMU */}
            {loginType === "teacher" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="İstifadəçi adı" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="password" 
                    placeholder="Şifrə" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </>
            )}

            {/* ŞAGİRD FORMU */}
            {loginType === "student" && (
              <div className="relative">
                <Hash className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Şagird Kodu (ID)" 
                  value={studentCode}
                  onChange={e => setStudentCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            )}

            {/* ADMIN FORMU (Gizli keçidlə aktivləşir) */}
            {loginType === "admin" && (
               <>
               <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <ShieldCheck size={16}/> Admin Girişi
               </div>
               <input 
                 type="email" 
                 placeholder="Admin Email" 
                 value={adminEmail}
                 onChange={e => setAdminEmail(e.target.value)}
                 className="w-full p-3 border border-gray-200 rounded-xl"
               />
               <input 
                 type="password" 
                 placeholder="Admin Şifrə" 
                 value={password}
                 onChange={e => setPassword(e.target.value)}
                 className="w-full p-3 border border-gray-200 rounded-xl"
               />
             </>
            )}

            <button 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {loading ? "Giriş edilir..." : "Daxil Ol"}
              {!loading && <ArrowRight size={20} />}
            </button>

          </form>

          {/* Admin keçidi üçün kiçik link (Footer) */}
          <div className="mt-8 text-center">
             {loginType !== 'admin' ? (
                <button onClick={() => setLoginType('admin')} className="text-xs text-gray-300 hover:text-gray-500 transition">
                  Admin?
                </button>
             ) : (
                <button onClick={() => setLoginType('teacher')} className="text-xs text-blue-500 hover:underline">
                  Geri qayıt
                </button>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
