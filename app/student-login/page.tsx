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
  Presentation,
  KeyRound 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialType = searchParams.get("type") || "student";

  const [activeTab, setActiveTab] = useState(initialType);
  const [identifier, setIdentifier] = useState(""); // Ad və ya ID
  const [password, setPassword] = useState("");     // Kod və ya Şifrə
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const type = searchParams.get("type");
    if (type) setActiveTab(type);
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // --- 1. MÜƏLLİM GİRİŞİ ---
      if (activeTab === "teacher") {
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .ilike("username", identifier.trim()) 
          .eq("password", password)          
          .single();

        if (teacherError || !teacher) {
          throw new Error("Ad və ya Kod yanlışdır.");
        }

        document.cookie = "teacher_token=true; path=/; max-age=86400"; 
        // alert(`Xoş gəldiniz, ${teacher.full_name || teacher.username}!`);
        router.push("/teacher-cabinet");
      } 
      
      // --- 2. ŞAGİRD GİRİŞİ (YENİLƏNDİ) ---
      else if (activeTab === "student") {
        // Şagird ID-si ilə giriş (student_code)
        const { data: studentData, error: studentError } = await supabase
          .from("local_students") // Cədvəl adı: local_students
          .select("id, first_name, last_name")
          .eq("student_code", identifier.trim()) // ID-ni yoxlayırıq
          .single();

        if (studentError || !studentData) {
           throw new Error("Şagird ID-si yanlışdır.");
        }

        // Kuki yaradılır (Şagirdin ID-si ilə)
        document.cookie = `student_token=${studentData.id}; path=/; max-age=86400`;
        
        // alert(`Xoş gəldin, ${studentData.first_name}!`);
        router.push("/student"); // Şagird kabinetinə atır
      }

      // --- 3. İMTAHAN GİRİŞİ (Hələlik boş) ---
      else if (activeTab === "exam") {
         // Buranı gələcəkdə imtahan sistemi üçün doldurarıq
         alert("İmtahan girişi hələ aktiv deyil.");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "student", label: "Şagird", icon: GraduationCap, color: "text-amber-600 bg-amber-50" },
    { id: "exam", label: "İmtahan", icon: FileText, color: "text-orange-600 bg-orange-50" },
    { id: "teacher", label: "Müəllim", icon: Presentation, color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex bg-white font-sans overflow-auto">
      
      {/* SOL TƏRƏF */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-amber-500 to-orange-600 relative items-center justify-center overflow-hidden">
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

      {/* SAĞ TƏRƏF (Form) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative bg-gray-50/30">
        
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-amber-600 transition font-medium z-10">
            <ArrowLeft size={20} /> Ana Səhifə
        </Link>

        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
            
            <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-gray-800 mb-2">Xoş Gəlmisiniz! 👋</h3>
                <p className="text-gray-500 text-sm">Zəhmət olmasa giriş növünü seçin</p>
            </div>

            {/* TABLAR */}
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
                        <tab.icon size={20} className={`mb-1 ${activeTab === tab.id ? (tab.id === 'teacher' ? 'text-blue-600' : 'text-amber-500') : ''}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                        {activeTab === "teacher" ? "Ad və Soyad" : (activeTab === "exam" ? "İmtahan Kodu" : "Şagird ID")}
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition">
                            <User size={20} />
                        </div>
                        <input
                            type={activeTab === "student" || activeTab === "exam" ? "number" : "text"}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-xl focus:ring-0 focus:border-amber-500 outline-none transition font-medium placeholder-gray-300"
                            placeholder={activeTab === "teacher" ? "Məs: Əli Vəliyev" : "Məs: 1234"}
                            required
                        />
                    </div>
                </div>

                {/* Şifrə/Kod Input (Yalnız Müəllim üçün) */}
                {activeTab === "teacher" && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">
                            Müəllim Kodu
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition">
                                <KeyRound size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-xl focus:ring-0 focus:border-amber-500 outline-none transition font-medium placeholder-gray-300"
                                placeholder="•••••"
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

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2 animate-pulse border border-red-100">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2
                        ${activeTab === 'teacher' 
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                        }
                    `}
                >
                    {loading ? <Loader2 className="animate-spin" /> : "Daxil Ol"}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-gray-400 text-xs">
                    {activeTab === 'teacher' 
                        ? "Kodunuzu unutmusunuzsa, rəhbərliyə müraciət edin."
                        : "ID nömrənizi unutmusunuzsa, bizimlə əlaqə saxlayın."
                    }
                </p>
            </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-white z-[100] flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={40}/></div>}>
      <LoginContent />
    </Suspense>
  );
}
