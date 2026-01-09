"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  LogOut, 
  Users, 
  BookOpen, 
  UserCheck, 
  Plus, 
  Trash2, 
  Calendar, 
  Save, 
  ChevronRight,
  GraduationCap
} from "lucide-react";

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TeacherCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Müəllim Məlumatları
  const [teacher, setTeacher] = useState<any>(null);

  // Tablar: 'dashboard' | 'students' | 'groups'
  const [activeTab, setActiveTab] = useState("dashboard");

  // DATA STATE
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // FORM STATES
  const [newStudent, setNewStudent] = useState({
    first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", start_date: new Date().toISOString().split('T')[0]
  });
  const [newGroup, setNewGroup] = useState({ name: "", schedule: "" });

  // QRUP DETALLARI VƏ QİYMƏTLƏNDİRMƏ
  const [selectedGroup, setSelectedGroup] = useState<any>(null); // Seçilmiş qrup
  const [groupStudents, setGroupStudents] = useState<any[]>([]); // O qrupdakı uşaqlar
  const [studentToAdd, setStudentToAdd] = useState(""); // Qrupa əlavə ediləcək şagird ID-si
  const [gradingDate, setGradingDate] = useState(new Date().toISOString().split('T')[0]);
  const [grades, setGrades] = useState<{[key: string]: string}>({}); // {student_id: score}

  // 1. Giriş yoxlanışı və Müəllim məlumatının alınması
  useEffect(() => {
    const checkAuth = async () => {
      const cookies = document.cookie.split("; ");
      const hasToken = cookies.find((row) => row.startsWith("teacher_token="));
      
      if (!hasToken) {
        router.push("/login?type=teacher");
        return;
      }

      // Müəllimi tapmaq (Login zamanı localStorage yazmadığımız üçün, 
      // demo məqsədli sistemdəki ilk müəllimi və ya adı uyğun gələni götürürük.
      // Real layihədə Login-də ID-ni localStorage-ə atmaq lazımdır)
      const { data: teacherData } = await supabase.from('teachers').select('*').limit(1).single();
      
      if (teacherData) {
        setTeacher(teacherData);
        fetchData(teacherData.id);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // 2. Məlumatları çəkmək
  const fetchData = async (teacherId: number) => {
    // Şagirdləri çək
    const { data: sData } = await supabase
      .from('local_students')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
    if (sData) setStudents(sData);

    // Qrupları çək
    const { data: gData } = await supabase
      .from('groups')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
    if (gData) setGroups(gData);
  };

  // 3. Şagird Əlavə Etmək
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    const { error } = await supabase.from('local_students').insert([{
      ...newStudent,
      teacher_id: teacher.id
    }]);

    if (!error) {
      alert("Şagird əlavə edildi!");
      setNewStudent({ first_name: "", last_name: "", father_name: "", phone: "", school: "", grade: "", start_date: new Date().toISOString().split('T')[0] });
      fetchData(teacher.id);
    } else {
      alert("Xəta baş verdi: " + error.message);
    }
  };

  // 4. Qrup Yaratmaq
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    const { error } = await supabase.from('groups').insert([{
      ...newGroup,
      teacher_id: teacher.id
    }]);

    if (!error) {
      alert("Qrup yaradıldı!");
      setNewGroup({ name: "", schedule: "" });
      fetchData(teacher.id);
    }
  };

  // 5. Qrupu seçmək və üzvləri gətirmək
  const openGroup = async (group: any) => {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
    setGrades({}); // Qiymətləri sıfırla
  };

  const fetchGroupMembers = async (groupId: number) => {
    // Supabase join query: group_members -> local_students
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        student_id,
        local_students ( * )
      `)
      .eq('group_id', groupId);

    if (data) {
      // Data strukturunu sadələşdiririk
      const formatted = data.map((item: any) => item.local_students);
      setGroupStudents(formatted);
    }
  };

  // 6. Qrupa şagird əlavə etmək
  const addStudentToGroup = async () => {
    if (!studentToAdd || !selectedGroup) return;

    const { error } = await supabase.from('group_members').insert({
      group_id: selectedGroup.id,
      student_id: studentToAdd
    });

    if (!error) {
      alert("Şagird qrupa əlavə olundu!");
      setStudentToAdd("");
      fetchGroupMembers(selectedGroup.id);
    } else {
      alert("Bu şagird artıq qrupda ola bilər.");
    }
  };

  // 7. Bal yazmaq (Bulk Insert)
  const saveGrades = async () => {
    if (!selectedGroup) return;
    
    const updates = Object.entries(grades).map(([studentId, score]) => ({
      group_id: selectedGroup.id,
      student_id: parseInt(studentId),
      grade_date: gradingDate,
      score: parseInt(score)
    }));

    if (updates.length === 0) return;

    const { error } = await supabase.from('daily_grades').insert(updates);

    if (!error) {
      alert("Ballar yadda saxlanıldı! ✅");
      setGrades({});
    } else {
      alert("Xəta: " + error.message);
    }
  };

  const handleLogout = () => {
    document.cookie = "teacher_token=; path=/; max-age=0";
    router.push("/login?type=teacher");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600">Yüklənir...</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-blue-600" />
          Müəllim Kabineti
        </h1>
        <div className="flex items-center gap-4">
            <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                👤 {teacher?.full_name || teacher?.username}
            </span>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium transition text-sm">
            <LogOut size={18} /> Çıxış
            </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* TAB MENYU */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                <Users size={20} /> Dashboard
            </button>
            <button onClick={() => setActiveTab('students')} className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                <GraduationCap size={20} /> Şagird Əlavə Et
            </button>
            <button onClick={() => setActiveTab('groups')} className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${activeTab === 'groups' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                <BookOpen size={20} /> Qruplar & Jurnal
            </button>
        </div>

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
                    <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, {teacher?.username}! 👋</h2>
                    <p className="opacity-90">Bu gün dərslərinizdə uğurlar arzulayırıq.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
                        <div><p className="text-gray-500 text-sm">Ümumi Şagird</p><h3 className="text-2xl font-bold">{students.length}</h3></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><BookOpen size={24} /></div>
                        <div><p className="text-gray-500 text-sm">Aktiv Qruplar</p><h3 className="text-2xl font-bold">{groups.length}</h3></div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><UserCheck size={24} /></div>
                        <div><p className="text-gray-500 text-sm">Bu günkü Dərslər</p><h3 className="text-2xl font-bold">0</h3></div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 2. ŞAGİRDLƏR --- */}
        {activeTab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Yeni Şagird</h3>
                    <form onSubmit={handleAddStudent} className="space-y-4">
                        <input required placeholder="Ad" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.first_name} onChange={e => setNewStudent({...newStudent, first_name: e.target.value})} />
                        <input required placeholder="Soyad" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.last_name} onChange={e => setNewStudent({...newStudent, last_name: e.target.value})} />
                        <input placeholder="Ata adı" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.father_name} onChange={e => setNewStudent({...newStudent, father_name: e.target.value})} />
                        <input placeholder="Telefon" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Məktəb" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.school} onChange={e => setNewStudent({...newStudent, school: e.target.value})} />
                            <input placeholder="Sinif (9a)" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} />
                        </div>
                        <input type="date" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newStudent.start_date} onChange={e => setNewStudent({...newStudent, start_date: e.target.value})} />
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">Əlavə Et</button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-bold mb-4">Şagirdlərin Siyahısı</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-800 font-bold border-b">
                                <tr>
                                    <th className="p-3">Ad Soyad</th>
                                    <th className="p-3">Sinif</th>
                                    <th className="p-3">Məktəb</th>
                                    <th className="p-3">Qeydiyyat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} className="border-b hover:bg-gray-50 transition">
                                        <td className="p-3 font-medium text-gray-800">{s.first_name} {s.last_name} ({s.father_name})</td>
                                        <td className="p-3">{s.grade}</td>
                                        <td className="p-3">{s.school}</td>
                                        <td className="p-3">{s.start_date}</td>
                                    </tr>
                                ))}
                                {students.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-400">Şagird yoxdur</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* --- 3. QRUPLAR VƏ JURNAL --- */}
        {activeTab === 'groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                
                {/* SOL: Qrup Yarat və Siyahı */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Qrup Yarat */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold mb-4">Yeni Qrup</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <input required placeholder="Qrup Adı (Məs: Riyaziyyat 10)" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
                            <input placeholder="Günlər/Saat (B.e 15:00)" className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500" value={newGroup.schedule} onChange={e => setNewGroup({...newGroup, schedule: e.target.value})} />
                            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">Yarat</button>
                        </form>
                    </div>

                    {/* Qrup Listi */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold mb-4">Qruplarım</h3>
                        <div className="space-y-2">
                            {groups.map((g) => (
                                <div 
                                    key={g.id} 
                                    onClick={() => openGroup(g)}
                                    className={`p-4 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedGroup?.id === g.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <h4 className="font-bold text-gray-800">{g.name}</h4>
                                        <p className="text-xs text-gray-500">{g.schedule}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400"/>
                                </div>
                            ))}
                            {groups.length === 0 && <p className="text-center text-gray-400 text-sm">Qrup yoxdur</p>}
                        </div>
                    </div>
                </div>

                {/* SAĞ: Seçilmiş Qrupun İdarəetməsi */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-200 min-h-[500px]">
                    {selectedGroup ? (
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-6 border-b">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedGroup.name}</h2>
                                    <p className="text-gray-500">{selectedGroup.schedule}</p>
                                </div>
                                <div className="flex gap-2">
                                    <select 
                                        className="p-2 border rounded-lg bg-gray-50 text-sm"
                                        value={studentToAdd}
                                        onChange={(e) => setStudentToAdd(e.target.value)}
                                    >
                                        <option value="">Şagird seç...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                        ))}
                                    </select>
                                    <button onClick={addStudentToGroup} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700">
                                        Əlavə Et
                                    </button>
                                </div>
                            </div>

                            {/* Jurnal Hissəsi */}
                            <div className="flex items-center gap-4 mb-4">
                                <h3 className="text-lg font-bold">Jurnal / Qiymətləndirmə</h3>
                                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                                    <Calendar size={18} className="text-gray-500"/>
                                    <input type="date" value={gradingDate} onChange={e => setGradingDate(e.target.value)} className="bg-transparent outline-none text-sm font-medium"/>
                                </div>
                                <button onClick={saveGrades} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                                    <Save size={18}/> Yadda Saxla
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-700 border-b">
                                            <th className="p-3 border">#</th>
                                            <th className="p-3 border w-1/2">Şagird</th>
                                            <th className="p-3 border">Bal (0-100)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupStudents.map((s, index) => (
                                            <tr key={s.id} className="border-b">
                                                <td className="p-3 border text-gray-500">{index + 1}</td>
                                                <td className="p-3 border font-medium">{s.first_name} {s.last_name}</td>
                                                <td className="p-3 border">
                                                    <input 
                                                        type="number" 
                                                        placeholder="Bal"
                                                        className="w-full p-2 bg-blue-50/50 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold text-blue-700"
                                                        value={grades[s.id] || ""}
                                                        onChange={(e) => setGrades({...grades, [s.id]: e.target.value})}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        {groupStudents.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-400">Bu qrupda şagird yoxdur. Yuxarıdan əlavə edin.</td></tr>}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <BookOpen size={48} className="mb-4 opacity-20"/>
                            <p>Detalları görmək üçün soldan bir qrup seçin.</p>
                        </div>
                    )}
                </div>

            </div>
        )}

      </main>
    </div>
  );
}
