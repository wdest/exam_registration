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

const AVATARS = [
  "👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️", "👩‍🔬", "👨‍🎨"
];

export default function StudentCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  
  const [groupName, setGroupName] = useState("Qrup yoxdur");
  const [teacherName, setTeacherName] = useState("Təyin edilməyib");
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA STATE
  const [stats, setStats] = useState({ avgScore: "0", attendance: "0" });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
   
  // AVATAR STATE
  const [selectedAvatar, setSelectedAvatar] = useState("👨‍🎓");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const cookies = document.cookie.split("; ");
      const tokenRow = cookies.find((row) => row.trim().startsWith("student_token="));
      
      if (!tokenRow) {
        router.push("/student-login");
        return;
      }

      const studentId = tokenRow.split("=")[1];

      const { data: sData } = await supabase.from('local_students').select('*').eq('id', studentId).single();
      
      if (sData) {
        setStudent(sData);
        fetchGroupInfo(sData.id);
        fetchAnalytics(sData.id);
        
        if (typeof window !== 'undefined') {
            const savedAvatar = localStorage.getItem(`avatar_${sData.id}`);
            if (savedAvatar) {
                setSelectedAvatar(savedAvatar);
            } else {
                const randomInd = Math.floor(Math.random() * AVATARS.length);
                const newAvatar = AVATARS[randomInd];
                setSelectedAvatar(newAvatar);
                localStorage.setItem(`avatar_${sData.id}`, newAvatar);
            }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const fetchGroupInfo = async (studentId: number) => {
    const { data } = await supabase
      .from('group_members')
      .select(`
        groups (
            name,
            teachers (
                first_name,
                last_name
            )
        )
      `)
      .eq('student_id', studentId)
      .limit(1)
      .single();
    
    if (data && data.groups) {
      // @ts-ignore
      setGroupName(data.groups.name);
      // @ts-ignore
      if (data.groups.teachers) {
          // @ts-ignore
          const t = data.groups.teachers;
          setTeacherName(`${t.first_name} ${t.last_name}`);
      }
    }
  };

  const fetchAnalytics = async (studentId: number) => {
    const { data: grades } = await supabase
      .from('daily_grades')
      .select('*')
      .eq('student_id', studentId)
      .order('grade_date', { ascending: true });

    if (!grades || grades.length === 0) return;

    // Statistika
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

    // Chart Data (Son 10 dərs)
    const chart = scoredGrades.slice(-10).map((g: any) => ({
        date: g.grade_date.slice(5), // MM-DD
        score: g.score
    }));
    setChartData(chart);

    // Son Jurnal
    setRecentGrades([...grades].reverse().slice(0, 5));
  };

  const handleAvatarChange = (avatar: string) => {
      setSelectedAvatar(avatar);
      if(student && typeof window !== 'undefined') localStorage.setItem(`avatar_${student.id}`, avatar);
      setIsAvatarMenuOpen(false);
  };

  const handleLogout = () => {
    document.cookie = "student_token=; path=/; max-age=0";
    router.push("/student-login");
  };

  // --- SVG CONFIG ---
  // 10 ballıq sistem üçün Y koordinatını hesablayır
  const getY = (score: number) => 100 - (score * 10);
  
  const getPolylinePoints = () => {
    if (chartData.length === 0) return "";
    if (chartData.length === 1) return `0,${getY(chartData[0].score)} 100,${getY(chartData[0].score)}`; 

    return chartData.map((d, i) => {
        const x = (i / (chartData.length - 1)) * 100; 
        const y = getY(d.score); 
        return `${x},${y}`;
    }).join(" ");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-indigo-600 font-bold">Kabinet yüklənir...</div>;

  return (
    <div className="min-h-screen bg-[#111827] font-sans text-gray-100">
      
      {/* NAVBAR */}
      <nav className="bg-[#1F2937] px-6 py-4 border-b border-gray-700 sticky top-0 z-50 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <GraduationCap /> Şagird Paneli
        </h1>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-200">{student?.first_name} {student?.last_name}</p>
                <p className="text-xs text-gray-400 font-medium">{groupName} | {teacherName}</p>
            </div>
            <div className="relative">
                <button onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)} className="w-10 h-10 bg-indigo-900/50 rounded-full flex items-center justify-center text-2xl border-2 border-indigo-500 cursor-pointer hover:scale-105 transition">
                    {selectedAvatar}
                </button>
                {isAvatarMenuOpen && (
                    <div className="absolute right-0 top-12 bg-[#1F2937] p-3 rounded-xl shadow-xl border border-gray-700 w-48 grid grid-cols-4 gap-2 z-50">
                        {AVATARS.map(av => (
                            <button key={av} onClick={() => handleAvatarChange(av)} className="text-2xl hover:bg-gray-700 p-1 rounded transition">{av}</button>
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
        
        {/* XOŞ GƏLDİNİZ */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, {student?.first_name}! 👋</h2>
                <div className="opacity-90 flex flex-col gap-1">
                    <span>Sənin uğur yolun burdan başlayır.</span>
                    <div className="flex items-center gap-4 mt-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg">
                        <span>📚 Qrup: <b>{groupName}</b></span>
                        <span className="w-px h-4 bg-white/40"></span>
                        <span>👨‍🏫 Müəllim: <b>{teacherName}</b></span>
                    </div>
                </div>
            </div>
            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center min-w-[120px]">
                <p className="text-xs opacity-80 uppercase font-bold">Ortalama</p>
                <p className="text-3xl font-bold">{stats.avgScore}</p>
            </div>
        </div>

        {/* TABLAR */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-gray-700'}`}><BarChart3 size={20} /> Analiz</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-gray-700'}`}><User size={20} /> Profil</button>
            <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'exams' ? 'bg-indigo-600 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-gray-700'}`}><PenTool size={20} /> İmtahanlar</button>
        </div>

        {/* --- 1. DASHBOARD (ANALİZ) --- */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                
                <div className="lg:col-span-2 space-y-6">
                    {/* STAT KARTLAR */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#1F2937] p-5 rounded-2xl border border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase">Ümumi Bal</p>
                                <h3 className="text-3xl font-bold text-indigo-400">{stats.avgScore}/10</h3>
                            </div>
                            <div className="p-3 bg-gray-700 text-indigo-400 rounded-full"><TrendingUp /></div>
                        </div>
                        <div className="bg-[#1F2937] p-5 rounded-2xl border border-gray-700 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase">Davamiyyət</p>
                                <h3 className="text-3xl font-bold text-orange-400">{stats.attendance}%</h3>
                            </div>
                            <div className="p-3 bg-gray-700 text-orange-400 rounded-full"><PieChart /></div>
                        </div>
                    </div>

                    {/* QARA DİZAYNLI CHART */}
                    <div className="bg-[#1F2937] p-6 rounded-2xl border border-gray-700 relative overflow-hidden">
                        <h3 className="font-bold text-gray-200 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-400"/> İnkişaf Trendi (Son Dərslər)</h3>
                        
                        {chartData.length > 0 ? (
                            <div className="w-full h-64 relative">
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Xətləri (Sol tərəfdə rəqəmlər yoxdur, sadəcə xətlər) */}
                                    {[0, 25, 50, 75, 100].map(y => (
                                         <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#374151" strokeWidth="0.5" />
                                    ))}

                                    <polygon 
                                        points={`0,100 ${getPolylinePoints()} 100,100`} 
                                        fill="url(#gradient)" 
                                    />

                                    <polyline 
                                        fill="none" 
                                        stroke="#6366f1" 
                                        strokeWidth="2" 
                                        points={getPolylinePoints()} 
                                        vectorEffect="non-scaling-stroke"
                                    />

                                    {chartData.map((d, i) => {
                                        const x = (i / (chartData.length - 1)) * 100;
                                        const y = getY(d.score);
                                        return (
                                            <g key={i}>
                                                <circle 
                                                    cx={x} 
                                                    cy={y} 
                                                    r="2" 
                                                    fill="#1F2937" 
                                                    stroke="#818cf8" 
                                                    strokeWidth="1" 
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                                {/* Bal dəyəri nöqtənin üstündə yazılır */}
                                                <text x={x} y={y - 6} fontSize="5" textAnchor="middle" fill="white" fontWeight="bold">{d.score}</text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                <div className="flex justify-between mt-4 text-[10px] text-gray-400 font-mono">
                                    {chartData.map((d, i) => (
                                        <span key={i}>{d.date}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-500 text-sm bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                                Məlumat yoxdur
                            </div>
                        )}
                    </div>
                </div>

                {/* SAĞ: Son Qiymətlər */}
                <div className="lg:col-span-1 bg-[#1F2937] p-6 rounded-2xl border border-gray-700 h-fit">
                    <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2"><Calendar size={18}/> Son Nəticələr</h3>
                    <div className="space-y-3">
                        {recentGrades.map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-800 rounded-xl border border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-400">{g.grade_date}</p>
                                    <p className={`text-sm font-bold ${g.attendance ? 'text-gray-200' : 'text-red-400'}`}>{g.attendance ? "Dərsdə iştirak" : "Qayıb"}</p>
                                </div>
                                {g.attendance && (
                                    <span className={`text-lg font-bold ${g.score >= 9 ? 'text-green-400' : 'text-indigo-400'}`}>
                                        {g.score !== null ? g.score : "-"}
                                    </span>
                                )}
                            </div>
                        ))}
                        {recentGrades.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Hələ dərs olmayıb.</p>}
                    </div>
                </div>
            </div>
        )}

        {/* --- 2. PROFİL --- */}
        {activeTab === 'profile' && (
            <div className="bg-[#1F2937] p-8 rounded-2xl border border-gray-700 max-w-2xl mx-auto animate-in fade-in">
                <div className="flex items-center gap-6 mb-8 border-b border-gray-700 pb-6">
                    <div className="text-6xl bg-indigo-900/30 p-4 rounded-full border-2 border-indigo-500/30">{selectedAvatar}</div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-100">{student.first_name} {student.last_name}</h2>
                        <p className="text-indigo-400 font-medium">ID: #{student.student_code}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Ad</label>
                            <input disabled value={student.first_name} className="w-full p-3 bg-gray-800 border-none rounded-xl text-gray-300 font-medium cursor-not-allowed"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Soyad</label>
                            <input disabled value={student.last_name} className="w-full p-3 bg-gray-800 border-none rounded-xl text-gray-300 font-medium cursor-not-allowed"/>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Qrup</label>
                             <input disabled value={groupName} className="w-full p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-indigo-400 font-bold cursor-not-allowed"/>
                        </div>
                         <div>
                             <label className="text-xs font-bold text-gray-500 uppercase">Müəllim</label>
                             <input disabled value={teacherName} className="w-full p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-indigo-400 font-bold cursor-not-allowed"/>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. İMTAHANLAR --- */}
        {activeTab === 'exams' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-[#1F2937] rounded-2xl border border-dashed border-gray-700 animate-in fade-in">
                <div className="bg-indigo-900/30 p-6 rounded-full mb-4">
                    <PenTool size={48} className="text-indigo-400"/>
                </div>
                <h3 className="text-xl font-bold text-gray-200">İmtahan Girişi Aktiv Deyil</h3>
                <p className="text-gray-500 mt-2 text-center max-w-md">Hal-hazırda aktiv imtahan yoxdur.</p>
            </div>
        )}

      </main>
    </div>
  );
}
