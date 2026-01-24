"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Instagram, Mail, ArrowRight, Loader2, CheckCircle, Phone } from "lucide-react";

export default function ComingSoon() {
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Gələcəkdə bura Supabase kodunu yaza bilərsən
    setTimeout(() => {
      setLoading(false);
      setNotified(true);
      setEmail("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-orange-50/50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-gray-800">
      
      {/* --- ARXA FON DEKORASİYA (DestTex Style) --- */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- MAIN CARD --- */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 md:p-12 text-center"
      >
        {/* LOGO */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6 flex justify-center"
        >
           <Image
             src="/logo.png" // Sənin loqon
             alt="Main Olympic Center Logo"
             width={180}
             height={80}
             className="object-contain h-24 w-auto drop-shadow-md"
             priority
           />
        </motion.div>

        {/* BAŞLIQ & MƏTN */}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
          Möhtəşəm bir şey <br/> 
          <span className="text-amber-500">hazırlanır...</span> 🚧
        </h1>
        
        <p className="text-gray-500 text-lg md:text-xl mb-8 max-w-lg mx-auto">
          Main Olympic Center saytı üzərində son tamamlanma işləri gedir. Tezliklə ən müasir təhsil platforması ilə xidmətinizdəyik.
        </p>

        {/* NOTIFICATION FORM */}
        {!notified ? (
          <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-10">
            <input 
              type="email" 
              placeholder="Email ünvanınız..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition text-gray-700"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:scale-105 hover:shadow-orange-500/50 transition-all disabled:opacity-70 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Xəbər Et <ArrowRight size={20}/></>}
            </button>
          </form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 text-green-700 p-4 rounded-xl mb-10 border border-green-200 font-medium flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} /> Təşəkkürlər! Sayt açılan kimi sizə xəbər verəcəyik.
          </motion.div>
        )}

        {/* SOCIAL LINKS & COPYRIGHT */}
        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© 2025 Main Olympic Center</p>
          
          <div className="flex gap-4">
            {/* Instagram Linki */}
            <a 
              href="https://www.instagram.com/main_olympic_center?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-gray-50 rounded-full hover:bg-amber-100 hover:text-amber-600 transition shadow-sm border border-gray-100"
              title="Instagram"
            >
              <Instagram size={20}/>
            </a>

            {/* WhatsApp Linki (070 207 37 92) */}
            <a 
              href="https://wa.me/994702073792" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-gray-50 rounded-full hover:bg-green-100 hover:text-green-600 transition shadow-sm border border-gray-100"
              title="WhatsApp: 070 207 37 92"
            >
              <Phone size={20}/>
            </a>

            {/* Email Linki */}
            <a 
              href="mailto:info@moc.az" 
              className="p-3 bg-gray-50 rounded-full hover:bg-orange-100 hover:text-orange-600 transition shadow-sm border border-gray-100"
              title="Email"
            >
              <Mail size={20}/>
            </a>
          </div>
        </div>

      </motion.div>

      {/* CREATED BY */}
      <div className="absolute bottom-4 text-xs text-gray-400 opacity-60">
        Created by DestTex
      </div>
    </div>
  );
}
