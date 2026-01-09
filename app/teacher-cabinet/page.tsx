"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  LogOut, Users, BookOpen, Plus, Calendar, Save, 
  ChevronRight, GraduationCap, Clock, CheckCircle, XCircle, AlertTriangle, Trash2
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WEEK_DAYS = ["B.e", "Ç.a", "Çərş", "C.a", "Cüm", "Şən", "Baz"];
const DAY_MAP: { [key: number]: string } = { 1: "B.e", 2: "Ç.a", 3: "Çərş", 4: "C.a", 5: "Cüm", 6: "Şən", 0: "Baz" };
const PHONE_PREFIXES = ["050", "051", "055", "070", "077", "099", "010", "060"]; // Operatorlar
const GRADES = Array.from({ length: 11 }, (_, i) => i + 1); // 1-11 Siniflər

export default function TeacherCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // FORMS
  // Phone state-i sadəcə 7 rəqəmi saxlayacaq
  const [phonePrefix, setPhonePrefix] = useState("050");
  const [newStudent, setNewStudent] = useState({
    first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", start_date: new Date().toISOString().split('T')[0]
  });
  
  // --- YENİ QRUP STATE-LƏRİ ---
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

  // AUTH
  useEffect(() => {
    const checkAuth = async () => {
      const cookies = document.cookie.split("; ");
      const hasToken = cookies.find((row) => row.startsWith("teacher_token="));
      if (!hasToken) { router.push("/login?type=teacher"); return; }

      const { data } = await supabase.from('teachers').select('*').limit(1).single();
      if (data) {
        setTeacher(data);
        fetchData(data.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const fetchData = async (teacherId: number) => {
    const { data: sData } = await supabase.from('local_students').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false });
    if (sData) setStudents(sData);

    const { data: gData } = await supabase.from('groups').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false });
    if (gData) setGroups(gData);
  };

  // --- 1. ŞAGİRD ƏLAVƏ ET ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameRegex = /^[a-zA-ZəüöğıçşƏÜÖĞIÇŞ\s]+$/;
    
    // Validasiyalar
    if (!nameRegex.test(newStudent.first_name) || !nameRegex.test(newStudent.last_name)) {
      alert("Ad və Soyad yalnız hərflərdən ibarət olmalıdır!"); return;
    }
    
    // Nömrə uzunluğunu yoxla (dəqiq 7 rəqəm olmalıdır)
    if (newStudent.phone.length !== 7) {
        alert("Zəhmət olmasa nömrəni tam daxil edin (7 rəqəm)."); return;
    }

    if (!newStudent.grade) {
        alert("Zəhmət olmasa sinif seçin."); return;
    }

    // Nömrəni formatlayırıq: +994 + 77 + 1234567
    const formattedPhone = `+994${phonePrefix.slice(1)}${newStudent.phone}`;

    let uniqueId = Math.floor(Math.random() * 10000) + 1;
    while (students.some(s => s.student_code === uniqueId)) {
      uniqueId = Math.floor(Math.random() * 10000) + 1;
    }

    const { error } = await supabase.from('local_students').insert([{
      ...newStudent, 
      phone: formattedPhone, // Formatlanmış nömrəni göndəririk
      teacher_id: teacher.id, 
      student_code: uniqueId
    }]);

    if (!error) {
      alert(`Şagird əlavə edildi! ID: ${uniqueId}`);
      // Formu sıfırla
      setNewStudent({ first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", start_date: new Date().toISOString().split('T')[0] });
      setPhonePrefix("050");
      fetchData(teacher.id);
    } else {
      alert("Xəta: " + error.message);
    }
  };

  // --- 2. YENİ QRUP SISTEMİ ---
  const addScheduleSlot = () => {
    if (!tempTime) { alert("Saat seçin!"); return; }
    setScheduleSlots([...scheduleSlots, { day: tempDay, time: tempTime }]);
    setTempTime(""); 
  };

  const removeSlot = (index: number) => {
    const newSlots = [...scheduleSlots];
    newSlots.splice(index, 1);
    setScheduleSlots(newSlots);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleSlots.length === 0) { alert("Ən azı bir dərs günü əlavə edin!"); return; }
    const finalSchedule = scheduleSlots.map(s => `${s.day} ${s.time}`).join(", ");
    const { error } = await supabase.from('groups').insert([{ name: newGroupName, schedule: finalSchedule, teacher_id: teacher.id }]);
    if (!error) {
      alert("Qrup yaradıldı!");
      setNewGroupName(""); setScheduleSlots([]); setTempTime("");
      fetchData(teacher.id);
    }
  };

  // --- JURNAL MƏNTİQİ ---
  const openGroup = (group: any) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
    const today = new Date().toISOString().split('T')[0];
    setGradingDate(today);
  };

  useEffect(() => {
    if (selectedGroup && gradingDate) {
      checkScheduleValidity();
      fetchGradesForDate();
    }
  }, [gradingDate, selectedGroup]);

  const checkScheduleValidity = () => {
    if (!selectedGroup) return;
    const dateObj = new Date(gradingDate);
    const dayIndex = dateObj.getDay(); 
    const dayString = DAY_MAP[dayIndex];
    if (selectedGroup.schedule.includes(dayString)) setIsValidDay(true);
    else setIsValidDay(false);
  };

  const fetchGradesForDate = async () => {
    if (!selectedGroup) return;
    setGrades({}); setAttendance({});
    const { data } = await supabase.from('daily_grades').select('*').eq('group_id', selectedGroup.id).eq('grade_date', gradingDate);
    if (data) {
      const newGrades: any = {}; const newAttendance: any = {};
      data.forEach((record: any) => {
        if (record.score !== null) newGrades[record.student_id] = record.score;
        newAttendance[record.student_id] = record.attendance;
      });
      setGrades(newGrades); setAttendance(newAttendance);
    }
  };

  const fetchGroupMembers = async (groupId: number) => {
    const { data } = await supabase.from('group_members').select(`student_id, local_students ( * )`).eq('group_id', groupId);
    if (data) setGroupStudents(data.map((item: any) => item.local_students));
  };

  const addStudentToGroup = async () => {
    if (!studentToAdd || !selectedGroup) return;
    const { error } = await supabase.from('group_members').insert({ group_id: selectedGroup.id, student_id: studentToAdd });
    if (!error) { alert("Əlavə olundu!"); setStudentToAdd(""); fetchGroupMembers(selectedGroup.id); } 
    else alert("Bu şagird artıq qrupdadır.");
  };

  const saveGrades = async () => {
    if (!selectedGroup) return;
    if (!isValidDay && !confirm("Bu gün dərs günü deyil. Yenə də yazmaq istəyirsiniz?")) return;

    await supabase.from('daily_grades').delete().eq('group_id', selectedGroup.id).eq('grade_date', gradingDate);

    const updates = groupStudents.map(student => ({
      group_id: selectedGroup.id,
      student_id: student.id,
      grade_date: gradingDate,
      score: grades[student.id] ? parseInt(grades[student.id]) : null,
      attendance: attendance[student.id] !== false
    }));

    const { error } = await supabase.from('daily_grades').insert(updates);
    if (!error) alert("Məlumatlar yadda saxlanıldı! ✅");
    else alert("Xəta: " + error.message);
  };

  const handleLogout = () => {
    document.cookie = "teacher_token=; path=/; max-age=0";
    router.push("/login?type=teacher");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600">Yüklənir...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><BookOpen className="text-blue-600" /> Müəllim Kabineti</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">👤 {teacher?.full_name || teacher?.username}</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 font-medium"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* TABLAR */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}><Users size={20} /> Dashboard</button>
            <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}><GraduationCap size={20} /> Şagird</button>
            <button onClick={() => setActiveTab('groups')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 ${activeTab === 'groups' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}><BookOpen size={20} /> Jurnal</button>
        </div>

        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
                    <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, {teacher?.full_name || teacher?.username}! 👋</h2>
                    <p className="opacity-90">Bu gün: {new Date().toLocaleDateString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div onClick={() => setActiveTab('students')} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition"><Users size={32} /></div>
                            <div><h3 className="text-xl font-bold text-gray-800">Şagirdlər</h3><p className="text-gray-500 text-sm">Ümumi: {students.length}</p></div>
                        </div>
                        <p className="text-sm text-gray-400">Şagird əlavə etmək və siyahıya baxmaq üçün klikləyin.</p>
                    </div>

                    <div onClick={() => setActiveTab('groups')} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer group">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition"><BookOpen size={32} /></div>
                            <div><h3 className="text-xl font-bold text-gray-800">Jurnal & Qruplar</h3><p className="text-gray-500 text-sm">Aktiv Qrup: {groups.length}</p></div>
                        </div>
                        <p className="text-sm text-gray-400">Qiymət yazmaq və qrupları idarə etmək üçün klikləyin.</p>
                    </div>
                </div>
            </div>
        )}

        {/* --- ŞAGİRDLƏR (FORM DƏYİŞDİRİLDİ) --- */}
        {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Yeni Şagird</h3>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <input required placeholder="Ad" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} />
                        <input required placeholder="Soyad" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} />
                        <input placeholder="Ata adı" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={newStudent.father_name} onChange={e => setNewStudent({...newStudent, father_name: e.target.value})} />
                        
                        {/* YENİ: TELEFON GİRİŞİ (Prefix + 7 rəqəm) */}
                        <div className="flex gap-2">
                            <select 
                                className="w-1/3 p-3 bg-gray-50 border rounded-xl outline-none text-sm"
                                value={phonePrefix}
                                onChange={(e) => setPhonePrefix(e.target.value)}
                            >
                                {PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input 
                                placeholder="880 88 88" 
                                className="w-2/3 p-3 bg-gray-50 border rounded-xl outline-none" 
                                value={newStudent.phone} 
                                onChange={e => {
                                    // Yalnız rəqəmlər və max 7 simvol
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 7);
                                    setNewStudent({...newStudent, phone: val})
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Məktəb" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} />
                            
                            {/* YENİ: SİNİF SEÇİMİ (1-11) */}
                            <select 
                                className="w-full p-3 bg-gray-50 border rounded-xl outline-none" 
                                value={newStudent.grade} 
                                onChange={e => setNewStudent({...newStudent, grade: e.target.value})}
                            >
                                <option value="">Sinif</option>
                                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        
                        <input type="date" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={newStudent.start_date} onChange={e => setNewStudent({...newStudent, start_date: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">Əlavə Et</button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border overflow-hidden">
                    <h3 className="text-lg font-bold mb-4">Şagirdlərin Siyahısı</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-800 font-bold border-b">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Ad Soyad</th>
                                    <th className="p-3">Sinif</th>
                                    <th className="p-3">Məktəb</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-mono text-blue-600 font-bold">#{s.student_code}</td>
                                        <td className="p-3 font-medium text-gray-800">{s.first_name} {s.last_name}</td>
                                        <td className="p-3">{s.grade}</td>
                                        <td className="p-3">{s.school}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- QRUPLAR VƏ JURNAL --- */}
        {activeTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="text-lg font-bold mb-4">Yeni Qrup</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input required placeholder="Qrup Adı" className="w-full p-3 bg-gray-50 border rounded-xl outline-none" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                            
                            <div className="bg-gray-50 p-3 rounded-xl border">
                                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">Dərs Vaxtı Əlavə Et</label>
                                <div className="flex gap-2 mb-2">
                                    <select className="p-2 border rounded-lg bg-white text-sm flex-1 outline-none" value={tempDay} onChange={(e) => setTempDay(e.target.value)}>
                                        {WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <input type="time" className="p-2 border rounded-lg bg-white text-sm outline-none" value={tempTime} onChange={(e) => setTempTime(e.target.value)} />
                                    <button type="button" onClick={addScheduleSlot} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={18}/></button>
                                </div>
                                
                                <div className="space-y-1 mt-2">
                                    {scheduleSlots.map((slot, index) => (
                                        <div key={index} className="flex justify-between items-center bg-white border p-2 rounded-lg text-sm">
                                            <span className="font-bold text-gray-700">{slot.day} - {slot.time}</span>
                                            <button type="button" onClick={() => removeSlot(index)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                        </div>
                                    ))}
                                    {scheduleSlots.length === 0 && <p className="text-xs text-gray-400 text-center">Hələ vaxt əlavə edilməyib</p>}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Yarat</button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="text-lg font-bold mb-4">Qruplarım</h3>
                        <div className="space-y-2">
                            {groups.map((g) => (
                                <div key={g.id} onClick={() => openGroup(g)} className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center ${selectedGroup?.id === g.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                                    <div><h4 className="font-bold">{g.name}</h4><p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{g.schedule}</p></div>
                                    <ChevronRight size={18} className="text-gray-400"/>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border min-h-[500px]">
                    {selectedGroup ? (
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-6 border-b">
                                <div><h2 className="text-2xl font-bold">{selectedGroup.name}</h2><p className="text-gray-500 text-sm mt-1">{selectedGroup.schedule}</p></div>
                                <div className="flex gap-2">
                                    <select className="p-2 border rounded-lg bg-gray-50 text-sm" value={studentToAdd} onChange={(e) => setStudentToAdd(e.target.value)}>
                                        <option value="">Şagird seç...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                    </select>
                                    <button onClick={addStudentToGroup} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">Əlavə Et</button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4 flex-wrap">
                                <h3 className="text-lg font-bold">Jurnal</h3>
                                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                                    <Calendar size={18} className="text-gray-500"/>
                                    <input type="date" value={gradingDate} onChange={e => setGradingDate(e.target.value)} className="bg-transparent outline-none text-sm font-medium"/>
                                </div>
                                {!isValidDay && (
                                    <div className="flex items-center gap-2 text-orange-600 text-sm font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-200"><AlertTriangle size={16}/> Bu gün dərs günü deyil!</div>
                                )}
                                <button onClick={saveGrades} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"><Save size={18}/> Yadda Saxla</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 border-b">
                                            <th className="p-3 border">#</th>
                                            <th className="p-3 border w-1/3">Şagird</th>
                                            <th className="p-3 border text-center">İştirak</th>
                                            <th className="p-3 border text-center">Bal (0-100)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupStudents.map((s, index) => (
                                            <tr key={s.id} className="border-b">
                                                <td className="p-3 border text-gray-500">{index + 1}</td>
                                                <td className="p-3 border font-medium">{s.first_name} {s.last_name}</td>
                                                <td className="p-3 border text-center">
                                                    <button onClick={() => setAttendance({...attendance, [s.id]: !attendance[s.id] && attendance[s.id] !== undefined ? false : (attendance[s.id] === false ? true : false)})}>
                                                        {attendance[s.id] !== false ? <CheckCircle className="text-green-500 mx-auto" size={24} /> : <XCircle className="text-red-500 mx-auto" size={24} />}
                                                    </button>
                                                </td>
                                                <td className="p-3 border">
                                                    <input type="number" placeholder="-" className="w-full p-2 bg-blue-50/50 rounded-md outline-none text-center font-bold text-blue-700" value={grades[s.id] || ""} onChange={(e) => setGrades({...grades, [s.id]: e.target.value})} />
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
      </main>
    </div>
  );
}
