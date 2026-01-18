"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  User, ArrowLeft, Loader2, Eye, EyeOff, 
  GraduationCap, Presentation, KeyRound, ShieldCheck 
} from "lucide-react";
// Animasiya kitabxanasını əlavə edirik
import { motion } from "framer-motion"; 

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const secretKey = searchParams.get("key");
  const isAdminUnlocked = secretKey === "moc_gizli_giris"; 

  const urlType = searchParams.get("type");
  const initialType = (urlType === "admin" && isAdminUnlocked) ? "admin" : (urlType || "student");

  const [activeTab, setActiveTab] = useState(initialType);
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");      
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (urlType === "admin" && !isAdminUnlocked) {
        setActiveTab("student");
    } else if (urlType) {
        setActiveTab(urlType);
    }
  }, [urlType, isAdminUnlocked]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          identifier,
          password: activeTab === 'student' ? null : password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Giriş zamanı xəta baş verdi");
      }

      router.push(data.redirect);
      router.refresh(); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      // Uğurlu olsa belə loading qalsın ki, keçid zamanı ağ ekran görünməsin
      if (!error) {
         // setLoading(false) - bunu bilərəkdən bağlamırıq ki, səhifə dəyişənə qədər fırlansın
      } else {
         setLoading(false);
      }
    }
  }

  const defaultTabs = [
    { id: "student", label: "Şagird", icon: GraduationCap },
    { id: "teacher", label: "Müəllim", icon: Presentation },
  ];

  const tabs = isAdminUnlocked 
    ? [...defaultTabs, { id: "admin", label: "Admin", icon: ShieldCheck }]
    : defaultTabs;

  return (
    <div className="fixed inset-0 z-[100] flex bg-white font-sans overflow-auto">
      
      {/* SOL DEKOR - Animasiyalı */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-amber-500 to-orange-600 relative items-center justify-center overflow-hidden"
      >
        <motion.div 
           animate={{ scale: [1, 1.1, 1] }} 
           transition={{ repeat: Infinity, duration: 10 }}
           className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"
        ></motion.div>
        <motion.div 
           animate={{ scale: [1, 1.2, 1] }} 
           transition={{ repeat: Infinity, duration: 8, delay: 1 }}
           className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700/20 rounded-full blur-3xl -ml-20 -mb-20"
        ></motion.div>
        
        <div className="text-center text-white z-10 p-10">
            <h2 className="text-4xl font-black mb-4 tracking-tight drop-shadow-md">Main Olympic Center</h2>
            <p className="text-orange-100 text-lg max-w-md mx-auto">Təhsilin zirvəsinə doğru.</p>
        </div>
      </motion.div>

      {/* SAĞ FORM - Animasiyalı */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 bg-gray-50/30 relative"
      >
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-amber-600 transition font-medium z-10">
            <ArrowLeft size={20} /> Ana Səhifə
        </Link>

        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
            {/* Yüklənmə zamanı üstə gələn overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in">
                    <Loader2 size={48} className="text-amber-500 animate-spin mb-2" />
                    <p className="text-gray-500 font-bold animate-pulse">Giriş edilir...</p>
                </div>
            )}

            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-800">
                    {activeTab === 'admin' ? "Gizli Admin Paneli 🛡️" : "Giriş Paneli 🎓"}
                </h3>
            </div>

            {/* TABLAR */}
            <div className={`grid gap-2 mb-8 p-1 bg-gray-100/50 rounded-xl ${tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setError(""); setIdentifier(""); setPassword(""); }}
                        className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-all ${
                            activeTab === tab.id ? "bg-white shadow text-gray-800 scale-105" : "text-gray-400 hover:bg-gray-200/50"
                        }`}
                    >
                        <tab.icon size={20} className={`mb-1 ${activeTab === tab.id ? "text-amber-500" : ""}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                        {activeTab === "teacher" || activeTab === "admin" ? "İstifadəçi Adı" : "Şagird ID"}
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <User size={20} />
                        </div>
                        <input
                            type={activeTab === "student" ? "number" : "text"}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-amber-500 outline-none transition"
                            placeholder={activeTab === "student" ? "Məs: 1001" : ""}
                            required
                        />
                    </div>
                </motion.div>

                {activeTab !== "student" && (
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Şifrə</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                <KeyRound size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-amber-500 outline-none transition"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
                        ⚠️ {error}
                    </motion.div>
                )}

                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:to-orange-700 shadow-lg transition-all flex justify-center items-center"
                >
                    {loading ? "Yoxlanılır..." : "Daxil Ol"}
                </motion.button>
            </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
