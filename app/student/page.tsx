
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, User, BarChart3, GraduationCap, Calendar, 
  TrendingUp, Activity, PieChart, PenTool
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AVATARS = [
  "👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️", "👩‍🔬", "👨‍🎨"
];

export default function StudentCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [student, setStudent] = useState<any>(null);
  const [groupName, setGroupName] = useState("...");
  const [teacherName, setTeacherName] = useState("...");
  const [stats, setStats] = useState({ avgScore: "0", attendance: "0" });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAvatar, setSelectedAvatar] = useState("👨‍🎓");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Bizim yaratdığımız yeni API-yə sorğu göndəririk
      const res = await fetch("/api/student/dashboard");
      
      // Əgər giriş edilməyibsə, loginə atırıq
      if (res.status === 401 || res.status === 403) {
        // DÜZƏLİŞ: Artıq /login istifadə edirik
        router.push("/login"); 
        return;
      }

      const data = await res.json();
      
      if (data.student) {
        setStudent(data.student);
        setGroupName(data.groupName);
        setTeacherName(data.teacherName);
        setStats(data.stats);
        setChartData(data.chartData);
        setRecentGrades(data.recentGrades);
        
        // Avatar yaddaşı
        const savedAvatar = localStorage.getItem(`avatar_${data.student.id}`);
        if (savedAvatar) {
            setSelectedAvatar(savedAvatar);
        } else {
            const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
            setSelectedAvatar(randomAvatar);
            localStorage.setItem(`avatar_${data.student.id}`, randomAvatar);
        }
      }
    } catch (error) {
      console.error("Data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (avatar: string) => {
      setSelectedAvatar(avatar);
      if(student) localStorage.setItem(`avatar_${student.id}`, avatar);
      setIsAvatarMenuOpen(false);
  };

  // --- ÇIXIŞ FUNKSİYASI (YENİLƏNİB) ---
  const handleLogout = async () => {
    try {
      setLoading(true);

      // Serverə "Kukiləri Sil" əmrini göndəririk
      await fetch("/api/logout", {
        method: "POST",
      });

      // DÜZƏLİŞ: Təmiz login səhifəsinə yönləndiririk
      router.push("/login");
      router.refresh(); 
    } catch (error) {
      console.error("Çıxış zamanı xəta:", error);
      // Xəta olsa belə loginə atırıq
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-indigo-600 font-bold animate-pulse">Kabinet Yüklənir...</p>
        </div>
      </div>
    );
  }

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
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition" title="Çıxış">
                <LogOut size={20} />
            </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        
        {/* HEADER CARD */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, {student?.first_name}! 👋</h2>
                <div className="opacity-90 flex flex-col gap-1">
                    <span>Sənin uğur yolun burdan başlayır.</span>
                    <div className="flex items-center gap-4 mt-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-lg border border-white/20">
                        <span>📚 Qrup: <b>{groupName}</b></span>
                        <span className="w-px h-4 bg-white/40"></span>
                        <span>👨‍🏫 Müəllim: <b>{teacherName}</b></span>
                    </div>
                </div>
            </div>
            <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm text-center min-w-[120px] border border-white/30 relative z-10">
                <p className="text-xs opacity-80 uppercase font-bold">Ortalama</p>
                <p className="text-4xl font-black">{stats.avgScore}</p>
            </div>
        </div>

        {/* TABLAR */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><BarChart3 size={20} /> Analiz</button>
            <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition whitespace-nowrap ${activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><User size={20} /> Profil</button>
            <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition whitespace-nowrap ${activeTab === 'exams' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><PenTool size={20} /> İmtahanlar</button>
        </div>

        {/* --- 1. DASHBOARD (ANALİZ) --- */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                
                <div className="lg:col-span-2 space-y-6">
                    {/* STAT KARTLAR */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md transition">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Ümumi Bal</p>
                                <h3 className={`text-3xl font-black ${Number(stats.avgScore) > 8 ? 'text-green-600' : 'text-indigo-600'}`}>{stats.avgScore}/10</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><TrendingUp /></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md transition">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Davamiyyət</p>
                                <h3 className={`text-3xl font-black ${Number(stats.attendance) > 90 ? 'text-green-600' : 'text-orange-600'}`}>{stats.attendance}%</h3>
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><PieChart /></div>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border h-[350px]">
                        <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> İnkişaf Trendi</h3>
                        
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f0f0f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{fill: '#9ca3af', fontSize: 12}} 
                                        tickLine={false} 
                                        axisLine={{stroke: '#f0f0f0'}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[0, 10]} 
                                        tick={{fill: '#9ca3af', fontSize: 12}} 
                                        tickLine={false}
                                        axisLine={false}
                                        tickCount={6}
                                    />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                        itemStyle={{color: '#4f46e5', fontWeight: 'bold'}}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="bal" 
                                        stroke="#4f46e5" 
                                        strokeWidth={4}
                                        dot={{ r: 4, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }} 
                                        activeDot={{ r: 7 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">
                                <Activity size={32} className="mb-2 opacity-50"/>
                                Məlumat kifayət deyil
                            </div>
                        )}
                    </div>
                </div>

                {/* SAĞ: Son Qiymətlər */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Son Nəticələr</h3>
                    <div className="space-y-3">
                        {recentGrades.map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium">{g.grade_date}</p>
                                    <p className={`text-sm font-bold ${g.attendance ? 'text-gray-700' : 'text-red-500'}`}>{g.attendance ? "Dərsdə iştirak" : "Qayıb"}</p>
                                </div>
                                {g.attendance && (
                                    <span className={`text-lg font-black ${g.score >= 9 ? 'text-green-600' : (g.score >= 5 ? 'text-indigo-600' : 'text-red-500')}`}>
                                        {g.score !== null ? g.score : "-"}
                                    </span>
                                )}
                            </div>
                        ))}
                        {recentGrades.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Hələ dərs qeydə alınmayıb.</p>}
                    </div>
                </div>
            </div>
        )}

        {/* --- 2. PROFİL --- */}
        {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center gap-4 mb-8 border-b pb-6">
                    <div className="text-7xl bg-indigo-50 p-6 rounded-full border-4 border-white shadow-xl">{selectedAvatar}</div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">{student.first_name} {student.last_name}</h2>
                        <p className="text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full text-sm inline-block mt-2">ID: #{student.student_code}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ad</label>
                            <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold">{student.first_name}</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Soyad</label>
                            <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold">{student.last_name}</div>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase ml-1">Qrup</label>
                             <div className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-700 font-bold">{groupName}</div>
                        </div>
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase ml-1">Müəllim</label>
                             <div className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-700 font-bold">{teacherName}</div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. İMTAHANLAR --- */}
        {activeTab === 'exams' && (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 animate-in fade-in duration-500">
                <div className="bg-indigo-50 p-6 rounded-full mb-4 animate-bounce">
                    <PenTool size={48} className="text-indigo-400"/>
                </div>
                <h3 className="text-xl font-bold text-gray-700">İmtahan Girişi Aktiv Deyil</h3>
                <p className="text-gray-400 mt-2 text-center max-w-md px-4">
                    Hal-hazırda aktiv imtahan yoxdur. İmtahanlar başlayan zaman burada görünəcək.
                </p>
            </div>
        )}

      </main>
    </div>
  );
} 
