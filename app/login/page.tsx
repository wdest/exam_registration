"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User, Lock, Hash, ArrowRight, Key } from "lucide-react"; 

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [loginType, setLoginType] = useState<"teacher" | "student">("teacher");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [studentCode, setStudentCode] = useState("");
  const [accessCode, setAccessCode] = useState(""); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let body = {};

    if (loginType === "teacher") {
      body = { type: "teacher", identifier: username, password };
    } else {
      // Şagird girişi: ID və Access Code
      body = { type: "student", identifier: studentCode, password: accessCode };
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

      router.push(data.redirect);

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* SOL TƏRƏF */}
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

      {/* SAĞ TƏRƏF */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Xoş Gəlmisiniz</h2>
            <p className="text-gray-500 mt-2">Zəhmət olmasa hesabınıza daxil olun</p>
          </div>

          {/* TABLAR */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button onClick={() => setLoginType("teacher")} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginType === "teacher" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Müəllim</button>
            <button onClick={() => setLoginType("student")} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${loginType === "student" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Şagird</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            
            {loginType === "teacher" && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="text" placeholder="İstifadəçi adı" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input type="password" placeholder="Şifrə" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" required />
                </div>
              </>
            )}

            {loginType === "student" && (
              <>
                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Şagird Kodu (ID)" 
                    value={studentCode}
                    onChange={e => setStudentCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    required
                  />
                </div>
                {/* 🔥 DÜZƏLİŞ: .toUpperCase() sildim ki, kiçik hərfləri də olduğu kimi yazsın */}
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input 
                    type="text" // Şifrəni görmək üçün text etdim, istəsən password edərsən
                    placeholder="Access Code (Giriş Kodu)" 
                    value={accessCode}
                    onChange={e => setAccessCode(e.target.value)} // ARTIQ BÖYÜTMÜR
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-mono tracking-widest"
                    required
                  />
                </div>
              </>
            )}

            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
              {loading ? "Giriş edilir..." : "Daxil Ol"}
              {!loading && <ArrowRight size={20} />}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
