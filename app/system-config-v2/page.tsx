"use client";
import { useState, useEffect } from "react";
// useRouter lazım deyil, çünki form özü redirect edəcək

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // URL-də error varsa (serverdən qayıdanda), qırmızı yansın
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error")) setError(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-green-500 font-mono selection:bg-green-900">
      {/* Arxa fon effekti */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

      {/* 🔥 VACİB: Form birbaşa sənin API-yə göndərir (Server Action kimi) 
          action="/api/admin-login" -> Sənin API faylının yolu
          method="POST" -> API POST qəbul edir
      */}
      <form 
        action="/api/admin-login" 
        method="POST" 
        onSubmit={() => setLoading(true)}
        className="relative z-10 flex flex-col gap-4 p-8 border border-green-800 bg-black/80 shadow-[0_0_20px_rgba(0,255,0,0.2)] rounded-xl"
      >
        <h1 className="text-center text-xl font-bold tracking-widest animate-pulse">
          SYSTEM ACCESS
        </h1>

        {/* Name="pin" olmalıdır ki, API formData.get('pin') ilə tuta bilsin */}
        <input 
          type="password" 
          name="pin"
          placeholder="ENTER PASSCODE"
          required
          className={`bg-gray-900 border ${error ? "border-red-600 animate-shake" : "border-green-700"} p-3 text-center outline-none focus:border-green-400 text-green-400 placeholder-green-800 w-64 tracking-[0.5em]`}
          onChange={() => setError(false)} // Yazanda qırmızılıq getsin
        />

        <button 
          disabled={loading} 
          className="bg-green-900/50 text-green-400 font-bold p-3 hover:bg-green-700 hover:text-black transition border border-green-800 uppercase tracking-wider"
        >
           {loading ? "AUTHENTICATING..." : "INITIATE SESSION"}
        </button>

        {error && (
            <p className="text-red-500 text-xs text-center font-bold mt-2">ACCESS DENIED</p>
        )}
      </form>
    </div>
  );
}
