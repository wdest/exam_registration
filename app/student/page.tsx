"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, User, BarChart3, GraduationCap, Calendar, 
  TrendingUp, Activity, PieChart, PenTool, CheckCircle, 
  Clock, DollarSign, ExternalLink, Download, FileText, X, Trophy, Crown
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AVATARS = [
  "👨‍🎓", "👩‍🎓", "🧑‍💻", "👩‍🚀", "🦸‍♂️", "🧝‍♀️", "🧙‍♂️", "🕵️‍♂️", "👩‍🔬", "👨‍🎨"
];

// FAKE DATA (Sıralama üçün nümunə məlumatlar)
// Bu datada həm 3-cü sinif var, həm 9, həm 11. Kateqoriyanı yoxlamaq üçün.
const FAKE_RANKINGS = [
    { id: 101, name: "Əli Məmmədov", score: 9.9, avatar: "🦸‍♂️", class: "9" },
    { id: 102, name: "Ayan Kərimova", score: 9.8, avatar: "👩‍🚀", class: "10" },
    { id: 103, name: "Murad Həsənov", score: 9.7, avatar: "🧑‍💻", class: "9" },
    { id: 104, name: "Leyla Quliyeva", score: 9.6, avatar: "👩‍🎓", class: "11" },
    { id: 105, name: "Samir Əliyev", score: 9.5, avatar: "👨‍🎨", class: "4" }, // Category 1
    { id: 106, name: "Fidan Rzayeva", score: 9.4, avatar: "👩‍🔬", class: "9" },
    { id: 107, name: "Orxan Vəliyev", score: 9.3, avatar: "🕵️‍♂️", class: "10" },
    { id: 108, name: "Nigar Səfərova", score: 9.2, avatar: "🧝‍♀️", class: "11" },
    { id: 109, name: "Tural Abbasov", score: 9.1, avatar: "🧙‍♂️", class: "2" }, // Kids
    { id: 110, name: "Zəhra Məmmədli", score: 9.0, avatar: "👩‍🎓", class: "9" },
    { id: 111, name: "Rəsul İsayev", score: 8.9, avatar: "👨‍🎓", class: "6" }, // Category 2
    { id: 112, name: "Kənan Orucov", score: 8.8, avatar: "🧑‍💻", class: "9" },
    { id: 113, name: "Lalə Babayeva", score: 8.7, avatar: "👩‍🚀", class: "10" },
    { id: 114, name: "Elvin Mirzəyev", score: 8.6, avatar: "🦸‍♂️", class: "11" },
    { id: 115, name: "Günay Hacıyeva", score: 8.5, avatar: "👩‍🔬", class: "5" }, // Category 2
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
  
  // Imtahanlar
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  
  // SIRALAMA STATES
  const [rankFilter, setRankFilter] = useState<'all' | 'category'>('all');
  const [filteredRankings, setFilteredRankings] = useState<any[]>(FAKE_RANKINGS); 
  const [myCalculatedRank, setMyCalculatedRank] = useState<number>(0); // Sənin yerin

  // UI States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAvatar, setSelectedAvatar] = useState("👨‍🎓");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // --- KATEQORIYA MƏNTİQİ ---
  const getCategoryName = (grade: string | number) => {
      const g = Number(grade);
      if (g >= 1 && g <= 2) return "Kids";
      if (g >= 3 && g <= 4) return "Category 1";
      if (g >= 5 && g <= 6) return "Category 2";
      if (g >= 7 && g <= 8) return "Category 3";
      if (g >= 9 && g <= 10) return "Category 4";
      if (g >= 11 && g <= 12) return "Category 5";
      return "Digər";
  };

  // --- RANKING HESABLAMA ---
  useEffect(() => {
      if (!student) return;

      let currentList = [...FAKE_RANKINGS];

      // 1. KATEQORIYA FİLTRİ
      if (rankFilter === 'category') {
          const myCategory = getCategoryName(student.grade || "9"); // Default 9 qoyuruq əgər yoxdursa
          currentList = currentList.filter(r => getCategoryName(r.class) === myCategory);
      }

      // 2. MƏNİM YERİMİ HESABLA (Əgər siyahıda yoxamsa, xəyali olaraq əlavə edib yerimi tapır)
      // Mənim balım: stats.avgScore
      const myScore = parseFloat(stats.avgScore) || 0;
      const myName = `${student.first_name} ${student.last_name}`;

      // Mövcud siyahıya özümüzü əlavə edirik (müqayisə üçün)
      // Əgər siyahıda artıq varsansa təkrarlamamaq lazımdır, amma fake data olduğu üçün
      // sadəcə "mən" adlı bir obyekt yaradıb sort edirik.
      const listWithMe = [
          ...currentList, 
          { id: 9999, name: myName, score: myScore, class: student.grade }
      ];

      // Balı çoxdan aza düzürük
      listWithMe.sort((a, b) => b.score - a.score);

      // İndexi tapırıq (0-dan başlayır deyə +1 edirik)
      const rank = listWithMe.findIndex(r => r.id === 9999) + 1;
      setMyCalculatedRank(rank);

      // Ekrana çıxan siyahı (Məni oradan çıxarırıq ki, listdə dublikat görünməsin, yalnız yapışqan barda görünüm)
      // Amma istəsən listin içində də görünə bilərsən. Gəl hələlik fake datanı olduğu kimi saxlayaq.
      setFilteredRankings(currentList.sort((a, b) => b.score - a.score));

  }, [rankFilter, student, stats.avgScore]);


  const fetchData = async () => {
    try {
      const res = await fetch("/api/student/dashboard");
      
      if (res.status === 401 || res.status === 403) {
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
        setActiveExams(data.activeExams || []);
        setExamResults(data.examResults || []);
        
        // Avatar Load
        const savedAvatar = localStorage.getItem(`avatar_${data.student.id}`);
        if (savedAvatar) setSelectedAvatar(savedAvatar);
        else {
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

  const handleLogout = async () => {
    try {
      setLoading(true);
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh(); 
    } catch (error) {
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

  // Top 15-də varamsa, sticky barı gizlət (Opsional: həmişə göstərə də bilərsən)
  const amIInTopList = myCalculatedRank <= 15;

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
            <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition whitespace-nowrap ${activeTab === 'exams' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                <PenTool size={20} /> İmtahanlar 
                {activeExams.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{activeExams.length}</span>}
            </button>
            <button onClick={() => setActiveTab('rankings')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition whitespace-nowrap ${activeTab === 'rankings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><Trophy size={20} /> Sıralama</button>
        </div>

        {/* --- 1. DASHBOARD (ANALİZ) --- */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md transition">
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Ümumi Bal</p><h3 className={`text-3xl font-black ${Number(stats.avgScore) > 8 ? 'text-green-600' : 'text-indigo-600'}`}>{stats.avgScore}/10</h3></div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><TrendingUp /></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md transition">
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Davamiyyət</p><h3 className={`text-3xl font-black ${Number(stats.attendance) > 90 ? 'text-green-600' : 'text-orange-600'}`}>{stats.attendance}%</h3></div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><PieChart /></div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border h-[350px]">
                        <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> İnkişaf Trendi</h3>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="80%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{fill: '#9ca3af', fontSize: 12}} tickLine={false} axisLine={{stroke: '#f0f0f0'}} dy={10} />
                                    <YAxis domain={[0, 10]} tick={{fill: '#9ca3af', fontSize: 12}} tickLine={false} axisLine={false} tickCount={6} />
                                    <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} itemStyle={{color: '#4f46e5', fontWeight: 'bold'}} />
                                    <Line type="monotone" dataKey="bal" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed">
                                <Activity size={32} className="mb-2 opacity-50"/> Məlumat kifayət deyil
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Son Nəticələr</h3>
                    <div className="space-y-3">
                        {recentGrades.map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition rounded-xl border border-gray-100">
                                <div><p className="text-xs text-gray-400 font-medium">{g.grade_date}</p><p className={`text-sm font-bold ${g.attendance ? 'text-gray-700' : 'text-red-500'}`}>{g.attendance ? "Dərsdə iştirak" : "Qayıb"}</p></div>
                                {g.attendance && (<span className={`text-lg font-black ${g.score >= 9 ? 'text-green-600' : (g.score >= 5 ? 'text-indigo-600' : 'text-red-500')}`}>{g.score !== null ? g.score : "-"}</span>)}
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
                    <div><h2 className="text-2xl font-black text-gray-800">{student.first_name} {student.last_name}</h2><p className="text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full text-sm inline-block mt-2">ID: #{student.student_code}</p></div>
                </div>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Ad</label><div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold">{student.first_name}</div></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Soyad</label><div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-700 font-bold">{student.last_name}</div></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Qrup</label><div className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-700 font-bold">{groupName}</div></div>
                        <div><label className="text-xs font-bold text-gray-400 uppercase ml-1">Müəllim</label><div className="w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-700 font-bold">{teacherName}</div></div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. İMTAHANLAR --- */}
        {activeTab === 'exams' && (
            <div className="space-y-10 animate-in fade-in duration-500">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
                        Aktiv İmtahanlar
                    </h3>
                    
                    {activeExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeExams.map((exam: any) => (
                                <div key={exam.id} className="bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition overflow-hidden group">
                                    <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-start">
                                        <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm"><PenTool size={24}/></div>
                                        {exam.is_paid ? (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><DollarSign size={12}/> {exam.price} AZN</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">Ödənişsiz</span>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h4 className="font-bold text-lg text-gray-800 mb-2">{exam.name}</h4>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">Sinif: {exam.class_grade}-ci sinif üçün nəzərdə tutulub.</p>
                                        <a href={exam.url} target="_blank" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition transform active:scale-95">
                                            İmtahana Başla <ExternalLink size={18}/>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                <Clock size={32}/>
                            </div>
                            <h4 className="font-bold text-gray-600">Aktiv imtahan yoxdur</h4>
                            <p className="text-sm text-gray-400">Hal-hazırda giriş edə biləcəyin imtahan tapılmadı.</p>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-green-500 rounded-full"></div>
                        Nəticələrim
                    </h3>

                    {examResults.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                                    <tr>
                                        <th className="p-4">İmtahan Adı</th>
                                        <th className="p-4 text-center">Tarix</th>
                                        <th className="p-4 text-center">Bal</th>
                                        <th className="p-4 text-center">Faiz</th>
                                        <th className="p-4 text-right">Əməliyyat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {examResults.map((res: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-bold text-gray-800">{res.quiz}</td>
                                            <td className="p-4 text-center text-gray-500">{new Date(res.created_at).toLocaleDateString()}</td>
                                            <td className="p-4 text-center font-bold text-indigo-600">{res.correct_count}/{res.total}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-lg font-bold ${res.percent >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {res.percent}%
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => setSelectedResult(res)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition" title="Nəticə Kartı">
                                                    <FileText size={18}/>
                                                </button>
                                                {res.certificate_url && (
                                                    <a href={res.certificate_url} download className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition" title="Sertifikatı Yüklə">
                                                        <Download size={18}/>
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                            <p className="text-gray-400">Hələ ki, heç bir imtahan nəticəsi yoxdur.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- 4. SIRALAMA (YENİLƏNMİŞ MƏNTİQ) --- */}
        {activeTab === 'rankings' && (
            <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 flex items-center gap-2">
                            <Trophy className="text-yellow-500 fill-yellow-500" size={32}/> Liderlər Lövhəsi
                        </h2>
                        <p className="text-gray-500 mt-1">MOC-un ən güclü tələbələri</p>
                    </div>
                    
                    {/* FILTER BUTTONS */}
                    <div className="bg-white p-1 rounded-xl shadow-sm border flex gap-1">
                        <button 
                            onClick={() => setRankFilter('all')} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${rankFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Ümumi Sıralama
                        </button>
                        <button 
                            onClick={() => setRankFilter('category')} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${rankFilter === 'category' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {getCategoryName(student?.grade || "9")} Üzrə
                        </button>
                    </div>
                </div>

                {/* PODIUM (TOP 3) */}
                <div className="grid grid-cols-3 gap-2 md:gap-6 mb-12 items-end px-2 md:px-12">
                    {/* 2-ci YER */}
                    <div className="order-1 flex flex-col items-center">
                        <div className="relative">
                            <div className="text-5xl mb-2">{filteredRankings[1]?.avatar || "🥈"}</div>
                            <div className="absolute -top-3 -right-2 bg-gray-300 text-gray-800 font-bold text-xs px-2 py-0.5 rounded-full border border-white">#2</div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-2xl p-4 text-center border-t-4 border-gray-300 shadow-lg h-32 md:h-40 flex flex-col justify-center">
                            <p className="font-bold text-gray-800 text-sm md:text-base line-clamp-1">{filteredRankings[1]?.name}</p>
                            <p className="text-gray-500 text-xs font-bold">{filteredRankings[1]?.score} Bal</p>
                        </div>
                    </div>

                    {/* 1-ci YER */}
                    <div className="order-2 flex flex-col items-center z-10 -mt-8">
                        <div className="relative animate-bounce-slow">
                            <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-500 fill-yellow-500" size={32}/>
                            <div className="text-6xl mb-2">{filteredRankings[0]?.avatar || "🥇"}</div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-yellow-200 to-yellow-50 rounded-t-2xl p-4 text-center border-t-4 border-yellow-400 shadow-xl h-40 md:h-52 flex flex-col justify-center">
                            <p className="font-black text-gray-900 text-base md:text-lg line-clamp-1">{filteredRankings[0]?.name}</p>
                            <p className="text-yellow-700 font-bold text-sm bg-yellow-300/50 px-3 py-1 rounded-full mx-auto w-fit mt-1">{filteredRankings[0]?.score} Bal</p>
                        </div>
                    </div>

                    {/* 3-cü YER */}
                    <div className="order-3 flex flex-col items-center">
                        <div className="relative">
                            <div className="text-5xl mb-2">{filteredRankings[2]?.avatar || "🥉"}</div>
                            <div className="absolute -top-3 -right-2 bg-orange-200 text-orange-800 font-bold text-xs px-2 py-0.5 rounded-full border border-white">#3</div>
                        </div>
                        <div className="w-full bg-gradient-to-t from-orange-100 to-orange-50 rounded-t-2xl p-4 text-center border-t-4 border-orange-300 shadow-lg h-28 md:h-36 flex flex-col justify-center">
                            <p className="font-bold text-gray-800 text-sm md:text-base line-clamp-1">{filteredRankings[2]?.name}</p>
                            <p className="text-gray-500 text-xs font-bold">{filteredRankings[2]?.score} Bal</p>
                        </div>
                    </div>
                </div>

                {/* SİYAHI (4-15) */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-20">
                    {filteredRankings.slice(3, 15).map((r, i) => {
                        const rank = i + 4;
                        // Fake data ilə işlədiyimiz üçün burada "isMe" məntiqini yoxlaya bilmirik, 
                        // amma əsl datada "r.id === student.id" yoxlanacaq.
                        return (
                            <div key={r.id} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50 transition">
                                <div className="w-10 text-center font-black text-gray-400 text-lg mr-4">{rank}</div>
                                <div className="text-2xl mr-4">{r.avatar}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">{r.name}</p>
                                    <p className="text-xs text-gray-400">{getCategoryName(r.class)}</p>
                                </div>
                                <div className="font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">{r.score}</div>
                            </div>
                        )
                    })}
                </div>

                {/* SƏNİN YERİN (STICKY BOTTOM - ƏSL YERİN) */}
                <div className="fixed bottom-4 left-0 w-full px-4 z-40 md:pl-20">
                    <div className="max-w-6xl mx-auto bg-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border-t-4 border-indigo-400 transform hover:translate-y-[-5px] transition cursor-pointer">
                        <div className="flex items-center gap-4">
                            {/* DƏQİQ HESABLANMIŞ RANK */}
                            <div className="font-black text-2xl text-indigo-200">#{myCalculatedRank}</div>
                            <div className="text-3xl">{selectedAvatar}</div>
                            <div>
                                <p className="font-bold text-lg">{student.first_name} {student.last_name}</p>
                                <p className="text-xs text-indigo-200">Sənin mövqeyin</p>
                            </div>
                        </div>
                        <div className="text-2xl font-black bg-indigo-500 px-4 py-2 rounded-lg">{stats.avgScore}</div>
                    </div>
                </div>

            </div>
        )}

      </main>

      {/* --- RESULT CARD MODAL --- */}
      {selectedResult && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative w-full max-w-md">
                  <button onClick={() => setSelectedResult(null)} className="absolute -top-12 right-0 text-white hover:text-gray-200 transition">
                      <X size={32}/>
                  </button>
                  <ResultCard 
                      studentName={`${student.first_name} ${student.last_name}`}
                      studentId={student.student_code}
                      quizName={selectedResult.quiz}
                      score={selectedResult.correct_count}
                      total={selectedResult.total}
                      percent={selectedResult.percent}
                      date={new Date(selectedResult.created_at).toLocaleDateString()}
                      logoUrl="https://cdn-icons-png.flaticon.com/512/2997/2997300.png" 
                  />
              </div>
          </div>
      )}

    </div>
  );
}

// --- RESULT CARD KOMPONENTİ ---
function ResultCard({ studentName, studentId, quizName, score, total, percent, date, logoUrl }: any) {
  const isPass = percent >= 50;
  const statusColor = isPass ? "text-green-600" : "text-red-600";
  const statusBg = isPass ? "bg-green-50" : "bg-red-50";
  const borderColor = isPass ? "border-green-200" : "border-red-200";

  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      <div className="bg-indigo-600 p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 opacity-30"></div>
        <div className="relative z-10 flex flex-col items-center">
          {logoUrl && (
            <div className="bg-white p-2 rounded-xl shadow-lg mb-3 h-16 w-16 flex items-center justify-center">
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            </div>
          )}
          <h2 className="text-xl font-bold text-white tracking-wide">Main Olympic Center</h2>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{studentName}</h1>
          <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium">
            <User size={14} /> <span>ID: {studentId}</span>
          </div>
        </div>

        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl ${statusBg} mb-6 border-2 border-dashed ${borderColor}`}>
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Nəticə</span>
          <div className={`text-6xl font-black ${statusColor} tracking-tighter`}>
            {percent}<span className="text-3xl align-top">%</span>
          </div>
          <p className="text-gray-600 font-medium mt-2 text-xs">
            {isPass ? "🎉 Təbrik edirik, uğurlu nəticə!" : "📚 Daha çox çalışmalısan."}
          </p>
        </div>

        <div className="space-y-3">
          <DetailRow icon={<FileText size={16} />} label="Mövzu" value={quizName} color="blue" />
          <DetailRow icon={<CheckCircle size={16} />} label="Doğru Cavablar" value={`${score} / ${total}`} color="purple" />
          <DetailRow icon={<Calendar size={16} />} label="Tarix" value={date} color="orange" />
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button onClick={() => window.print()} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm">
          <Download size={18} /> Nəticəni Yadda Saxla
        </button>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, color }: any) {
  const colors: any = { blue: "bg-blue-100 text-blue-600", purple: "bg-purple-100 text-purple-600", orange: "bg-orange-100 text-orange-600" };
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-white hover:shadow-sm transition border border-transparent hover:border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <div>
          <p className="text-[10px] text-gray-500 font-medium uppercase">{label}</p>
          <p className="font-bold text-gray-800 text-sm">{value}</p>
        </div>
      </div>
    </div>
  );
}
