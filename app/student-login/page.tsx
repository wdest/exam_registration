"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { 
  User, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  FileText, 
  ShieldCheck 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Login Məzmunu (Suspense daxilində olmalıdır)
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL-dən tipi götürürük (student, exam, admin)
  const initialType = searchParams.get("type") || "student";

  const [activeTab, setActiveTab] = useState(initialType);
  const [identifier, setIdentifier] = useState(""); // ID və ya İstifadəçi adı
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // URL dəyişdikdə tabı dəyiş
  useEffect(() => {
    const type = searchParams.get("type");
    if (type) setActiveTab(type);
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // --- 1. ADMIN GİRİŞİ ---
      if (activeTab === "admin") {
        // Admin üçün sadə yoxlama (Real layihədə Supabase Auth istifadə etmək daha yaxşıdır)
        if (identifier === "admin" && password === "moc123") { // Şifrəni özün dəyişərsən
           document.cookie = "admin_token=true; path=/; max-age=86400"; // 1 günlük cookie
           router.push("/admin");
        } else {
           throw new Error("Yanlış admin məlumatları");
        }
      } 
      
      // --- 2. ŞAGİRD VƏ YA İMTAHAN GİRİŞİ ---
      else {
        // Burada şagirdin ID-sini yoxlayırıq
        const { data, error: dbError } = await supabase
          .from("students")
          .select("*")
          .eq("exam_id", identifier.trim()) // exam_id-ni giriş ID-si kimi istifadə edirik
          .single();

        if (dbError || !data) {
           throw new Error("İstifadəçi tapılmadı. ID nömrəsini yoxlayın.");
        }

        // Uğurlu giriş -> Kabinetə yönləndir
        // Burada gələcəkdə yaradacağımız kabinet səhifəsinə yönləndiririk
        alert(`Xoş gəldin, ${data.first_name} ${data.last_name}!`);
        // router.push(`/cabinet`); // Kabinet səhifəsi hazır olanda bunu açarsan
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Tabların Məlumatları
  const tabs = [
    { id: "student", label: "Şagird", icon: GraduationCap, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { id: "exam", label: "İmtahan", icon: FileText, color: "text-orange-600 bg-orange-50 border-orange-200" },
    { id: "admin", label: "Admin", icon: ShieldCheck, color: "text-gray-700 bg-gray-100 border-gray-200" },
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* --- SOL TƏRƏF (Bəzəkli Şəkil) --- */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-amber-500 to-orange-600 relative items-center justify-center overflow-hidden">
        {/* Arxa fon bəzəkləri */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-700/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="text-center text-white z-10 p-10">
            <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-3xl mx-auto flex items-center justify-center mb-8 shadow-2xl border border-white/30">
                <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain brightness-0 invert opacity-90" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight">Main Olympic Center</h2>
            <p className="text-orange-100 text-lg max-w-md mx-auto leading-relaxed">
                Təhsilin zirvəsinə doğru addımlayın. Şəxsi kabinetinizdən nəticələrinizi izləyin.
            </p>
        </div>
      </div>

      {/* --- SAĞ TƏRƏF (Form) --- */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative bg-gray-50/30">
        
        {/* Geri Qayıt Düyməsi */}
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-amber-600 transition font-medium">
            <ArrowLeft size={20} /> Ana Səhifə
        </Link>

        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            
            {/* Başlıq */}
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-800 mb-2">Xoş Gəlmisiniz! 👋</h3>
                <p className="text-gray-500 text-sm">Zəhmət olmasa giriş növünü seçin</p>
            </div>

            {/* Tablar (Şagird / İmtahan / Admin) */}
            <div className="grid grid-cols-3 gap-2 mb-8 p-1 bg-gray-100/50 rounded-xl border border-gray-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setError("");
                            setIdentifier("");
                            setPassword("");
                        }}
                        className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-all duration-300 ${
                            activeTab === tab.id 
                            ? "bg-white shadow-md text-gray-800 scale-100 ring-1 ring-black/5" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 scale-95"
                        }`}
                    >
                        <tab.icon size={20} className={`mb-1 ${activeTab === tab.id ? (tab.id === 'admin' ? 'text-gray-800' : 'text-amber-500') : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
                
                {/* ID Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                        {activeTab === "admin" ? "İstifadəçi Adı" : "Şagird ID"}
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-xl focus:ring-0 focus:border-amber-500 outline-none transition font-medium placeholder-gray-300"
                            placeholder={activeTab === "admin" ? "admin" : "Məs: 19576598"}
                            required
                        />
                    </div>
                </div>

                {/* Şifrə Input (Yalnız Admin üçün) */}
                {activeTab === "admin" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Şifrə</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-xl focus:ring-0 focus:border-amber-500 outline-none transition font-medium placeholder-gray-300"
                                placeholder="••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* Xəta Mesajı */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2 animate-pulse border border-red-100">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Submit Düyməsi */}
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2
                        ${activeTab === 'admin' 
                            ? 'bg-gray-800 hover:bg-black shadow-gray-300' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                        }
                    `}
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Daxil Ol"}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-gray-400 text-xs">
                    {activeTab === 'admin' 
                        ? "Admin paneli yalnız səlahiyyətli şəxslər üçündür."
                        : "ID nömrənizi unutmusunuzsa, bizimlə əlaqə saxlayın."
                    }
                </p>
            </div>

        </div>
      </div>
    </div>
  );
}

// Əsas Səhifə Komponenti
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={40}/></div>}>
      <LoginContent />
    </Suspense>
  );
}
