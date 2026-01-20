"use client";

import { ShieldAlert, ArrowRight, Lock } from "lucide-react";

export default function SecretEntry() {
  
  // DİQQƏT: Burada useState, onClick, fetch YOXDUR.
  // HTML Form birbaşa serverə gedir.

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-green-500 font-mono selection:bg-green-900">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      
      {/* METHOD="POST" -> Məlumat gizli paketdə gedir */}
      {/* ACTION="/api/auth" -> Birbaşa API-yə gedir */}
      <form 
        action="/api/auth" 
        method="POST" 
        className="relative z-10 flex flex-col items-center gap-6 p-12 border border-green-900/50 rounded-xl bg-black/80 shadow-2xl shadow-green-900/20 backdrop-blur-sm w-full max-w-md"
      >
        
        <div className="p-4 rounded-full border-2 border-green-600 bg-green-900/20">
            <Lock size={48} />
        </div>

        <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-widest uppercase">Restricted Area</h1>
            <p className="text-xs text-green-700">SECURE POST TUNNEL</p>
        </div>
        
        <div className="w-full relative group">
            <input 
              type="password" 
              name="pin"  // ✅ API bunu 'pin' adı ilə axtarır
              autoFocus
              required
              placeholder="ENTER PASSCODE" 
              className="w-full bg-black border border-green-800 text-center text-3xl tracking-[0.5em] text-green-400 p-4 rounded-lg outline-none focus:border-green-500 transition-all placeholder:text-green-900 placeholder:text-sm placeholder:tracking-normal"
            />
        </div>
        
        <button type="submit" className="group w-full bg-green-900/30 hover:bg-green-600 hover:text-black border border-green-800 py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider">
           Access System <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
        </button>

      </form>
    </div>
  );
}
