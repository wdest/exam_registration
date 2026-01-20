"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, User, BarChart3, GraduationCap, Calendar, 
  TrendingUp, Activity, PieChart, PenTool, CheckCircle, 
  Clock, DollarSign, ExternalLink, Download, FileText, X
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
  const [activeExams, setActiveExams] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedAvatar, setSelectedAvatar] = useState("👨‍🎓");
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
        
        const savedAvatar = localStorage.getItem(`avatar_${data.student.id}`);
        if (savedAvatar) setSelectedAvatar(savedAvatar);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
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
                            <button key={av} onClick={() => { setSelectedAvatar(av); localStorage.setItem(`avatar_${student.id}`, av); setIsAvatarMenuOpen(false); }} className="text-2xl hover:bg-gray-100 p-1 rounded transition">{av}</button>
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
        
        {/* HEADER CARD */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, {student?.first_name}! 👋</h2>
                <div className="opacity-90 flex flex-col gap-1 items-center md:items-start">
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
            <button onClick={() => setActiveTab('exams')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition whitespace-nowrap ${activeTab === 'exams' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}><PenTool size={20} /> İmtahanlar {activeExams.length > 0 && <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded-full animate-pulse ml-1 text-white">{activeExams.length}</span>}</button>
        </div>

        {/* ANALİZ TAB */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between">
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Bal / 10</p><h3 className="text-3xl font-black text-indigo-600">{stats.avgScore}</h3></div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><TrendingUp /></div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between">
                            <div><p className="text-gray-500 text-xs font-bold uppercase">Davamiyyət</p><h3 className="text-3xl font-black text-orange-600">{stats.attendance}%</h3></div>
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-full"><PieChart /></div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border h-[350px]">
                        <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2"><Activity size={18} className="text-indigo-500"/> İnkişaf Trendi</h3>
                        <ResponsiveContainer width="100%" height="80%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} />
                                <YAxis domain={[0, 10]} tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="bal" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: "#4f46e5" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Calendar size={18}/> Son Nəticələr</h3>
                    <div className="space-y-3">
                        {recentGrades.map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div><p className="text-xs text-gray-400 font-medium">{g.grade_date}</p><p className="text-sm font-bold text-gray-700">{g.attendance ? "İştirak" : "Qayıb"}</p></div>
                                <span className={`text-lg font-black ${g.score >= 5 ? 'text-green-600' : 'text-red-500'}`}>{g.score || "-"}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* PROFİL TAB */}
        {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center gap-4 mb-8 border-b pb-6">
                    <div className="text-7xl bg-indigo-50 p-6 rounded-full border-4 border-white shadow-xl">{selectedAvatar}</div>
                    <h2 className="text-2xl font-black text-gray-800">{student?.first_name} {student?.last_name}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Qrup</label><div className="p-3 bg-gray-50 rounded-xl font-bold">{groupName}</div></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Müəllim</label><div className="p-3 bg-gray-50 rounded-xl font-bold">{teacherName}</div></div>
                </div>
            </div>
        )}

        {/* İMTAHANLAR VƏ NƏTİCƏLƏR TAB (YENİLƏNDİ) */}
        {activeTab === 'exams' && (
            <div className="space-y-10 animate-in fade-in duration-500">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full"></div> Aktiv İmtahanlar
                    </h3>
                    {activeExams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeExams.map((exam: any) => (
                                <div key={exam.id} className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden group">
                                    <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-start">
                                        <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm"><PenTool size={24}/></div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${exam.is_paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{exam.is_paid ? `${exam.price} AZN` : 'Ödənişsiz'}</span>
                                    </div>
                                    <div className="p-6">
                                        <h4 className="font-bold text-lg text-gray-800 mb-1">{exam.name}</h4>
                                        <p className="text-sm text-gray-500 mb-4">Sinif: {exam.class_grade}-ci sinif</p>
                                        <a href={exam.url} target="_blank" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95">İmtahana Başla <ExternalLink size={18}/></a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                            <Clock size={40} className="mx-auto text-gray-300 mb-3"/>
                            <h4 className="font-bold text-gray-600">Aktiv imtahan yoxdur</h4>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-2 h-8 bg-green-500 rounded-full"></div> Nəticələrim
                    </h3>
                    {examResults.length > 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                                        <tr>
                                            <th className="p-4">İmtahan</th>
                                            <th className="p-4 text-center">Tarix</th>
                                            <th className="p-4 text-center">Nəticə</th>
                                            <th className="p-4 text-center">Faiz</th>
                                            <th className="p-4 text-right">Aç</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {examResults.map((res: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50 transition">
                                                <td className="p-4 font-bold text-gray-800">{res.exam_name || res.quiz}</td>
                                                <td className="p-4 text-center text-gray-500">{res.created_at ? new Date(res.created_at).toLocaleDateString('az-AZ') : '-'}</td>
                                                <td className="p-4 text-center font-bold text-indigo-600">{res.correct_count !== undefined ? `${res.correct_count} / ${res.total}` : (res.score || '-')}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-lg font-bold ${Number(res.percent) >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{res.percent}%</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => setSelectedResult(res)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"><FileText size={18}/></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                         <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-400">Hələ ki, heç bir imtahan nəticəsi tapılmadı.</div>
                    )}
                </div>
            </div>
        )}

      </main>

      {/* RESULT CARD MODAL */}
      {selectedResult && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative w-full max-w-md animate-in slide-in-from-bottom-8">
                  <button onClick={() => setSelectedResult(null)} className="absolute -top-12 right-0 text-white hover:text-red-400 transition"><X size={32}/></button>
                  <ResultCard 
                      studentName={`${student.first_name} ${student.last_name}`}
                      studentId={student.student_code || "Ödənişli"}
                      quizName={selectedResult.exam_name || selectedResult.quiz}
                      score={selectedResult.correct_count || selectedResult.score}
                      total={selectedResult.total || 0}
                      percent={selectedResult.percent}
                      date={new Date(selectedResult.created_at).toLocaleDateString('az-AZ')}
                      logoUrl="https://cdn-icons-png.flaticon.com/512/2997/2997300.png" 
                  />
              </div>
          </div>
      )}
    </div>
  );
}

function ResultCard({ studentName, studentId, quizName, score, total, percent, date, logoUrl }: any) {
  const isPass = percent >= 50;
  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
      <div className="bg-indigo-600 p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 opacity-30"></div>
        <div className="relative z-10 flex flex-col items-center text-white">
          {logoUrl && <div className="bg-white p-2 rounded-xl shadow-lg mb-3 h-16 w-16 flex items-center justify-center"><img src={logoUrl} alt="Logo" className="h-full w-full object-contain" /></div>}
          <h2 className="text-xl font-bold tracking-wide">Main Olympic Center</h2>
        </div>
      </div>
      <div className="px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{studentName}</h1>
          <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium"><User size={14} /> <span>ID: {studentId}</span></div>
        </div>
        <div className={`flex flex-col items-center justify-center p-6 rounded-2xl ${isPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} mb-6 border-2 border-dashed`}>
          <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Nəticə</span>
          <div className={`text-6xl font-black ${isPass ? 'text-green-600' : 'text-red-600'} tracking-tighter`}>{percent}<span className="text-3xl align-top">%</span></div>
          <p className="text-gray-600 font-medium mt-2 text-xs">{isPass ? "🎉 Təbrik edirik!" : "📚 Daha çox çalışmalısan."}</p>
        </div>
        <div className="space-y-3">
          <DetailRow icon={<FileText size={16} />} label="İmtahan" value={quizName} color="blue" />
          <DetailRow icon={<CheckCircle size={16} />} label="Doğru Sayı" value={`${score} / ${total}`} color="purple" />
          <DetailRow icon={<Calendar size={16} />} label="Tarix" value={date} color="orange" />
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100"><button onClick={() => window.print()} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm"><Download size={18} /> Yadda Saxla (PDF)</button></div>
    </div>
  );
}

function DetailRow({ icon, label, value, color }: any) {
  const colors: any = { blue: "bg-blue-100 text-blue-600", purple: "bg-purple-100 text-purple-600", orange: "bg-orange-100 text-orange-600" };
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-transparent hover:bg-white hover:border-gray-100 transition duration-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
        <div><p className="text-[10px] text-gray-500 font-medium uppercase">{label}</p><p className="font-bold text-gray-800 text-sm">{value}</p></div>
      </div>
    </div>
  );
}
