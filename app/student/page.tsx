"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  LogOut, User, BarChart3, GraduationCap, Calendar, 
  TrendingUp, Activity, PieChart, ShieldCheck, PenTool
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hazır avatarlar (Karikatura əvəzi)
const AVATARS = [
  "👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️"
];

export default function StudentCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [groupName, setGroupName] = useState("Qrup yoxdur");
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA STATE
  const [stats, setStats] = useState({ avgScore: "0", attendance: "0" });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  
  // AVATAR STATE
  const [selectedAvatar, setSelectedAvatar] = useState("👨‍🎓");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  // 1. Giriş Yoxlanışı və Data Çəkmək
  useEffect(() => {
    const checkAuth = async () => {
      // Login-dən gələn tokeni (ID-ni) oxuyuruq
      const cookies = document.cookie.split("; ");
      const tokenRow = cookies.find((row) => row.trim().startsWith("student_token="));
      
      if (!tokenRow) {
        router.push("/student-login"); // Loginə at
        return;
      }

      const studentId = tokenRow.split("=")[1];

      // Şagird məlumatlarını gətir
      const { data: sData } = await supabase.from('local_students').select('*').eq('id', studentId).single();
      
      if (sData) {
        setStudent(sData);
        fetchGroupInfo(sData.id);
        fetchAnalytics(sData.id);
        
        // Əgər bazada avatar sütunu olsaydı ordan çəkərdik, hələlik local state
        // localStorage-dən avatarı oxuyaq (yadda qalsın deyə)
        if (typeof window !== 'undefined') {
            const savedAvatar = localStorage.getItem(`avatar_${sData.id}`);
            if(savedAvatar) setSelectedAvatar(savedAvatar);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // 2. Qrup Məlumatını Tapmaq
  const fetchGroupInfo = async (studentId: number) => {
    const { data } = await supabase
      .from('group_members')
      .select('groups (name)')
      .eq('student_id', studentId)
      .limit(1) // Tutaq ki, əsas 1 qrupu var
      .single();
    
    if (data && data.groups) {
      // @ts-ignore
      setGroupName(data.groups.name);
    }
  };

  // 3. Analiz və Qiymətlər
  const fetchAnalytics = async (studentId: number) => {
    const { data: grades } = await supabase
      .from('daily_grades')
      .select('*')
      .eq('student_id', studentId)
      .order('grade_date', { ascending: true });

    if (!grades || grades.length === 0) return;

    // --- Statistika ---
    const scoredGrades = grades.filter((g: any) => g.score !== null);
    const avg = scoredGrades.length > 0 
        ? scoredGrades.reduce((a: number, b: any) => a + b.score, 0) / scoredGrades.length 
        : 0;
    
    const presentCount = grades.filter((g: any) => g.attendance === true).length;
    const attRate = (presentCount / grades.length) * 100;

    setStats({
        avgScore: avg.toFixed(1),
        attendance: attRate.toFixed(0)
    });

    // --- Chart Data (Son 10 dərs) ---
    const chart = scoredGrades.slice(-10).map((g: any) => ({
        date: g.grade_date.slice(5), // MM-DD
        score: g.score
    }));
    setChartData(chart);

    // --- Son Jurnal (Tərsinə çevir - ən yeni üstdə) ---
    // Massivi kopyalayırıq ki, orijinal sıralama pozulmasın (reverse mutable-dir)
    setRecentGrades([...grades].reverse().slice(0, 5));
  };

  // Avatar Dəyişmək
  const handleAvatarChange = (avatar: string) => {
      setSelectedAvatar(avatar);
      if(student && typeof window !== 'undefined') localStorage.setItem(`avatar_${student.id}`, avatar);
      setIsAvatarMenuOpen(false);
  };

  const handleLogout = () => {
    document.cookie = "student_token=; path=/; max-age=0";
    router.push("/student-login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-indigo-600 font-bold">Kabinet yüklənir...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* NAVBAR */}
      <nav className="bg-white px-6 py-4 shadow-sm border-b sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
            <GraduationCap /> Şagird Paneli
        </h1>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800">{student?.first_name} {student?.last_name}</p>
                <p className="text-xs text-indigo-500 font-medium">{groupName}</p>
            </div>
            <div className="relative">
                <button onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)} className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-2xl border-2 border-indigo-200 cursor-pointer hover:scale-105 transition">
                    {selectedAvatar}
                </button>
                {/* Avatar Menu */}
                {isAvatarMenuOpen && (
                    <div className="absolute right-0 top-12 bg-white p-3 rounded-xl shadow-xl border w-48 grid grid-cols-4 gap-2 z-50">
                        {AVATARS.map(av => (
                            <button key={av} onClick={() => handleAvatarChange(av)} className="text-2xl hover:bg-gray-100 p-1 rounded transition">{av}</button>
                        ))}
                    </div>
                )}
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">
                <LogOut size={20} />
            </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        
        {/* XOŞ GƏLDİNİZ KARTI */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, {student?.first_name}! 👋</h2>
                <p className="opacity-90">Sənin uğur yolun burdan başlayır. Hazırda <b>{groupName}</b> qrupundasan.</p>
            </div>
            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center min-w-[120px]">
                <p className="text-xs opacity-80 uppercase font-bold">Ortalama</p>
                <p className="text-3xl font-bold">{stats.avgScore}</p>
            </div>
        </div>

        {/* TAB MENYU */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><BarChart3 size={20} /> Analiz</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><User size={20} /> Profil</button>
            <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'exams' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><PenTool size={20} /> İmtahanlar</button>
        </div>

        {/* --- 1. DASHBOARD (ANALİZ) --- */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                
                {/* SOL: Statistikalar */}
                <div className="lg:col-span-2 space-y-6">
                    {/* KARTLAR */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Ümumi Bal</p>
                                <h3 className={`text-3xl font-bold ${Number(stats.avgScore) > 8 ? 'text-green-600' : 'text-indigo-600'}`}>{stats.avgScore}/10</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><TrendingUp /></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Davamiyyət</p>
                                <h3 className="text-3xl font-bold text-orange-600">{stats.attendance}%</h3>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><PieChart /></div>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> İnkişaf Trendi (Son Dərslər)</h3>
                        {chartData.length > 0 ? (
                            <div className="h-48 flex items-end justify-between gap-2">
                                {chartData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                                        <div className="absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition mb-2">{d.score} Bal</div>
                                        <div className={`w-full max-w-[30px] rounded-t-lg transition-all ${d.score >= 9 ? 'bg-green-500' : d.score >= 6 ? 'bg-indigo-500' : 'bg-orange-400'}`} style={{ height: `${d.score * 10}%` }}></div>
                                        <span className="text-[10px] text-gray-400 mt-2 font-medium">{d.date}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Məlumat yoxdur</div>
                        )}
                    </div>
                </div>

                {/* SAĞ: Son Qiymətlər */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Son Nəticələr</h3>
                    <div className="space-y-3">
                        {recentGrades.map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400">{g.grade_date}</p>
                                    <p className={`text-sm font-bold ${g.attendance ? 'text-gray-700' : 'text-red-500'}`}>{g.attendance ? "Dərsdə iştirak" : "Qayıb"}</p>
                                </div>
                                {g.attendance && (
                                    <span className={`text-lg font-bold ${g.score >= 9 ? 'text-green-600' : 'text-indigo-600'}`}>
                                        {g.score !== null ? g.score : "-"}
                                    </span>
                                )}
                            </div>
                        ))}
                        {recentGrades.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Hələ dərs olmayıb.</p>}
                    </div>
                </div>
            </div>
        )}

        {/* --- 2. PROFİL (READ ONLY) --- */}
        {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-2xl mx-auto animate-in fade-in">
                <div className="flex items-center gap-6 mb-8 border-b pb-6">
                    <div className="text-6xl bg-indigo-50 p-4 rounded-full border-2 border-indigo-100">{selectedAvatar}</div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{student.first_name} {student.last_name}</h2>
                        <p className="text-indigo-600 font-medium">ID: #{student.student_code}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Ad</label>
                            <input disabled value={student.first_name} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Soyad</label>
                            <input disabled value={student.last_name} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Ata Adı</label>
                        <input disabled value={student.father_name || "-"} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase">Telefon</label>
                        <input disabled value={student.phone} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Məktəb</label>
                            <input disabled value={student.school} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Sinif</label>
                            <input disabled value={student.grade} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase">Sektor</label>
                            <input disabled value={student.sector || "Az"} className="w-full p-3 bg-gray-100 border-none rounded-xl text-gray-600 font-medium cursor-not-allowed"/>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                        <ShieldCheck className="text-orange-500 shrink-0"/>
                        <p className="text-xs text-orange-700">Bu məlumatlar müəllim tərəfindən təsdiqlənib və dəyişdirilə bilməz. Səhvlik varsa müəlliminizə müraciət edin.</p>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. İMTAHANLAR (BOŞ) --- */}
        {activeTab === 'exams' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 animate-in fade-in">
                <div className="bg-indigo-50 p-6 rounded-full mb-4">
                    <PenTool size={48} className="text-indigo-400"/>
                </div>
                <h3 className="text-xl font-bold text-gray-700">İmtahan Girişi Aktiv Deyil</h3>
                <p className="text-gray-400 mt-2 text-center max-w-md">Hal-hazırda aktiv imtahan yoxdur. İmtahanlar başlayan zaman burada görünəcək.</p>
            </div>
        )}

      </main>
    </div>
  );
}
