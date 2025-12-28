"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx"; // Excel kitabxanası
import { useRouter } from "next/navigation";
import { 
  Users, Settings, Image as ImageIcon, LogOut, Search, Download, 
  Save, Upload, Trash2, RefreshCw, Edit, X, Link as LinkIcon, 
  PlusCircle, ExternalLink, FileText, CheckCircle, AlertCircle, 
  Loader2, Filter, FileImage 
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
  certificate_url?: string; // Yeni sütun
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

  // Sertifikat Yükləmə State-ləri
  const [certExamSelect, setCertExamSelect] = useState("");
  const [certMessage, setCertMessage] = useState("");

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

  // --- İMTAHAN ƏMƏLİYYATLARI ---
  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!newExamName || !newExamUrl || !newExamClass) return alert("Zəhmət olmasa bütün xanaları doldurun.");

    const { error } = await supabase.from("exams").insert({
        name: newExamName,
        url: newExamUrl,
        class_grade: newExamClass 
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

  // --- TƏLƏBƏ ƏMƏLİYYATLARI ---
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

  // --- CSV/EXCEL YÜKLƏMƏ ---
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
            
            const data: any[] = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                setUploadMessage("❌ Fayl boşdur.");
                setUploading(false);
                return;
            }

            const formattedData = data.map((row) => {
                const score = Number(row.EarnedPoints || row.Score || row.Bal || 0);
                const total = Number(row.PossiblePoints || row.Total || 0);
                const percent = total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;

                return {
                    student_id: String(row.StudentID || row.ID || row.StudentId).trim(),
                    quiz: uploadExamSelect,
                    score: score,
                    total: total,
                    percent: percent,
                    correct_count: score,
                    wrong_count: total - score
                };
            }).filter(item => item.student_id && item.student_id !== "undefined");

            const res = await fetch("/api/upload-result", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: formattedData }),
            });

            const result = await res.json();

            if (res.ok) {
                setUploadMessage(`✅ Uğurlu! ${result.processed_count || formattedData.length} nəticə bazaya yazıldı.`);
            } else {
                setUploadMessage(`❌ Xəta: ${result.error}`);
            }

        } catch (err: any) {
            console.error("Yükləmə xətası:", err);
            setUploadMessage(`❌ Xəta: ${err.message}`);
        } finally {
            setUploading(false);
            e.target.value = ""; 
        }
    };

    reader.readAsBinaryString(file);
  }

  // --- SERTİFİKAT ŞABLONU YÜKLƏMƏ (YENİ) ---
  async function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (!certExamSelect) {
        alert("Zəhmət olmasa imtahanı seçin!");
        e.target.value = ""; 
        return;
    }

    setUploading(true);
    setCertMessage("");
    
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `cert_${Date.now()}.${fileExt}`;
      const filePath = `certificates/${fileName}`; // certificates qovluğuna yükləyirik

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("exams")
        .update({ certificate_url: publicUrl })
        .eq("name", certExamSelect);

      if (updateError) throw updateError;

      setCertMessage("✅ Sertifikat şablonu uğurla yükləndi!");
      fetchAllData(); 

    } catch (error: any) {
      console.error("Sertifikat xətası:", error);
      setCertMessage(`❌ Xəta: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // --- DİGƏR ---
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
    const filteredForExport = students.filter(s => {
        const matchesSearch = (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase());
        const matchesExam = filterExam ? s.exam_name === filterExam : true;
        return matchesSearch && matchesExam;
    });

    const rows = filteredForExport.map((s) => ({
      ID: s.exam_id,
      İmtahan: s.exam_name || "-",
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
            <button onClick={() => setActiveTab("results")} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "results" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <FileText size={20} /> <span className="hidden md:block">Nəticələri Yüklə</span>
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
          
          {/* TAB: STUDENTS */}
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full md:h-auto">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users size={24} className="text-amber-500" />
                    Qeydiyyat Siyahısı
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                      Göstərilir: {students.filter(s => (!filterExam || s.exam_name === filterExam)).length} / {students.length} tələbə
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                        value={filterExam}
                        onChange={(e) => setFilterExam(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-500 bg-white w-full md:w-48 appearance-none cursor-pointer"
                    >
                        <option value="">Bütün İmtahanlar</option>
                        {Array.from(new Set(exams.map(e => e.name))).map((name, i) => (
                            <option key={i} value={name}>{name}</option>
                        ))}
                    </select>
                  </div>

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
                      <th className="p-4">İmtahan</th>
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
                    {students
                        .filter(s => {
                            const matchesSearch = (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase());
                            const matchesExam = filterExam ? s.exam_name === filterExam : true;
                            return matchesSearch && matchesExam;
                        })
                        .map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-blue-600 font-bold">{s.exam_id}</td>
                        <td className="p-4 font-medium text-gray-800">
                            {s.exam_name ? (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">
                                    {s.exam_name}
                                </span>
                            ) : "-"}
                        </td>
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
                      <tr><td colSpan={9} className="p-8 text-center text-gray-400">Heç bir məlumat tapılmadı</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: EXAMS */}
          {activeTab === "exams" && (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <PlusCircle className="text-amber-500" /> Yeni İmtahan Linki Yarat
                    </h2>
                    <form onSubmit={addExam} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Sinif</label>
                            <select 
                                value={newExamClass}
                                onChange={(e) => setNewExamClass(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                            >
                                <option value="1">1-ci Sinif</option>
                                <option value="2">2-ci Sinif</option>
                                <option value="3">3-cü Sinif</option>
                                <option value="4">4-cü Sinif</option>
                                <option value="5">5-ci Sinif</option>
                                <option value="6">6-cı Sinif</option>
                                <option value="7">7-ci Sinif</option>
                                <option value="8">8-ci Sinif</option>
                                <option value="9">9-cu Sinif</option>
                                <option value="10">10-cu Sinif</option>
                                <option value="11">11-ci Sinif</option>
                                <option value="Müəllimlər">Müəllimlər</option>
                            </select>
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">İmtahan Adı</label>
                            <input 
                                placeholder="Məs: Blok İmtahanı"
                                value={newExamName}
                                onChange={(e) => setNewExamName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Link (URL)</label>
                            <input 
                                placeholder="https://..."
                                value={newExamUrl}
                                onChange={(e) => setNewExamUrl(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                        </div>
                        <div className="col-span-1">
                            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold transition flex justify-center items-center gap-2">
                                <Save size={18} /> Əlavə et
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LinkIcon className="text-blue-600" /> Aktiv İmtahanlar
                    </h2>
                    <div className="space-y-4">
                        {exams.map((exam) => (
                            <div key={exam.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-md border border-blue-200">
                                            {exam.class_grade}-ci sinif
                                        </span>
                                        <h3 className="font-bold text-gray-800">{exam.name}</h3>
                                    </div>
                                    <a href={exam.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline flex items-center gap-1 break-all">
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

          {/* TAB: RESULTS (YENİLƏNDİ - SERTİFİKAT YÜKLƏMƏ İLƏ) */}
          {activeTab === "results" && (
             <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. CSV YÜKLƏMƏ BLOKU */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                            <FileText size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">1. Nəticələri Yüklə</h2>
                        <p className="text-sm text-gray-500">ZipGrade Excel (.csv, .xlsx) faylını yükləyin</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <select 
                                value={uploadExamSelect}
                                onChange={(e) => setUploadExamSelect(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                            >
                                <option value="">İmtahan Seçin...</option>
                                {Array.from(new Set(exams.map(e => e.name))).map((examName, idx) => (
                                    <option key={idx} value={examName}>{examName}</option>
                                ))}
                            </select>
                        </div>

                        <div className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition relative ${!uploadExamSelect ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input 
                                type="file" 
                                accept=".csv, .xlsx, .xls" 
                                onChange={handleResultUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading || !uploadExamSelect}
                            />
                            
                            {uploading && !certMessage ? (
                                <div className="flex flex-col items-center text-amber-500">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <span className="font-medium">Emal edilir...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <Upload className="mb-2" size={32} />
                                    <span className="font-medium">Excel faylını bura atın</span>
                                    <span className="text-xs text-gray-400 mt-1">və ya seçmək üçün toxunun</span>
                                </div>
                            )}
                        </div>

                        {uploadMessage && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${uploadMessage.includes("Uğurlu") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                {uploadMessage.includes("Uğurlu") ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                                {uploadMessage}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. SERTİFİKAT ŞABLONU YÜKLƏMƏ BLOKU */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600">
                            <FileImage size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">2. Sertifikat Şablonu</h2>
                        <p className="text-sm text-gray-500">Bu imtahan üçün boş şablon (.jpg, .png) yükləyin</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <select 
                                value={certExamSelect}
                                onChange={(e) => setCertExamSelect(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-gray-50"
                            >
                                <option value="">İmtahan Seçin...</option>
                                {Array.from(new Set(exams.map(e => e.name))).map((examName, idx) => (
                                    <option key={idx} value={examName}>{examName}</option>
                                ))}
                            </select>
                        </div>

                        <div className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition relative ${!certExamSelect ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleCertificateUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading || !certExamSelect}
                            />
                            
                            {uploading && !uploadMessage ? (
                                <div className="flex flex-col items-center text-purple-500">
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <span className="font-medium">Yüklənir...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-500">
                                    <ImageIcon className="mb-2" size={32} />
                                    <span className="font-medium">Şəkil faylını bura atın</span>
                                    <span className="text-xs text-gray-400 mt-1">və ya seçmək üçün toxunun</span>
                                </div>
                            )}
                        </div>

                        {certMessage && (
                            <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${certMessage.includes("uğurlu") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                                {certMessage.includes("uğurlu") ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                                {certMessage}
                            </div>
                        )}
                    </div>
                </div>

             </div>
          )}

          {/* TAB: SETTINGS (QAYTARILDI) */}
          {activeTab === "settings" && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings size={24} className="text-amber-500" /> Digər Tənzimləmələr
              </h2>
              <div className="space-y-6">
                {settings
                  // FİLTR: "Sinif" sözü olanları gizlət
                  .filter(item => !item.label.includes("Sinif"))
                  .map((item) => (
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

          {/* TAB: GALLERY (QAYTARILDI) */}
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
