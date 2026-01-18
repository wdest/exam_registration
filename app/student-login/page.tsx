"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  User, ArrowLeft, Loader2, Eye, EyeOff, 
  GraduationCap, Presentation, KeyRound, ShieldCheck 
} from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🔒 GİZLİ MƏNTİQ BURADADIR
  // Uşaqlar URL-də "?type=admin" yazsa belə admin açılmayacaq.
  // Yalnız "?key=moc_gizli_giris" yazsan admin görünəcək.
  const secretKey = searchParams.get("key");
  const isAdminUnlocked = secretKey === "moc_gizli_giris"; 

  // URL-dən tipi oxuyuruq, amma admin olmağa icazə varsa
  const urlType = searchParams.get("type");
  const initialType = (urlType === "admin" && isAdminUnlocked) ? "admin" : (urlType || "student");

  const [activeTab, setActiveTab] = useState(initialType);
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");      
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Əgər kimsə əllə url-i dəyişib admin etmək istəsə və açarı yoxdursa, student-ə at
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
          // Şagirdin şifrəsi yoxdur
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
      setLoading(false);
    }
  }

  // --- TABLAR ---
  const defaultTabs = [
    { id: "student", label: "Şagird", icon: GraduationCap },
    { id: "teacher", label: "Müəllim", icon: Presentation },
  ];

  // Admin tabını yalnız "Secret Key" varsa siyahıya əlavə edirik
  const tabs = isAdminUnlocked 
    ? [...defaultTabs, { id: "admin", label: "Admin", icon: ShieldCheck }]
    : defaultTabs;

  return (
    <div className="fixed inset-0 z-[100] flex bg-white font-sans overflow-auto">
      
      {/* SOL DEKOR (Narıncı Dizayn) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-amber-500 to-orange-600 relative items-center justify-center overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        <div className="text-center text-white z-10 p-10">
            <h2 className="text-4xl font-black mb-4 tracking-tight">Main Olympic Center</h2>
            <p className="text-orange-100 text-lg max-w-md mx-auto">Təhsilin zirvəsinə doğru.</p>
        </div>
      </div>

      {/* SAĞ FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 bg-gray-50/30 relative">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-amber-600 transition font-medium z-10">
            <ArrowLeft size={20} /> Ana Səhifə
        </Link>

        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
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
                            activeTab === tab.id ? "bg-white shadow text-gray-800" : "text-gray-400 hover:bg-gray-200/50"
                        }`}
                    >
                        <tab.icon size={20} className={`mb-1 ${activeTab === tab.id ? "text-amber-500" : ""}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
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
                </div>

                {/* Şifrə Input (Student xaric hamı üçün) */}
                {activeTab !== "student" && (
                    <div>
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
                    </div>
                )}

                {error && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">⚠️ {error}</div>}

                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:to-orange-700 shadow-lg transition-all flex justify-center items-center">
                    {loading ? <Loader2 className="animate-spin" /> : "Daxil Ol"}
                </button>
            </form>
        </div>
      </div>
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
