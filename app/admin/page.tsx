"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx"; // Excel oxumaq üçün
import { useRouter } from "next/navigation";
import { 
  Users, Settings, Image as ImageIcon, LogOut, Search, Download, 
  Save, Upload, Trash2, RefreshCw, Edit, X, Link as LinkIcon, 
  PlusCircle, ExternalLink, FileText, CheckCircle, AlertCircle, 
  Loader2, Filter 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- TİPLƏR ---
interface Student {
  id: number;
  exam_id: string;
  first_name: string;
  last_name: string;
  parent_name: string;
  class: string;
  phone1: string;
  phone2: string;
  exam_name?: string;
  created_at?: string;
}

interface Setting {
  id: number;
  key: string;
  value: string;
  label: string;
}

interface GalleryItem {
  id: number;
  image_url: string;
}

interface Exam {
  id: number;
  name: string;
  url: string;
  class_grade: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]); 
  
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState(""); 

  const [uploading, setUploading] = useState(false);

  // İmtahan State-ləri
  const [newExamName, setNewExamName] = useState("");
  const [newExamUrl, setNewExamUrl] = useState("");
  const [newExamClass, setNewExamClass] = useState("1");

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Nəticə Yükləmə State-ləri
  const [uploadExamSelect, setUploadExamSelect] = useState(""); 
  const [uploadMessage, setUploadMessage] = useState(""); 

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const { data: setData } = await supabase.from("settings").select("*").order("id", { ascending: true });
      if (setData) setSettings(setData as any);

      const { data: stData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (stData) setStudents(stData as any);

      const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (galData) setGallery(galData as any);

      const { data: examData } = await supabase.from("exams").select("*").order("class_grade", { ascending: true });
      if (examData) setExams(examData as any);

    } catch (error) {
      console.error("Data yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- CSV/EXCEL PARSING (YENİLƏNƏN HİSSƏ) ---
  async function handleResultUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (!uploadExamSelect) {
        alert("Zəhmət olmasa əvvəlcə siyahıdan imtahanı seçin!");
        e.target.value = ""; 
        return;
    }

    setUploading(true);
    setUploadMessage("");
    const file = e.target.files[0];

    const reader = new FileReader();
    
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            // Excel-i JSON-a çeviririk
            const jsonData: any[] = XLSX.utils.sheet_to_json(ws);

            if (jsonData.length === 0) {
                setUploadMessage("❌ Fayl boşdur.");
                setUploading(false);
                return;
            }

            // Sizin Excel sütunlarınıza uyğun mapping (image_91c34c.png əsasən)
            const cleanData = jsonData.map((row) => {
                const score = Number(row.EarnedPoints || 0);
                const total = Number(row.PossiblePoints || 0);
                // Faizi özümüz hesablayırıq ki, dəqiq olsun
                const percent = total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;

                return {
                    student_id: String(row.StudentID).trim(), // Excel: StudentID
                    quiz: uploadExamSelect, // Dropdowndan seçilən imtahan adı
                    score: score, // Excel: EarnedPoints
                    total: total, // Excel: PossiblePoints
                    percent: percent, // Hesablanan faiz
                    correct_count: score, // Düzgün cavab sayı (təxmini bal ilə eyni)
                    wrong_count: total - score // Səhv sayı
                };
            }).filter(item => item.student_id && item.student_id !== "undefined");

            // Hazır datanı API-yə göndəririk
            const res = await fetch("/api/upload-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: cleanData }),
            });

            const result = await res.json();

            if (res.ok) {
                setUploadMessage(`✅ Uğurlu! ${result.processed_count} nəticə bazaya yazıldı.`);
            } else {
                setUploadMessage(`❌ Xəta: ${result.error}`);
            }

        } catch (err: any) {
            console.error("Yükləmə xətası:", err);
            setUploadMessage(`❌ Fayl xətası: ${err.message}`);
        } finally {
            setUploading(false);
            e.target.value = ""; 
        }
    };

    reader.readAsBinaryString(file);
  }

  // --- DİGƏR FUNKSİYALAR (Standart) ---
  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!newExamName || !newExamUrl || !newExamClass) return alert("Zəhmət olmasa bütün xanaları doldurun.");
    const { error } = await supabase.from("exams").insert({ name: newExamName, url: newExamUrl, class_grade: newExamClass });
    if (error) alert("Xəta: " + error.message);
    else { alert("İmtahan linki əlavə olundu! ✅"); setNewExamName(""); setNewExamUrl(""); fetchAllData(); }
  }

  async function deleteExam(id: number) {
    if(!confirm("Silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (!error) fetchAllData();
  }

  async function deleteStudent(id: number) {
    if(!confirm("Bu tələbəni silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) alert("Xəta: " + error.message);
    else fetchAllData();
  }

  function handleEditClick(student: Student) { setEditingStudent(student); }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    const { error } = await supabase.from("students").update({
        first_name: editingStudent.first_name, last_name: editingStudent.last_name,
        parent_name: editingStudent.parent_name, class: editingStudent.class,
        phone1: editingStudent.phone1, phone2: editingStudent.phone2, exam_id: editingStudent.exam_id
      }).eq("id", editingStudent.id);
    if (error) alert("Xəta: " + error.message);
    else { alert("Məlumat yeniləndi! ✅"); setEditingStudent(null); fetchAllData(); }
  }

  async function updateSetting(key: string, newValue: string) {
    const { error } = await supabase.from("settings").update({ value: newValue }).eq("key", key);
    if (!error) { alert("Yeniləndi! ✅"); fetchAllData(); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileName = `${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(fileName);
      await supabase.from("gallery").insert({ image_url: publicUrl });
      alert("Yükləndi!"); fetchAllData();
    } catch (error: any) { alert("Xəta: " + error.message); } finally { setUploading(false); }
  }

  async function deleteImage(id: number, imageUrl: string) {
    if(!confirm("Silmək istədiyinizə əminsiniz?")) return;
    const fileName = imageUrl.split("/").pop(); 
    if (fileName) await supabase.storage.from("images").remove([fileName]);
    await supabase.from("gallery").delete().eq("id", id);
    fetchAllData();
  }

  function exportExcel() {
    const filteredForExport = students.filter(s => {
        const matchesSearch = (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase());
        const matchesExam = filterExam ? s.exam_name === filterExam : true;
        return matchesSearch && matchesExam;
    });
    const rows = filteredForExport.map((s) => ({
      ID: s.exam_id, İmtahan: s.exam_name || "-", Ad: s.first_name, Soyad: s.last_name,
      Valideyn: s.parent_name, Sinif: s.class, Telefon1: s.phone1, Telefon2: s.phone2, Tarix: s.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Telebeler.xlsx");
  }

  function logout() {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2"><div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">A</div><h1 className="text-xl md:text-2xl font-bold text-gray-800">MOC Admin</h1></div>
        <div className="flex items-center gap-4">
          <button onClick={() => fetchAllData()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 font-medium text-sm hover:bg-red-50 px-3 py-2 rounded-lg transition"><LogOut size={18} /><span className="hidden md:inline">Çıxış</span></button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col pt-4 pb-4">
          <nav className="space-y-2 px-2 md:px-4">
            <button onClick={() => setActiveTab("students")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "students" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}><Users size={20} /> <span className="hidden md:block">Tələbələr</span></button>
            <button onClick={() => setActiveTab("exams")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "exams" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}><LinkIcon size={20} /> <span className="hidden md:block">İmtahanlar</span></button>
            <button onClick={() => setActiveTab("results")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "results" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}><FileText size={20} /> <span className="hidden md:block">Nəticələr</span></button>
            <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "settings" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}><Settings size={20} /> <span className="hidden md:block">Tənzimləmələr</span></button>
            <button onClick={() => setActiveTab("gallery")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "gallery" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}><ImageIcon size={20} /> <span className="hidden md:block">Qalereya</span></button>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full md:h-auto">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                <div><h2 className="text-xl font-bold flex items-center gap-2"><Users size={24} className="text-amber-500" /> Siyahı</h2><p className="text-gray-500 text-sm mt-1">{students.filter(s => (!filterExam || s.exam_name === filterExam)).length} / {students.length} tələbə</p></div>
                <div className="flex flex-col md:flex-row gap-3">
                  <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)} className="pl-4 pr-8 py-2 border rounded-lg text-sm outline-none"><option value="">Bütün İmtahanlar</option>{Array.from(new Set(exams.map(e => e.name))).map((name, i) => (<option key={i} value={name}>{name}</option>))}</select>
                  <input placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-4 pr-4 py-2 border rounded-lg text-sm outline-none w-full md:w-64" />
                  <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition"><Download size={18} /> Excel</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 min-w-[900px]">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs"><tr><th className="p-4">Exam ID</th><th className="p-4">İmtahan</th><th className="p-4">Ad Soyad</th><th className="p-4">Sinif</th><th className="p-4">Telefon</th><th className="p-4 text-center">Əməliyyat</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.filter(s => { const matchesSearch = (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase()); const matchesExam = filterExam ? s.exam_name === filterExam : true; return matchesSearch && matchesExam; }).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition"><td className="p-4 font-mono text-blue-600 font-bold">{s.exam_id}</td><td className="p-4">{s.exam_name || "-"}</td><td className="p-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td><td className="p-4"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">{s.class}</span></td><td className="p-4">{s.phone1}</td><td className="p-4 flex justify-center gap-2"><button onClick={() => handleEditClick(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={16} /></button><button onClick={() => deleteStudent(s.id)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16} /></button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "results" && (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-lg mx-auto mt-8">
                <div className="text-center mb-8"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><FileText size={32} /></div><h2 className="text-2xl font-bold text-gray-800">Nəticələri Yüklə</h2><p className="text-gray-500 mt-2">ZipGrade Excel (.csv, .xlsx) faylını yükləyin.</p></div>
                <div className="space-y-6">
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">Hansı imtahan?</label><select value={uploadExamSelect} onChange={(e) => setUploadExamSelect(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"><option value="">Seçin...</option>{Array.from(new Set(exams.map(e => e.name))).map((examName, idx) => (<option key={idx} value={examName}>{examName}</option>))}</select></div>
                    <div className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition relative ${!uploadExamSelect ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleResultUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploading || !uploadExamSelect} />
                        {uploading ? <div className="flex flex-col items-center text-amber-500"><Loader2 className="animate-spin mb-2" size={32} /><span className="font-medium">Emal edilir...</span></div> : <div className="flex flex-col items-center text-gray-500"><Upload className="mb-2" size={32} /><span className="font-medium">Excel faylını bura atın</span></div>}
                    </div>
                    {uploadMessage && <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${uploadMessage.includes("Uğurlu") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>{uploadMessage.includes("Uğurlu") ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}{uploadMessage}</div>}
                </div>
             </div>
          )}

          {activeTab === "exams" && (<div className="text-center p-10 text-gray-500">İmtahan Linkləri Paneli (Kodları yuxarıdakı kimi saxla)</div>)}
          {activeTab === "settings" && (<div className="text-center p-10 text-gray-500">Tənzimləmələr Paneli</div>)}
          {activeTab === "gallery" && (<div className="text-center p-10 text-gray-500">Qalereya Paneli</div>)}
        </main>
      </div>
      
      {/* Edit Modal (Eyni saxla) */}
      {editingStudent && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white p-6 rounded-2xl w-96"><h2 className="text-xl font-bold mb-4">Redaktə</h2><button onClick={() => setEditingStudent(null)} className="absolute top-4 right-4 text-gray-500"><X/></button><form onSubmit={handleSaveStudent}><input className="w-full border p-2 mb-2 rounded" value={editingStudent.first_name} onChange={e=>setEditingStudent({...editingStudent, first_name:e.target.value})} /><input className="w-full border p-2 mb-2 rounded" value={editingStudent.last_name} onChange={e=>setEditingStudent({...editingStudent, last_name:e.target.value})} /><button className="w-full bg-blue-600 text-white p-2 rounded">Yadda saxla</button></form></div></div>)}
    </div>
  );
}
