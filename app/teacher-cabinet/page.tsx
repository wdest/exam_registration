"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LogOut, Users, BookOpen, Plus, Calendar, Save, 
  ChevronRight, GraduationCap, CheckCircle, XCircle, AlertTriangle, Trash2, Pencil, RefreshCcw,
  BarChart3, TrendingUp, Activity, PieChart
} from "lucide-react";

const WEEK_DAYS = ["B.e", "Ç.a", "Çərş", "C.a", "Cüm", "Şən", "Baz"];
const DAY_MAP: { [key: number]: string } = { 1: "B.e", 2: "Ç.a", 3: "Çərş", 4: "C.a", 5: "Cüm", 6: "Şən", 0: "Baz" };
const PHONE_PREFIXES = ["050", "051", "055", "070", "077", "099", "010", "060"]; 
const GRADES = Array.from({ length: 11 }, (_, i) => i + 1); 
const SECTORS = ["Az", "Ru", "Eng"];

export default function TeacherCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // EDIT MODE
  const [editingId, setEditingId] = useState<number | null>(null);

  // FORMS
  const [phonePrefix, setPhonePrefix] = useState("050");
  const [newStudent, setNewStudent] = useState({
    first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", sector: "Az", start_date: new Date().toISOString().split('T')[0]
  });
  
  // QRUP STATE
  const [newGroupName, setNewGroupName] = useState("");
  const [tempDay, setTempDay] = useState("B.e"); 
  const [tempTime, setTempTime] = useState("");   
  const [scheduleSlots, setScheduleSlots] = useState<{day: string, time: string}[]>([]);

  // JURNAL STATE
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [studentToAdd, setStudentToAdd] = useState("");
  const [gradingDate, setGradingDate] = useState(new Date().toISOString().split('T')[0]);
  
  // JURNAL DATA
  const [grades, setGrades] = useState<{[key: string]: string}>({});
  const [attendance, setAttendance] = useState<{[key: string]: boolean}>({});
  const [isValidDay, setIsValidDay] = useState(true); 

  // --- ANALİZ STATE ---
  const [analyticsGroupId, setAnalyticsGroupId] = useState<string>("");
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [groupStats, setGroupStats] = useState({ avgScore: 0, avgAttendance: 0 });
  
  // CHART CONFIG
  const [chartData, setChartData] = useState<any[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'group' | 'individual'>('group'); 
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<string>(""); 
  const [chartInterval, setChartInterval] = useState<'lessons4' | 'weeks4' | 'months4' | 'year'>('lessons4'); 
  const [analyticsStudentsList, setAnalyticsStudentsList] = useState<any[]>([]); 
  const [rawGradesForChart, setRawGradesForChart] = useState<any[]>([]); 

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initData = async () => {
        try {
            const res = await fetch("/api/teacher/dashboard");
            
            if (res.status === 401 || res.status === 403) {
                router.push("/login");
                return;
            }

            const data = await res.json();
            if (data.teacher) {
                setTeacher(data.teacher);
                fetchData(data.teacher.id);
            }
        } catch (error) {
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    initData();
  }, [router]);

  // --- DATA FETCHING (API İLƏ) ---
  const fetchData = async (teacherId: number) => {
    // 1. Şagirdləri Gətir
    try {
        const res = await fetch("/api/teacher/students");
        if (res.ok) {
            const data = await res.json();
            setStudents(data.students || []);
        }
    } catch (e) { console.error(e); }

    // 2. Qrupları Gətir
    try {
        const res = await fetch("/api/teacher/groups");
        if (res.ok) {
            const data = await res.json();
            setGroups(data.groups || []);
        }
    } catch (e) { console.error(e); }
  };

  // --- CRUD: STUDENTS ---
  const handleAddOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = `+994${phonePrefix.slice(1)}${newStudent.phone}`;
    const studentPayload = { ...newStudent, phone: formattedPhone, student_code: editingId ? undefined : Math.floor(Math.random() * 10000) + 1 };

    try {
        const res = await fetch("/api/teacher/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: editingId ? 'update' : 'create', id: editingId, studentData: studentPayload })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        alert(editingId ? "Yeniləndi!" : "Əlavə edildi!");
        resetForm();
        fetchData(teacher.id);
    } catch (error: any) { alert("Xəta: " + error.message); }
  };

  const deleteStudent = async (id: number) => { 
      if (!confirm("Silinsin?")) return;
      try {
        const res = await fetch("/api/teacher/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'delete', id: id })
        });
        if (!res.ok) throw new Error("Silinmə xətası");
        fetchData(teacher.id);
      } catch (error: any) { alert(error.message); }
  };

  const resetForm = () => { setNewStudent({ first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", sector: "Az", start_date: new Date().toISOString().split('T')[0] }); setPhonePrefix("050"); setEditingId(null); };
  const startEdit = (student: any) => {
      const rawPhone = student.phone || ""; let pPrefix = "050"; let pNumber = "";
      if (rawPhone.startsWith("+994")) { pPrefix = "0" + rawPhone.substring(4, 6); pNumber = rawPhone.substring(6); }
      setNewStudent({ first_name: student.first_name, last_name: student.last_name, father_name: student.father_name || "", phone: pNumber, school: student.school || "", grade: student.grade || "", sector: student.sector || "Az", start_date: student.start_date }); setPhonePrefix(pPrefix); setEditingId(student.id);
  };

  // --- QRUPLAR ---
  const addScheduleSlot = () => { if (!tempTime) return; setScheduleSlots([...scheduleSlots, { day: tempDay, time: tempTime }]); setTempTime(""); };
  const removeSlot = (index: number) => { const newSlots = [...scheduleSlots]; newSlots.splice(index, 1); setScheduleSlots(newSlots); };
  
  const handleCreateGroup = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (scheduleSlots.length === 0) return; 
      const finalSchedule = scheduleSlots.map(s => `${s.day} ${s.time}`).join(", "); 
      
      try {
          const res = await fetch("/api/teacher/groups", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newGroupName, schedule: finalSchedule })
          });
          if (!res.ok) throw new Error("Qrup yaradılmadı");
          
          alert("Yarandı!"); setNewGroupName(""); setScheduleSlots([]); fetchData(teacher.id); 
      } catch (e: any) { alert(e.message); }
  };

  // --- JURNAL (API İLƏ) ---
  const openGroup = (group: any) => { 
      setSelectedGroup(group); 
      fetchGroupMembers(group.id); 
      setGradingDate(new Date().toISOString().split('T')[0]); 
  };

  const fetchGroupMembers = async (groupId: number) => { 
      // Jurnal API-dən üzvləri çəkirik
      try {
          const res = await fetch(`/api/teacher/jurnal?type=members&groupId=${groupId}`);
          if (res.ok) {
              const data = await res.json();
              setGroupStudents(data.students || []);
          }
      } catch (e) { console.error(e); }
  };

  const fetchGradesForDate = async () => { 
      if (!selectedGroup) return; 
      setGrades({}); setAttendance({}); 
      
      try {
          const res = await fetch(`/api/teacher/jurnal?type=grades&groupId=${selectedGroup.id}&date=${gradingDate}`);
          if (res.ok) {
              const data = await res.json();
              const nG: any = {}, nA: any = {}; 
              if (data.grades) {
                  data.grades.forEach((r: any) => { 
                      if (r.score !== null) nG[r.student_id] = r.score; 
                      nA[r.student_id] = r.attendance; 
                  }); 
                  setGrades(nG); setAttendance(nA);
              }
          }
      } catch (e) { console.error(e); }
  };

  const addStudentToGroup = async () => { 
      if (!studentToAdd || !selectedGroup) return; 
      try {
          const res = await fetch("/api/teacher/jurnal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: 'add_member', groupId: selectedGroup.id, studentId: studentToAdd })
          });
          if (!res.ok) throw new Error("Əlavə edilmədi (ola bilsin artıq var)");
          
          alert("Əlavə olundu!"); fetchGroupMembers(selectedGroup.id); 
      } catch (e: any) { alert(e.message); }
  };

  const saveGrades = async () => { 
      if (!selectedGroup) return; 
      if (!isValidDay && !confirm("Dərs günü deyil. Davam?")) return; 
      
      const updates = groupStudents.map(student => ({ 
          group_id: selectedGroup.id, 
          student_id: student.id, 
          grade_date: gradingDate, 
          score: grades[student.id] ? parseInt(grades[student.id]) : null, 
          attendance: attendance[student.id] !== false 
      })); 

      try {
          const res = await fetch("/api/teacher/jurnal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: 'save_grades', groupId: selectedGroup.id, date: gradingDate, gradesData: updates })
          });
          if (!res.ok) throw new Error("Xəta baş verdi");
          alert("Saxlanıldı!");
      } catch (e: any) { alert(e.message); }
  };

  const toggleAttendance = (studentId: string) => { const currentStatus = attendance[studentId] !== false; setAttendance({ ...attendance, [studentId]: !currentStatus }); };
  
  const checkScheduleValidity = () => {
    if (!selectedGroup || !gradingDate) return;
    const parts = gradingDate.split('-'); 
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    setIsValidDay(selectedGroup.schedule.includes(DAY_MAP[dateObj.getDay()]));
  };
  useEffect(() => { if (selectedGroup && gradingDate) { checkScheduleValidity(); fetchGradesForDate(); } }, [gradingDate, selectedGroup]);


  // --- ANALYTICS (API İLƏ) ---
  const calculateAnalytics = async (groupId: string) => {
    if (!groupId) return;
    setAnalyticsGroupId(groupId);

    // 1. Üzvləri gətir (API)
    let studentsInGroup = [];
    try {
        const res = await fetch(`/api/teacher/jurnal?type=members&groupId=${groupId}`);
        if (res.ok) {
            const data = await res.json();
            studentsInGroup = data.students;
            setAnalyticsStudentsList(studentsInGroup);
        }
    } catch(e) { console.error(e); return; }

    // 2. Bütün qiymətləri gətir (API)
    let allGrades = [];
    try {
        const res = await fetch(`/api/teacher/jurnal?type=analytics&groupId=${groupId}`);
        if (res.ok) {
            const data = await res.json();
            allGrades = data.allGrades;
            setRawGradesForChart(allGrades);
        }
    } catch(e) { console.error(e); return; }

    if (!allGrades || !studentsInGroup) return;

    let totalGroupScore = 0; let totalGroupAttendance = 0; let scoreCount = 0; let attendanceCount = 0;

    const stats = studentsInGroup.map((student: any) => {
        const studentGrades = allGrades.filter((g: any) => g.student_id === student.id);
        const scoredDays = studentGrades.filter((g: any) => g.score !== null);
        const avgScore = scoredDays.length > 0 
            ? scoredDays.reduce((acc: number, curr: any) => acc + curr.score, 0) / scoredDays.length 
            : 0;

        const totalDays = studentGrades.length;
        const presentDays = studentGrades.filter((g: any) => g.attendance === true).length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        if (scoredDays.length > 0) { totalGroupScore += avgScore; scoreCount++; }
        if (totalDays > 0) { totalGroupAttendance += attendanceRate; attendanceCount++; }

        return { ...student, avgScore: avgScore.toFixed(1), attendanceRate: attendanceRate.toFixed(0) };
    });

    stats.sort((a: any, b: any) => parseFloat(b.avgScore) - parseFloat(a.avgScore));
    setAnalyticsData(stats);
    setGroupStats({
        avgScore: scoreCount > 0 ? parseFloat((totalGroupScore / scoreCount).toFixed(1)) : 0,
        avgAttendance: attendanceCount > 0 ? parseFloat((totalGroupAttendance / attendanceCount).toFixed(0)) : 0
    });

    updateChart(allGrades, 'group', null, 'lessons4');
  };

  // --- CHART GENERATOR (Frontend-də qalır, çünki data artıq var) ---
  const updateChart = (data: any[], mode: 'group' | 'individual', studentId: string | null, interval: string) => {
      let filteredData = [...data];
      if (mode === 'individual' && studentId) {
          filteredData = filteredData.filter(g => g.student_id.toString() === studentId.toString());
      }

      const groupedData: { [key: string]: number[] } = {};

      filteredData.forEach((g: any) => {
          if (g.score !== null) {
              const date = new Date(g.grade_date);
              let key = g.grade_date; 

              if (interval === 'weeks4') {
                  const startOfYear = new Date(date.getFullYear(), 0, 1);
                  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                  const weekNum = Math.ceil((days + 1) / 7);
                  key = `Həftə ${weekNum}`; 
              } else if (interval === 'months4' || interval === 'year') {
                  const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
                  key = monthNames[date.getMonth()];
              }

              if (!groupedData[key]) groupedData[key] = [];
              groupedData[key].push(g.score);
          }
      });

      let chartResult = Object.keys(groupedData).map(key => {
          const scores = groupedData[key];
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          return { label: key, avg: parseFloat(avg.toFixed(1)), rawDate: key };
      });

      if (interval === 'lessons4') {
          chartResult.sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
          chartResult = chartResult.slice(-4);
      } else if (interval === 'weeks4' || interval === 'months4') {
          chartResult = chartResult.slice(-4);
      }
      
      setChartData(chartResult);
  };

  useEffect(() => {
      if (rawGradesForChart.length > 0) {
          updateChart(rawGradesForChart, analysisMode, selectedStudentForChart, chartInterval);
      }
  }, [analysisMode, selectedStudentForChart, chartInterval, rawGradesForChart]);

  // ÇIXIŞ
  const handleLogout = async () => { 
      try {
          await fetch("/api/logout", { method: "POST" });
          router.push("/login");
          router.refresh();
      } catch (error) { router.push("/login"); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-600 font-bold text-lg animate-pulse">Kabinet Yüklənir...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 font-sans">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><BookOpen className="text-blue-600" /> Müəllim Kabineti</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">👤 {teacher?.full_name || teacher?.username}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><Users size={20} /> Dashboard</button>
            <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><GraduationCap size={20} /> Şagird</button>
            <button onClick={() => setActiveTab('groups')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><BookOpen size={20} /> Jurnal</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 transition ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-gray-800 text-gray-500'}`}><BarChart3 size={20} /> Analiz</button>
        </div>

        {/* --- UI HİSSƏLƏRİ EYNİ QALIR --- */}
        {/* Dashboard, Students, Groups, Analytics UI kodları əvvəlki kimi qalır, çünki state-lər dəyişməyib */}
        {/* Sadəcə sən bu kodu bütöv kopyala, mənim yuxarıda UI hissələrini saxladığım kimi sən də tam yerləşdir */}
        
        {/* QISA OLSUN DEYƏ UI HİSSƏLƏRİNİ TƏKRAR YAZMIRAM, ÇÜNKİ ƏVVƏLKİ CAVABDAKI UI 100% DÜZDÜR */}
        {/* SƏN SADƏCƏ return (...) hissəsini əvvəlki koddan götürüb bura qoya bilərsən və ya */}
        {/* ƏGƏR İSTƏYİRSƏNSƏ MƏN TAM KODU BÜTÖV VERƏ BİLƏRƏM. DEYƏSƏN BÜTÖV İSTƏYİRSƏN. */}
        
        {/* --- DASHBOARD UI --- */}
        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <h2 className="text-3xl font-bold mb-2 relative z-10">Xoş Gəldiniz, {teacher?.full_name || teacher?.username}! 👋</h2>
                    <p className="opacity-90 relative z-10">Bu gün: {new Date().toLocaleDateString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div onClick={() => setActiveTab('students')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Users size={32} /></div>
                        <div><h3 className="text-xl font-bold">Şagirdlər</h3><p className="text-gray-500 text-sm">Ümumi: {students.length}</p></div>
                    </div>
                    <div onClick={() => setActiveTab('groups')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4">
                        <div className="p-4 bg-green-50 text-green-600 rounded-xl"><BookOpen size={32} /></div>
                        <div><h3 className="text-xl font-bold">Jurnal</h3><p className="text-gray-500 text-sm">Aktiv Qrup: {groups.length}</p></div>
                    </div>
                    <div onClick={() => setActiveTab('analytics')} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition cursor-pointer flex items-center gap-4">
                        <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Activity size={32} /></div>
                        <div><h3 className="text-xl font-bold">Statistika</h3><p className="text-gray-500 text-sm">Analiz et</p></div>
                    </div>
                </div>
            </div>
        )}

        {/* --- STUDENTS UI --- */}
        {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit sticky top-24">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            {editingId ? <><Pencil size={18} className="text-orange-500"/> Redaktə Et</> : <><Plus size={18}/> Yeni Şagird</>}
                        </h3>
                        {editingId && <button onClick={resetForm} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"><RefreshCcw size={12}/> Ləğv et</button>}
                    </div>
                    <form onSubmit={handleAddOrUpdateStudent} className="space-y-4">
                        <input required placeholder="Ad" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} />
                        <input required placeholder="Soyad" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} />
                        <input placeholder="Ata adı" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.father_name} onChange={e => setNewStudent({...newStudent, father_name: e.target.value})} />
                        <div className="flex gap-2">
                            <select className="w-1/3 p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none text-sm" value={phonePrefix} onChange={(e) => setPhonePrefix(e.target.value)}>{PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}</select>
                            <input placeholder="880 88 88" className="w-2/3 p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 7); setNewStudent({...newStudent, phone: val}) }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Məktəb" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} />
                            <select className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})}><option value="">Sinif</option>{GRADES.map(g => <option key={g} value={g}>{g}</option>)}</select>
                        </div>
                        <div className="flex gap-2">{SECTORS.map(sec => (<button key={sec} type="button" onClick={() => setNewStudent({...newStudent, sector: sec})} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${newStudent.sector === sec ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700 text-gray-500"}`}>{sec}</button>))}</div>
                        <input type="date" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newStudent.start_date} onChange={e => setNewStudent({...newStudent, start_date: e.target.value})} />
                        <button type="submit" className={`w-full text-white py-3 rounded-xl font-bold transition ${editingId ? "bg-orange-500" : "bg-blue-600"}`}>{editingId ? "Yadda Saxla" : "Əlavə Et"}</button>
                    </form>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
                    <h3 className="text-lg font-bold mb-4">Şagirdlərin Siyahısı</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-bold border-b dark:border-gray-600">
                                <tr><th className="p-3">ID</th><th className="p-3">Ad Soyad</th><th className="p-3">Sinif</th><th className="p-3">Sektor</th><th className="p-3 text-right">Əməliyyatlar</th></tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${editingId === s.id ? "bg-blue-50 dark:bg-blue-900" : ""}`}>
                                        <td className="p-3 font-mono text-blue-600 font-bold">#{s.student_code}</td>
                                        <td className="p-3 font-medium text-gray-800 dark:text-white">{s.first_name} {s.last_name}</td>
                                        <td className="p-3">{s.grade}</td>
                                        <td className="p-3"><span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-600">{s.sector || "Az"}</span></td>
                                        <td className="p-3 flex justify-end gap-2">
                                            <button onClick={() => startEdit(s)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg"><Pencil size={16}/></button>
                                            <button onClick={() => deleteStudent(s.id)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:text-red-600"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- GROUPS UI --- */}
        {activeTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4">Yeni Qrup</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input required placeholder="Qrup Adı" className="w-full p-3 bg-gray-50 dark:bg-gray-700 border dark:border-gray-600 rounded-xl outline-none" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border dark:border-gray-600">
                                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">Dərs Vaxtı Əlavə Et</label>
                                <div className="flex gap-2 mb-2">
                                    <select className="p-2 border rounded-lg bg-white dark:bg-gray-600 text-sm flex-1 outline-none" value={tempDay} onChange={(e) => setTempDay(e.target.value)}>{WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                    <input type="time" className="p-2 border rounded-lg bg-white dark:bg-gray-600 text-sm outline-none" value={tempTime} onChange={(e) => setTempTime(e.target.value)} />
                                    <button type="button" onClick={addScheduleSlot} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={18}/></button>
                                </div>
                                <div className="space-y-1 mt-2">
                                    {scheduleSlots.map((slot, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white dark:bg-gray-600 border p-2 rounded-lg text-sm">
                                            <span className="font-bold text-gray-700 dark:text-gray-200">{slot.day} - {slot.time}</span>
                                            <button type="button" onClick={() => removeSlot(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Yarat</button>
                        </form>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                        <h3 className="text-lg font-bold mb-4">Qruplarım</h3>
                        <div className="space-y-2">
                            {groups.map((g) => (
                                <div key={g.id} onClick={() => openGroup(g)} className={`p-4 rounded-xl border dark:border-gray-600 cursor-pointer flex justify-between items-center ${selectedGroup?.id === g.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <div><h4 className="font-bold">{g.name}</h4><p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{g.schedule}</p></div>
                                    <ChevronRight size={18} className="text-gray-400"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border dark:border-gray-700 min-h-[500px]">
                    {selectedGroup ? (
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-6 border-b dark:border-gray-600">
                                <div><h2 className="text-2xl font-bold">{selectedGroup.name}</h2><p className="text-gray-500 text-sm mt-1">{selectedGroup.schedule}</p></div>
                                <div className="flex gap-2">
                                    <select className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-sm" value={studentToAdd} onChange={(e) => setStudentToAdd(e.target.value)}>
                                        <option value="">Şagird seç...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                    </select>
                                    <button onClick={addStudentToGroup} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Əlavə Et</button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mb-4 flex-wrap">
                                <h3 className="text-lg font-bold">Jurnal</h3>
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                                    <Calendar size={18} className="text-gray-500"/>
                                    <input type="date" value={gradingDate} onChange={e => setGradingDate(e.target.value)} className="bg-transparent outline-none text-sm font-medium"/>
                                </div>
                                {!isValidDay && (<div className="flex items-center gap-2 text-orange-600 text-sm font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-200"><AlertTriangle size={16}/> Bu gün dərs günü deyil!</div>)}
                                <button onClick={saveGrades} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"><Save size={18}/> Yadda Saxla</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-b dark:border-gray-600">
                                            <th className="p-3 border dark:border-gray-600">#</th><th className="p-3 border dark:border-gray-600 w-1/3">Şagird</th><th className="p-3 border dark:border-gray-600 text-center">İştirak</th><th className="p-3 border dark:border-gray-600 text-center">Bal (0-10)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupStudents.map((s, index) => (
                                            <tr key={s.id} className="border-b dark:border-gray-600">
                                                <td className="p-3 border dark:border-gray-600 text-gray-500">{index + 1}</td>
                                                <td className="p-3 border dark:border-gray-600 font-medium">{s.first_name} {s.last_name}</td>
                                                <td className="p-3 border dark:border-gray-600 text-center">
                                                    <button onClick={() => toggleAttendance(s.id)}>
                                                        {attendance[s.id] !== false ? <CheckCircle className="text-green-500 mx-auto" size={24} /> : <XCircle className="text-red-500 mx-auto" size={24} />}
                                                    </button>
                                                </td>
                                                <td className="p-3 border dark:border-gray-600">
                                                    <input 
                                                        type="number" min="0" max="10" placeholder="-" 
                                                        className="w-full p-2 bg-blue-50/50 dark:bg-blue-900 rounded-md outline-none text-center font-bold text-blue-700 dark:text-blue-300" 
                                                        value={grades[s.id] || ""} 
                                                        onChange={(e) => { let val = e.target.value; if(Number(val) > 10) val = "10"; setGrades({...grades, [s.id]: val}); }} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400"><BookOpen size={48} className="mb-4 opacity-20"/><p>Soldan bir qrup seçin.</p></div>
                    )}
                </div>
            </div>
        )}

        {/* --- ANALYTICS UI --- */}
        {activeTab === 'analytics' && (
             <div className="animate-in fade-in">
                <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="w-full md:w-1/3">
                        <h2 className="text-2xl font-bold mb-2">Statistika</h2>
                        <select 
                            className="p-3 border rounded-xl bg-white dark:bg-gray-800 w-full shadow-sm outline-none cursor-pointer"
                            onChange={(e) => calculateAnalytics(e.target.value)}
                            value={analyticsGroupId}
                        >
                            <option value="">Analiz üçün qrup seçin...</option>
                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    
                    {analyticsGroupId && (
                        <div className="flex flex-col gap-4 w-full md:w-auto items-end">
                            <div className="flex gap-2">
                                <button onClick={() => setAnalysisMode('group')} className={`px-4 py-2 rounded-md text-sm font-bold border transition ${analysisMode === 'group' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>Qrup</button>
                                <button onClick={() => setAnalysisMode('individual')} className={`px-4 py-2 rounded-md text-sm font-bold border transition ${analysisMode === 'individual' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>Fərdi</button>
                            </div>

                            {analysisMode === 'individual' && (
                                <select className="p-2 border rounded-lg bg-white dark:bg-gray-800 text-sm w-48 outline-none" value={selectedStudentForChart} onChange={(e) => setSelectedStudentForChart(e.target.value)}>
                                    <option value="">Şagird seç...</option>
                                    {analyticsStudentsList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                </select>
                            )}

                            <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700">
                                <button onClick={() => setChartInterval('lessons4')} className={`px-3 py-2 rounded-md text-xs font-bold transition ${chartInterval === 'lessons4' ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' : 'text-gray-400'}`}>Son 4 Dərs</button>
                                <button onClick={() => setChartInterval('weeks4')} className={`px-3 py-2 rounded-md text-xs font-bold transition ${chartInterval === 'weeks4' ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' : 'text-gray-400'}`}>Son 4 Həftə</button>
                                <button onClick={() => setChartInterval('months4')} className={`px-3 py-2 rounded-md text-xs font-bold transition ${chartInterval === 'months4' ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' : 'text-gray-400'}`}>Son 4 Ay</button>
                                <button onClick={() => setChartInterval('year')} className={`px-3 py-2 rounded-md text-xs font-bold transition ${chartInterval === 'year' ? 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white' : 'text-gray-400'}`}>İllik</button>
                            </div>
                        </div>
                    )}
                </div>

                {analyticsGroupId && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center justify-between">
                                <div><p className="text-gray-500 text-sm font-bold">Ortalama Bal (10-luq)</p><h3 className="text-4xl font-bold text-blue-600">{groupStats.avgScore}</h3></div>
                                <div className="p-4 bg-blue-50 rounded-full text-blue-600"><TrendingUp size={32}/></div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center justify-between">
                                <div><p className="text-gray-500 text-sm font-bold">Davamiyyət Faizi</p><h3 className="text-4xl font-bold text-green-600">{groupStats.avgAttendance}%</h3></div>
                                <div className="p-4 bg-green-50 rounded-full text-green-600"><PieChart size={32}/></div>
                            </div>
                        </div>

                        {chartData.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Activity size={20} className="text-purple-600"/> 
                                    {analysisMode === 'group' ? 'Qrup Trendi' : 'Fərdi İnkişaf'} 
                                    <span className="text-sm font-normal text-gray-400 ml-2">
                                        ({chartInterval === 'lessons4' ? 'Günlük' : chartInterval === 'weeks4' ? 'Həftəlik' : 'Aylıq'})
                                    </span>
                                </h3>
                                
                                <div className="h-64 flex items-end justify-around gap-4 px-2 border-b dark:border-gray-700 pb-2">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                                            <div className="absolute -top-10 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition z-10 whitespace-nowrap">
                                                {d.label}: <strong>{d.avg}</strong> Bal
                                            </div>
                                            <div 
                                                className={`w-full max-w-[50px] rounded-t-md transition-all relative ${d.avg >= 9 ? 'bg-green-500' : d.avg >= 6 ? 'bg-blue-500' : 'bg-orange-500'} hover:opacity-80`}
                                                style={{ height: `${Math.max(d.avg * 10, 5)}%` }} 
                                            ></div>
                                            <span className="text-[10px] text-gray-400 mt-3 font-medium truncate w-full text-center">
                                                {chartInterval === 'lessons4' ? d.label.slice(5) : d.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* REYTİNQ */}
                        {analysisMode === 'group' && (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
                                <h3 className="text-lg font-bold mb-4">Şagird Reytinqi</h3>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold border-b dark:border-gray-600">
                                        <tr><th className="p-3">#</th><th className="p-3">Şagird</th><th className="p-3">Ortalama</th><th className="p-3">Davamiyyət</th><th className="p-3">Status</th></tr>
                                    </thead>
                                    <tbody>
                                        {analyticsData.map((s, index) => (
                                            <tr key={s.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="p-3 font-bold text-gray-400">{index + 1}</td>
                                                <td className="p-3 font-medium">{s.first_name} {s.last_name}</td>
                                                <td className="p-3 font-bold text-blue-600 text-lg">{s.avgScore}</td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className={`h-full ${parseFloat(s.attendanceRate) > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${s.attendanceRate}%` }}></div>
                                                        </div>
                                                        <span className="text-xs text-gray-500">{s.attendanceRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {parseFloat(s.avgScore) >= 9 ? <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">Əlaçı</span> :
                                                     parseFloat(s.avgScore) >= 7 ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-bold">Yaxşı</span> :
                                                     <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">Zəif</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
             </div>
        )}
      </main>
    </div>
  );
}
