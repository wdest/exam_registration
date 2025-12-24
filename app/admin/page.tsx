"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Settings, 
  Image as ImageIcon, 
  LogOut, 
  Search, 
  Download, 
  Save, 
  Upload, 
  Trash2,
  RefreshCw,
  Edit,
  X,
  Link as LinkIcon, // Link ikonu əlavə edildi
  PlusCircle,
  ExternalLink
} from "lucide-react";

// --- SUPABASE SETUP ---
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

// YENİ: İmtahan Tipi
interface Exam {
  id: number;
  name: string;
  url: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("students");
  const [loading, setLoading] = useState(false);
  
  // Data State-ləri
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]); // YENİ: İmtahanlar siyahısı
  
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  // Yeni İmtahan Əlavə Etmə State-ləri
  const [newExamName, setNewExamName] = useState("");
  const [newExamUrl, setNewExamUrl] = useState("");

  // --- EDIT MODAL STATE ---
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      // 1. Tənzimləmələr
      const { data: setData } = await supabase.from("settings").select("*").order("id", { ascending: true });
      if (setData) setSettings(setData as any);

      // 2. Tələbələr
      const { data: stData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (stData) setStudents(stData as any);

      // 3. Qalereya
      const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (galData) setGallery(galData as any);

      // 4. İmtahanlar (YENİ)
      const { data: examData } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
      if (examData) setExams(examData as any);

    } catch (error) {
      console.error("Data yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // --- İMTAHAN ƏMƏLİYYATLARI (YENİ) ---
  // =========================

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!newExamName || !newExamUrl) return alert("Zəhmət olmasa həm adı, həm də linki daxil edin.");

    const { error } = await supabase.from("exams").insert({
        name: newExamName,
        url: newExamUrl
    });

    if (error) {
        alert("Xəta: " + error.message);
    } else {
        alert("İmtahan linki əlavə olundu! ✅");
        setNewExamName("");
        setNewExamUrl("");
        fetchAllData();
    }
  }

  async function deleteExam(id: number) {
    if(!confirm("Bu imtahan linkini silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (!error) fetchAllData();
  }

  // =========================
  // --- TƏLƏBƏ ƏMƏLİYYATLARI ---
  // =========================

  async function deleteStudent(id: number) {
    if(!confirm("Bu tələbəni silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) alert("Xəta: " + error.message);
    else fetchAllData();
  }

  function handleEditClick(student: Student) {
    setEditingStudent(student);
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;

    const { error } = await supabase
      .from("students")
      .update({
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        parent_name: editingStudent.parent_name,
        class: editingStudent.class,
        phone1: editingStudent.phone1,
        phone2: editingStudent.phone2,
        exam_id: editingStudent.exam_id
      })
      .eq("id", editingStudent.id);

    if (error) {
      alert("Xəta: " + error.message);
    } else {
      alert("Tələbə məlumatları yeniləndi! ✅");
      setEditingStudent(null);
      fetchAllData();
    }
  }

  // =========================
  // --- DİGƏR FUNKSİYALAR ---
  // =========================

  async function updateSetting(key: string, newValue: string) {
    const { error } = await supabase.from("settings").update({ value: newValue }).eq("key", key);
    if (!error) {
      alert("Məlumat yeniləndi! ✅");
      fetchAllData();
    } else {
      alert("Xəta: " + error.message);
    }
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
      alert("Şəkil yükləndi!");
      fetchAllData();
    } catch (error: any) {
      alert("Xəta: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(id: number, imageUrl: string) {
    if(!confirm("Silmək istədiyinizə əminsiniz?")) return;
    const fileName = imageUrl.split("/").pop(); 
    if (fileName) await supabase.storage.from("images").remove([fileName]);
    await supabase.from("gallery").delete().eq("id", id);
    fetchAllData();
  }

  function exportExcel() {
    const rows = students.map((s) => ({
      ID: s.exam_id,
      Ad: s.first_name,
      Soyad: s.last_name,
      Valideyn: s.parent_name,
      Sinif: s.class,
      Telefon1: s.phone1,
      Telefon2: s.phone2,
      Tarix: s.created_at,
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
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">A</div>
           <h1 className="text-xl md:text-2xl font-bold text-gray-800">MOC Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => fetchAllData()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" title="Yenilə">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 font-medium text-sm hover:bg-red-50 px-3 py-2 rounded-lg transition">
            <LogOut size={18} />
            <span className="hidden md:inline">Çıxış</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col pt-4 pb-4">
          <nav className="space-y-2 px-2 md:px-4">
            <button onClick={() => setActiveTab("students")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "students" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Users size={20} /> <span className="hidden md:block">Tələbələr</span>
            </button>
            <button onClick={() => setActiveTab("exams")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "exams" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <LinkIcon size={20} /> <span className="hidden md:block">İmtahan Linkləri</span>
            </button>
            <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "settings" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Settings size={20} /> <span className="hidden md:block">Tənzimləmələr</span>
            </button>
            <button onClick={() => setActiveTab("gallery")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "gallery" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <ImageIcon size={20} /> <span className="hidden md:block">Qalereya</span>
            </button>
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
          
          {/* TAB: TƏLƏBƏLƏR */}
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full md:h-auto">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users size={24} className="text-amber-500" />
                    Qeydiyyat Siyahısı
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Ümumi: {students.length} tələbə</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      placeholder="Axtarış..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-500 w-full md:w-64"
                    />
                  </div>
                  <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm">
                    <Download size={18} /> Excel
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 min-w-[900px]">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                    <tr>
                      <th className="p-4">Exam ID</th>
                      <th className="p-4">Ad Soyad</th>
                      <th className="p-4">Valideyn</th>
                      <th className="p-4">Sinif</th>
                      <th className="p-4">Telefon 1</th>
                      <th className="p-4">Telefon 2</th>
                      <th className="p-4">Tarix</th>
                      <th className="p-4 text-center">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.filter(s => (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase())).map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-blue-600 font-bold">{s.exam_id}</td>
                        <td className="p-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                        <td className="p-4 text-gray-500">{s.parent_name || "-"}</td>
                        <td className="p-4"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">{s.class}</span></td>
                        <td className="p-4">{s.phone1}</td>
                        <td className="p-4 text-gray-500">{s.phone2 || "-"}</td>
                        <td className="p-4 text-gray-400 text-xs">{s.created_at ? new Date(s.created_at).toLocaleDateString("az-AZ") : "-"}</td>
                        <td className="p-4 flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(s)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                            title="Redaktə et"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => deleteStudent(s.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={8} className="p-8 text-center text-gray-400">Heç bir məlumat tapılmadı</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: İMTAHAN LİNKLƏRİ (YENİ) */}
          {activeTab === "exams" && (
            <div className="max-w-4xl mx-auto space-y-8">
                {/* YENİ İMTAHAN ƏLAVƏ ET */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <PlusCircle className="text-amber-500" /> Yeni İmtahan Linki Yarat
                    </h2>
                    <form onSubmit={addExam} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-gray-700 mb-1">İmtahan Adı / Başlıq</label>
                            <input 
                                placeholder="Məs: 5-ci Sinif Sınaq İmtahanı"
                                value={newExamName}
                                onChange={(e) => setNewExamName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-gray-700 mb-1">İmtahan Linki (URL)</label>
                            <input 
                                placeholder="https://..."
                                value={newExamUrl}
                                onChange={(e) => setNewExamUrl(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2">
                            <Save size={18} /> Əlavə et
                        </button>
                    </form>
                </div>

                {/* MÖVCUD İMTAHANLAR */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                     <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LinkIcon className="text-blue-600" /> Aktiv İmtahanlar
                    </h2>
                    <div className="space-y-4">
                        {exams.map((exam) => (
                            <div key={exam.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition gap-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800">{exam.name}</h3>
                                    <a href={exam.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline flex items-center gap-1 mt-1 break-all">
                                        <ExternalLink size={14} /> {exam.url}
                                    </a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => deleteExam(exam.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition" title="Sil">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {exams.length === 0 && (
                            <p className="text-center text-gray-400 py-4">Hələ heç bir imtahan linki əlavə edilməyib.</p>
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* TAB: TƏNZİMLƏMƏLƏR (SETTINGS) */}
          {activeTab === "settings" && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings size={24} className="text-amber-500" /> Digər Tənzimləmələr
              </h2>
              <div className="space-y-6">
                {settings.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{item.label}</label>
                    <div className="flex gap-3">
                      <input 
                        id={`input-${item.key}`} 
                        defaultValue={item.value} 
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <button 
                         onClick={() => {
                            const val = (document.getElementById(`input-${item.key}`) as HTMLInputElement).value;
                            updateSetting(item.key, val);
                         }}
                         className="flex items-center gap-2 bg-blue-600 text-white px-5 rounded-lg font-medium hover:bg-blue-700 transition"
                      >
                        <Save size={18} /> Yadda saxla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: QALEREYA */}
          {activeTab === "gallery" && (
             <div className="space-y-8 max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2"><ImageIcon size={22} className="text-amber-500" /> Qalereya</h2>
                  <label className={`cursor-pointer flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg ${uploading ? 'opacity-70' : ''}`}>
                    {uploading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
                    {uploading ? "Yüklənir..." : "Yeni Şəkil"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-md bg-white border border-gray-100 aspect-square">
                      <img src={img.image_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <button onClick={() => deleteImage(img.id, img.image_url)} className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition shadow-xl hover:scale-110">
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

        </main>
      </div>

      {/* --- MODAL: EDIT STUDENT --- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit size={24} className="text-blue-600" /> Tələbəni Redaktə Et
              </h2>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                  <input 
                    value={editingStudent.first_name}
                    onChange={(e) => setEditingStudent({...editingStudent, first_name: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                  <input 
                    value={editingStudent.last_name}
                    onChange={(e) => setEditingStudent({...editingStudent, last_name: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Ata adı (Valideyn)</label>
                 <input 
                   value={editingStudent.parent_name || ""}
                   onChange={(e) => setEditingStudent({...editingStudent, parent_name: e.target.value})}
                   className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sinif</label>
                  <input 
                    value={editingStudent.class}
                    onChange={(e) => setEditingStudent({...editingStudent, class: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam ID</label>
                  <input 
                    value={editingStudent.exam_id}
                    onChange={(e) => setEditingStudent({...editingStudent, exam_id: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Telefon 1</label>
                   <input 
                     value={editingStudent.phone1}
                     onChange={(e) => setEditingStudent({...editingStudent, phone1: e.target.value})}
                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                     required
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Telefon 2</label>
                   <input 
                     value={editingStudent.phone2 || ""}
                     onChange={(e) => setEditingStudent({...editingStudent, phone2: e.target.value})}
                     className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition">
                  Ləğv et
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                  Yadda saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
