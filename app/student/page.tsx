"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  LogOut, User, BarChart3, GraduationCap, Calendar, 
  TrendingUp, Activity, PieChart, ShieldCheck, PenTool, Trophy, Medal, Award
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [rankings, setRankings] = useState({ group: 0, grade: 0, course: 0 });
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

      const { data: sData, error } = await supabase.from('local_students').select('*').eq('id', studentId).single();
      
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
      } else {
          console.error("Şagird tapılmadı:", error);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // --- DÜZƏLDİLMİŞ MÜƏLLİM SORĞUSU ---
  const fetchGroupInfo = async (studentId: number) => {
    console.log("Qrup məlumatı axtarılır, Student ID:", studentId);

    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('student_id', studentId)
      .single();

    if (memberError || !memberData) {
        console.log("Şagird heç bir qrupda deyil:", memberError);
        return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from('groups')
      .select(`
        name,
        teacher_id,
        teachers (
            first_name,
            last_name
        )
      `)
      .eq('id', memberData.group_id)
      .single();

    if (groupData) {
      setGroupName(groupData.name);
      
      // *** XƏTANIN HƏLLİ BURADADIR ***
      if (groupData.teachers) {
          const t = groupData.teachers;
          
          // TypeScript xətasını düzəltmək üçün yoxlayırıq:
          // Əgər 'teachers' massiv (siyahı) kimi gəlirsə, birincini götürürük
          if (Array.isArray(t)) {
              if (t.length > 0) {
                  setTeacherName(`${t[0].first_name} ${t[0].last_name}`);
              }
          } 
          // Əgər tək obyekt kimi gəlirsə (bəzən Supabase belə edir)
          else {
              // @ts-ignore
              setTeacherName(`${t.first_name} ${t.last_name}`);
          }
      } else {
          console.log("Müəllim tapılmadı");
      }
    } else {
        console.log("Qrup tapılmadı:", groupError);
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

    setRankings({ group: 3, grade: 12, course: 45 });

    const chart = scoredGrades.slice(-10).map((g: any) => ({
        date: g.grade_date.slice(5), 
        bal: g.score 
    }));
    setChartData(chart);

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
                <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded inline-block mt-1">
                    {groupName} | {teacherName}
                </p>
            </div>
            <div className="relative">
                <button onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)} className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-2xl border-2 border-indigo-200 cursor-pointer hover:scale-105 transition">
                    {selectedAvatar}
                </button>
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
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><BarChart3 size={20} /> Analiz</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><User size={20} /> Profil</button>
            <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'exams' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><PenTool size={20} /> İmtahanlar</button>
        </div>

        {/* --- 1. DASHBOARD (ANALİZ) --- */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                
                <div className="lg:col-span-2 space-y-6">
                    {/* STAT KARTLAR */}
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

                    {/* SIRALAMA KARTLARI */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Trophy className="text-yellow-500" size={18}/> Sıralama Göstəriciləri</h3>
                        <div className="grid grid-cols-3 gap-4">
                             <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex justify-center mb-1"><Medal size={20} className="text-indigo-500"/></div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Qrup</p>
                                <p className="text-xl font-bold text-gray-800">#{rankings.group}</p>
                             </div>
                             <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex justify-center mb-1"><Award size={20} className="text-purple-500"/></div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Sinif</p>
                                <p className="text-xl font-bold text-gray-800">#{rankings.grade}</p>
                             </div>
                             <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex justify-center mb-1"><Trophy size={20} className="text-yellow-500"/></div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Ümumi</p>
                                <p className="text-xl font-bold text-gray-800">#{rankings.course}</p>
                             </div>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border h-[350px]">
                        <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> İnkişaf Trendi</h3>
                        
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e5e7eb" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{fill: '#6b7280', fontSize: 12}} 
                                        tickLine={false} 
                                        axisLine={{stroke: '#e5e7eb'}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[0, 10]} 
                                        tick={{fill: '#6b7280', fontSize: 12}} 
                                        tickLine={false}
                                        axisLine={false}
                                        tickCount={6}
                                    />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        itemStyle={{color: '#4f46e5', fontWeight: 'bold'}}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="bal" 
                                        stroke="#4f46e5" 
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }} 
                                        activeDot={{ r: 6 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">
                                Məlumat yoxdur
                            </div>
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

        {/* --- 2. PROFİL --- */}
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
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase">Qrup</label>
                             <input disabled value={groupName} className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold cursor-not-allowed"/>
                        </div>
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase">Müəllim</label>
                             <input disabled value={teacherName} className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold cursor-not-allowed"/>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. İMTAHANLAR --- */}
        {activeTab === 'exams' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 animate-in fade-in">
                <div className="bg-indigo-50 p-6 rounded-full mb-4">
                    <PenTool size={48} className="text-indigo-400"/>
                </div>
                <h3 className="text-xl font-bold text-gray-700">İmtahan Girişi Aktiv Deyil</h3>
                <p className="text-gray-400 mt-2 text-center max-w-md">Hal-hazırda aktiv imtahan yoxdur.</p>
            </div>
        )}

      </main>
    </div>
  );
}
