"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  LogOut, Users, BookOpen, Plus, Calendar, Save, 
  ChevronRight, GraduationCap, Clock, CheckCircle, XCircle, AlertTriangle
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WEEK_DAYS = ["B.e", "Ç.a", "Çərş", "C.a", "Cüm", "Şən", "Baz"];
const DAY_MAP: { [key: number]: string } = { 1: "B.e", 2: "Ç.a", 3: "Çərş", 4: "C.a", 5: "Cüm", 6: "Şən", 0: "Baz" };

export default function TeacherCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // FORMS
  const [newStudent, setNewStudent] = useState({
    first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", start_date: new Date().toISOString().split('T')[0]
  });
  
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");

  // JURNAL STATE
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupStudents, setGroupStudents] = useState<any[]>([]);
  const [studentToAdd, setStudentToAdd] = useState("");
  const [gradingDate, setGradingDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Qiymət və İştirak Yaddaşı
  // grades: { student_id: "85" }
  // attendance: { student_id: true/false } (true=var, false=yox)
  const [grades, setGrades] = useState<{[key: string]: string}>({});
  const [attendance, setAttendance] = useState<{[key: string]: boolean}>({});
  const [isValidDay, setIsValidDay] = useState(true); // Seçilən gün dərs günüdürmü?

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

  // --- 1. ŞAGİRD ƏLAVƏ ET (VALIDASİYA + ID) ---
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasiya: Ad/Soyad ancaq hərf
    const nameRegex = /^[a-zA-ZəüöğıçşƏÜÖĞIÇŞ\s]+$/;
    if (!nameRegex.test(newStudent.first_name) || !nameRegex.test(newStudent.last_name)) {
      alert("Ad və Soyad yalnız hərflərdən ibarət olmalıdır!");
      return;
    }

    // Validasiya: Telefon ancaq rəqəm
    if (!/^\d+$/.test(newStudent.phone)) {
      alert("Telefon nömrəsi yalnız rəqəm olmalıdır!");
      return;
    }

    // Validasiya: Sinif ancaq rəqəm
    if (!/^\d+$/.test(newStudent.grade)) {
      alert("Sinif yalnız rəqəm olmalıdır (Məs: 8, 9, 10)!");
      return;
    }

    // Unique ID Generasiyası (1-10000)
    let uniqueId = Math.floor(Math.random() * 10000) + 1;
    // Təsadüfən eyni ID düşərsə dəyişirik (sadə yoxlama)
    while (students.some(s => s.student_code === uniqueId)) {
      uniqueId = Math.floor(Math.random() * 10000) + 1;
    }

    const { error } = await supabase.from('local_students').insert([{
      ...newStudent,
      teacher_id: teacher.id,
      student_code: uniqueId
    }]);

    if (!error) {
      alert(`Şagird əlavə edildi! ID: ${uniqueId}`);
      setNewStudent({ first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", start_date: new Date().toISOString().split('T')[0] });
      fetchData(teacher.id);
    } else {
      alert("Xəta: " + error.message);
    }
  };

  // --- 2. QRUP MƏNTİQİ ---
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0 || !selectedTime) { alert("Gün və saat seçin!"); return; }

    const finalSchedule = `${selectedDays.join(", ")} - ${selectedTime}`;
    const { error } = await supabase.from('groups').insert([{ name: newGroupName, schedule: finalSchedule, teacher_id: teacher.id }]);
    if (!error) {
      alert("Qrup yaradıldı!");
      setNewGroupName(""); setSelectedDays([]); setSelectedTime("");
      fetchData(teacher.id);
    }
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) setSelectedDays(selectedDays.filter(d => d !== day));
    else setSelectedDays([...selectedDays, day]);
  };

  const openGroup = (group: any) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
    // Tarixi bu günə çək və yoxla
    const today = new Date().toISOString().split('T')[0];
    setGradingDate(today);
  };

  // --- 3. TARİX DƏYİŞƏNDƏ QİYMƏTLƏRİ GƏTİR VƏ GÜNÜ YOXLA ---
  useEffect(() => {
    if (selectedGroup && gradingDate) {
      checkScheduleValidity();
      fetchGradesForDate();
    }
  }, [gradingDate, selectedGroup]);

  // Günün düzgünlüyünü yoxla
  const checkScheduleValidity = () => {
    if (!selectedGroup) return;
    const dateObj = new Date(gradingDate);
    const dayIndex = dateObj.getDay(); // 0=Baz, 1=B.e ...
    const dayString = DAY_MAP[dayIndex];
    
    // Qrupun cədvəlində bu gün varmı? (Məs: "B.e, Çərş - 15:00")
    if (selectedGroup.schedule.includes(dayString)) {
      setIsValidDay(true);
    } else {
      setIsValidDay(false);
    }
  };

  // Bazadan mövcud qiymətləri oxu
  const fetchGradesForDate = async () => {
    if (!selectedGroup) return;
    
    // Əvvəlcə sıfırla
    setGrades({});
    setAttendance({});

    const { data } = await supabase
      .from('daily_grades')
      .select('*')
      .eq('group_id', selectedGroup.id)
      .eq('grade_date', gradingDate);

    if (data) {
      const newGrades: any = {};
      const newAttendance: any = {};
      data.forEach((record: any) => {
        if (record.score !== null) newGrades[record.student_id] = record.score;
        newAttendance[record.student_id] = record.attendance;
      });
      setGrades(newGrades);
      setAttendance(newAttendance);
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

  // --- 4. BALLARI VƏ İŞTİRAKI YADDA SAXLA ---
  const saveGrades = async () => {
    if (!selectedGroup) return;
    if (!isValidDay) {
        if(!confirm("Diqqət! Bu gün dərs günü deyil. Yenə də yazmaq istəyirsiniz?")) return;
    }

    // Köhnə datanı silirik ki, dublikat olmasın (Upsert məntiqi əvəzinə sadə delete-insert)
    await supabase.from('daily_grades').delete().eq('group_id', selectedGroup.id).eq('grade_date', gradingDate);

    const updates = groupStudents.map(student => {
      // Əgər heç nə yazılmayıbsa default olaraq "İştirak edib" götürək, balı yoxdursa null
      const isPresent = attendance[student.id] !== false; // undefined is true
      const scoreVal = grades[student.id] ? parseInt(grades[student.id]) : null;

      return {
        group_id: selectedGroup.id,
        student_id: student.id,
        grade_date: gradingDate,
        score: scoreVal,
        attendance: isPresent
      };
    });

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
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}><Users size={20} /> Dashboard</button>
            <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}><GraduationCap size={20} /> Şagird</button>
            <button onClick={() => setActiveTab('groups')} className={`px-6 py-3 rounded-xl font-bold flex gap-2 ${activeTab === 'groups' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500'}`}><BookOpen size={20} /> Jurnal</button>
        </div>

        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
                    <h2 className="text-3xl font-bold">Xoş Gəldiniz! 👋</h2>
                    <p className="opacity-90">Bu gün: {new Date().toLocaleDateString('az-AZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
                        <div><p className="text-gray-500 text-sm">Ümumi Şagird</p><h3 className="text-2xl font-bold">{students.length}</h3></div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Yeni Şagird</h3>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <input required placeholder="Ad (Ancaq hərf)" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} />
                        <input required placeholder="Soyad (Ancaq hərf)" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} />
                        <input placeholder="Ata adı" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.father_name} onChange={e => setNewStudent({...newStudent, father_name: e.target.value})} />
                        <input placeholder="Telefon (Ancaq rəqəm)" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Məktəb" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} />
                            <input placeholder="Sinif (8, 9...)" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} />
                        </div>
                        <input type="date" className="w-full p-3 bg-gray-50 border rounded-xl" value={newStudent.start_date} onChange={e => setNewStudent({...newStudent, start_date: e.target.value})} />
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

        {activeTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="text-lg font-bold mb-4">Yeni Qrup</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input required placeholder="Qrup Adı" className="w-full p-3 bg-gray-50 border rounded-xl" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-2 block uppercase">Dərs Günləri</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {WEEK_DAYS.map((day) => (
                                        <button key={day} type="button" onClick={() => toggleDay(day)} className={`py-2 px-1 text-xs font-bold rounded-lg border ${selectedDays.includes(day) ? "bg-blue-600 text-white" : "bg-gray-50"}`}>{day}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="time" required className="w-full pl-10 p-3 bg-gray-50 border rounded-xl" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Yarat</button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h3 className="text-lg font-bold mb-4">Qruplarım</h3>
                        <div className="space-y-2">
                            {groups.map((g) => (
                                <div key={g.id} onClick={() => openGroup(g)} className={`p-4 rounded-xl border cursor-pointer flex justify-between ${selectedGroup?.id === g.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                                    <div><h4 className="font-bold">{g.name}</h4><p className="text-xs text-gray-500">{g.schedule}</p></div>
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
                                <div><h2 className="text-2xl font-bold">{selectedGroup.name}</h2><p className="text-gray-500">{selectedGroup.schedule}</p></div>
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
                                    <div className="flex items-center gap-2 text-orange-600 text-sm font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                        <AlertTriangle size={16}/> Bu gün dərs günü deyil!
                                    </div>
                                )}
                                <button onClick={saveGrades} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                                    <Save size={18}/> Yadda Saxla
                                </button>
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
                                                    <button 
                                                        onClick={() => setAttendance({...attendance, [s.id]: !attendance[s.id] && attendance[s.id] !== undefined ? false : (attendance[s.id] === false ? true : false)})}
                                                        className="focus:outline-none"
                                                    >
                                                        {/* Logic: undefined və ya true -> GÖY (Var), false -> QIRMIZI (Yox) */}
                                                        {attendance[s.id] !== false ? (
                                                            <CheckCircle className="text-green-500 mx-auto cursor-pointer hover:scale-110 transition" size={24} />
                                                        ) : (
                                                            <XCircle className="text-red-500 mx-auto cursor-pointer hover:scale-110 transition" size={24} />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="p-3 border">
                                                    <input 
                                                        type="number" 
                                                        placeholder="-"
                                                        className="w-full p-2 bg-blue-50/50 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold text-blue-700"
                                                        value={grades[s.id] || ""}
                                                        onChange={(e) => setGrades({...grades, [s.id]: e.target.value})}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {groupStudents.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Şagird yoxdur.</td></tr>}
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
