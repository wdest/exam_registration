"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, ShieldAlert, ArrowRight } from "lucide-react";

export default function SecretEntry() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSecretLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // API-yə sorğu göndəririk (Server-Side Cookie üçün)
      const res = await fetch("/api/admin-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        throw new Error("Yanlış PIN");
      }
    } catch (err) {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-green-500 font-mono selection:bg-green-900">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      
      <form onSubmit={handleSecretLogin} className="relative z-10 flex flex-col items-center gap-6 p-12 border border-green-900/50 rounded-xl bg-black/80 shadow-2xl shadow-green-900/20 backdrop-blur-sm w-full max-w-md">
        
        <div className={`p-4 rounded-full border-2 transition-all duration-300 ${error ? "border-red-600 bg-red-900/20 text-red-600 animate-shake" : "border-green-600 bg-green-900/20"}`}>
            {error ? <ShieldAlert size={48} /> : <Fingerprint size={48} />}
        </div>

        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-widest uppercase">Restricted Area</h1>
            <p className="text-xs text-green-700">MOC SECURITY SYSTEM V2.0</p>
        </div>
        
        <div className="w-full relative group">
            <input 
              type="password" 
              autoFocus
              placeholder="ENTER PASSCODE" 
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full bg-black border border-green-800 text-center text-3xl tracking-[0.5em] text-green-400 p-4 rounded-lg outline-none focus:border-green-500 focus:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all placeholder:text-green-900 placeholder:text-sm placeholder:tracking-normal"
            />
        </div>
        
        <button className="group w-full bg-green-900/30 hover:bg-green-600 hover:text-black border border-green-800 py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
           Access System <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
        </button>

      </form>
    </div>
  );
}
