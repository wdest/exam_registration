"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx"; 
import { useRouter } from "next/navigation";
import { 
  Users, Settings, Image as ImageIcon, LogOut, Search, Download, 
  Save, Upload, Trash2, RefreshCw, Edit, X, Link as LinkIcon, 
  PlusCircle, ExternalLink, FileText, CheckCircle, AlertCircle, 
  Loader2, Filter, DollarSign, Lock 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface SiteSetting {
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
  certificate_url?: string;
  is_paid: boolean;
  price: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students");
   
  const [students, setStudents] = useState<Student[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]); 
   
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [uploading, setUploading] = useState(false);

  const [newExamName, setNewExamName] = useState("");
  const [newExamUrl, setNewExamUrl] = useState("");
  const [newExamClass, setNewExamClass] = useState("1");
  const [isPaid, setIsPaid] = useState(false); 
  const [examPrice, setExamPrice] = useState("0");

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [uploadExamSelect, setUploadExamSelect] = useState(""); 
  const [uploadMessage, setUploadMessage] = useState(""); 
  const [certExamSelect, setCertExamSelect] = useState("");
  const [certMessage, setCertMessage] = useState("");

  // 🔥 DÜZƏLİŞ BURDADIR:
  // O səhv yoxlamanı sildim. Middleware buraxıbsa, deməli icazən var.
  // Sadəcə datanı çəkirik.
  useEffect(() => {
     fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const { data: setData } = await supabase.from("settings").select("*").order("id", { ascending: true });
      if (setData) setSiteSettings(setData as any);

      const { data: stData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (stData) setStudents(stData as any);

      const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (galData) setGallery(galData as any);

      const { data: examData } = await supabase.from("exams").select("*").order("created_at", { ascending: false });
      if (examData) setExams(examData as any);

    } catch (error) {
      console.error("Data xətası:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- SERVER ACTIONLARI ---
  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!newExamName || !newExamUrl || !newExamClass) return alert("Bütün xanaları doldurun.");

    const res = await fetch("/api/admin-action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "insert", table: "exams",
            data: {
                name: newExamName, url: newExamUrl, class_grade: newExamClass,
                is_paid: isPaid, price: isPaid ? parseFloat(examPrice) : 0
            }
        })
    });

    if (res.ok) {
        alert("İmtahan yaradıldı! ✅");
        setNewExamName(""); setNewExamUrl(""); setIsPaid(false); setExamPrice("0");
        fetchAllData();
    } else { alert("Xəta!"); }
  }

  async function deleteExam(id: number) {
    if(!confirm("Silmək istəyirsiniz?")) return;
    const res = await fetch("/api/admin-action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", table: "exams", id: id })
    });
    if (res.ok) fetchAllData(); else alert("Xəta!");
  }

  async function deleteStudent(id: number) {
    if(!confirm("Tələbəni silmək istəyirsiniz?")) return;
    const res = await fetch("/api/admin-action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", table: "students", id: id })
    });
    if (res.ok) fetchAllData(); else alert("Xəta!");
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    const res = await fetch("/api/admin-action", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "update", table: "students", id: editingStudent.id,
            data: {
                first_name: editingStudent.first_name, last_name: editingStudent.last_name,
                parent_name: editingStudent.parent_name, class: editingStudent.class,
                phone1: editingStudent.phone1, phone2: editingStudent.phone2,
                exam_id: editingStudent.exam_id
            }
        })
    });
    if (res.ok) { setEditingStudent(null); fetchAllData(); } else { alert("Xəta!"); }
  }

  async function updateSetting(key: string, val: string) {
      const settingItem = siteSettings.find(s => s.key === key);
      if(settingItem) {
          const res = await fetch("/api/admin-action", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update", table: "settings", id: settingItem.id, data: { value: val } })
          });
          if(res.ok) alert("Yadda saxlandı!"); else alert("Xəta!");
      }
  }

  function exportExcel() {
    const filteredForExport = students.filter(s => {
        const matchesSearch = (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase());
        const matchesExam = filterExam ? s.exam_name === filterExam : true;
        return matchesSearch && matchesExam;
    });
    const rows = filteredForExport.map((s) => ({
      ID: s.exam_id, İmtahan: s.exam_name || "-", Ad: s.first_name, Soyad: s.last_name,
      Valideyn: s.parent_name, Sinif: s.class, Tel1: s.phone1, Tel2: s.phone2, Tarix: s.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Telebeler.xlsx");
  }

  async function handleResultUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    if (!uploadExamSelect) { alert("İmtahan seçin!"); e.target.value=""; return;}
    setUploading(true); setUploadMessage("");
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            const formattedData = data.map((row) => ({
                student_id: String(row.StudentID || row.ID || row.StudentId).trim(),
                quiz: uploadExamSelect,
                score: Number(row.EarnedPoints || row.Score || row.Bal || 0),
                total: Number(row.PossiblePoints || row.Total || 0),
                percent: Number(((Number(row.EarnedPoints||0)/Number(row.PossiblePoints||1))*100).toFixed(2)),
                correct_count: Number(row.EarnedPoints || 0),
                wrong_count: Number(row.PossiblePoints || 0) - Number(row.EarnedPoints || 0)
            })).filter(i => i.student_id);
            await fetch("/api/upload-result", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ data: formattedData }) });
            setUploadMessage("✅ Nəticələr yükləndi!");
        } catch (err:any) { setUploadMessage("❌ Xəta: " + err.message); }
        finally { setUploading(false); e.target.value=""; }
    };
    reader.readAsBinaryString(file);
  }

  async function handleCertificateUpload(e: React.ChangeEvent<HTMLInputElement>) {
     if (!e.target.files?.length || !certExamSelect) return alert("İmtahan seçin!");
     setUploading(true);
     try {
        const file = e.target.files[0];
        const path = `certificates/cert_${Date.now()}.${file.name.split('.').pop()}`;
        await supabase.storage.from("images").upload(path, file);
        const {data:{publicUrl}} = supabase.storage.from("images").getPublicUrl(path);
        await supabase.from("exams").update({certificate_url:publicUrl}).eq("name", certExamSelect);
        setCertMessage("✅ Sertifikat yükləndi!");
     } catch (err:any) { setCertMessage("❌ "+err.message); }
     finally { setUploading(false); e.target.value=""; }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
     if (!e.target.files?.length) return;
     setUploading(true);
     try {
        const file = e.target.files[0];
        const path = `${Date.now()}.${file.name.split('.').pop()}`;
        await supabase.storage.from("images").upload(path, file);
        const {data:{publicUrl}} = supabase.storage.from("images").getPublicUrl(path);
        await fetch("/api/admin-action", {
            method: "POST", headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ action: "insert", table: "gallery", data: { image_url: publicUrl } })
        });
        fetchAllData();
     } catch(e) { alert("Xəta"); } finally { setUploading(false); }
  }

  async function deleteImage(id: number, url: string) {
      if(!confirm("Silinsin?")) return;
      await supabase.storage.from("images").remove([url.split("/").pop()!]);
      await fetch("/api/admin-action", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ action: "delete", table: "gallery", id: id })
      });
      fetchAllData();
  }

  // Logout funksiyası (Sadə redirect)
  function logout() {
    router.push("/"); 
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-amber-500" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
       
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="bg-amber-500 text-white p-2 rounded-lg"><Lock size={20}/></div>
           <h1 className="text-xl font-bold text-gray-800">Admin Panel <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">Secure</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAllData} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><RefreshCw size={20}/></button>
          <button onClick={logout} className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-bold transition">
            <LogOut size={18} /> Çıxış
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-4 space-y-2 hidden md:flex">
            {['students','exams','results','settings','gallery'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} 
                    className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center gap-3 capitalize
                    ${activeTab===tab ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-100" : "text-gray-500 hover:bg-gray-50"}`}>
                    {tab === 'students' && <Users size={20}/>}
                    {tab === 'exams' && <LinkIcon size={20}/>}
                    {tab === 'results' && <FileText size={20}/>}
                    {tab === 'settings' && <Settings size={20}/>}
                    {tab === 'gallery' && <ImageIcon size={20}/>}
                    {tab === 'students' ? 'Tələbələr' : tab === 'exams' ? 'İmtahanlar' : tab === 'results' ? 'Nəticələr' : tab === 'settings' ? 'Tənzimləmə' : 'Qalereya'}
                </button>
            ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto">
           
          {/* 1. TƏLƏBƏLƏR - FULL DATA */}
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
               <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
                  <h2 className="font-bold text-lg flex gap-2"><Users className="text-amber-500"/> Qeydiyyat Siyahısı</h2>
                  <div className="flex flex-wrap gap-2">
                      <div className="relative">
                         <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                         <select 
                            value={filterExam}
                            onChange={(e) => setFilterExam(e.target.value)}
                            className="pl-9 pr-8 py-2 border rounded-xl text-sm outline-none focus:border-amber-500 bg-white w-48 appearance-none cursor-pointer"
                         >
                            <option value="">Bütün İmtahanlar</option>
                            {Array.from(new Set(exams.map(e => e.name))).map((name, i) => (
                                <option key={i} value={name}>{name}</option>
                            ))}
                         </select>
                      </div>
                      <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                         <input placeholder="Axtar..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:border-amber-500 w-48"/>
                      </div>
                      <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition"><Download size={16}/> Excel</button>
                  </div>
               </div>
               
               <div className="overflow-auto flex-1">
                  <table className="w-full text-left text-sm text-gray-600 min-w-[1000px]">
                    <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-700 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-4 bg-gray-50">ID</th>
                            <th className="p-4 bg-gray-50">Ad Soyad</th>
                            <th className="p-4 bg-gray-50">İmtahan</th>
                            <th className="p-4 bg-gray-50">Sinif</th>
                            <th className="p-4 bg-gray-50">Valideyn</th>
                            <th className="p-4 bg-gray-50">Telefon 1</th>
                            <th className="p-4 bg-gray-50">Telefon 2</th>
                            <th className="p-4 bg-gray-50">Tarix</th>
                            <th className="p-4 bg-gray-50 text-center">Əməliyyat</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.filter(s => {
                            const matchesSearch = (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase());
                            const matchesExam = filterExam ? s.exam_name === filterExam : true;
                            return matchesSearch && matchesExam;
                        }).map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 transition">
                                <td className="p-4 font-mono text-blue-600 font-bold">{s.exam_id}</td>
                                <td className="p-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                                <td className="p-4">{s.exam_name ? <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">{s.exam_name}</span> : "-"}</td>
                                <td className="p-4"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">{s.class}</span></td>
                                <td className="p-4 text-gray-500">{s.parent_name || "-"}</td>
                                <td className="p-4 whitespace-nowrap">{s.phone1}</td>
                                <td className="p-4 text-gray-400 whitespace-nowrap">{s.phone2 || "-"}</td>
                                <td className="p-4 text-gray-400 text-xs whitespace-nowrap">{s.created_at ? new Date(s.created_at).toLocaleDateString('az-AZ') : "-"}</td>
                                <td className="p-4 flex gap-2 justify-center">
                                    <button onClick={()=>setEditingStudent(s)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Edit size={16}/></button>
                                    <button onClick={()=>deleteStudent(s.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                  {students.length === 0 && <p className="text-center py-10 text-gray-400">Heç bir tələbə tapılmadı.</p>}
               </div>
            </div>
          )}

          {/* 2. İMTAHANLAR */}
          {activeTab === "exams" && (
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlusCircle className="text-amber-500"/> Yeni İmtahan</h2>
                    <form onSubmit={addExam} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Sinif</label>
                            <select value={newExamClass} onChange={e=>setNewExamClass(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-white transition">
                                {[1,2,3,4,5,6,7,8,9,10,11].map(c=><option key={c} value={c}>{c}-ci Sinif</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">İmtahan Adı</label>
                             <input value={newExamName} onChange={e=>setNewExamName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition" placeholder="Məs: Buraxılış Sınağı"/>
                        </div>
                        <div className="col-span-2">
                             <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Link (URL)</label>
                             <input value={newExamUrl} onChange={e=>setNewExamUrl(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition" placeholder="https://..."/>
                        </div>
                        <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center gap-6">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${isPaid ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300'}`}>
                                    {isPaid && <CheckCircle size={16}/>}
                                </div>
                                <input type="checkbox" checked={isPaid} onChange={e=>setIsPaid(e.target.checked)} className="hidden"/>
                                <span className="font-bold text-gray-700">Ödənişli İmtahan</span>
                            </label>
                            {isPaid && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                                    <span className="text-sm font-bold text-gray-500">Qiymət:</span>
                                    <div className="relative">
                                        <input type="number" value={examPrice} onChange={e=>setExamPrice(e.target.value)} className="w-24 p-2 pl-8 border border-gray-300 rounded-lg outline-none focus:border-amber-500 font-mono font-bold"/>
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">₼</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="col-span-2">
                            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2">
                                <Save size={20}/> Yadda Saxla
                            </button>
                        </div>
                    </form>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Aktiv Linklər</h2>
                    <div className="space-y-3">
                        {exams.map(ex => (
                            <div key={ex.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition group">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{ex.class_grade}-ci sinif</span>
                                        {ex.is_paid ? (
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1"><DollarSign size={10}/> {ex.price} AZN</span>
                                        ) : (
                                            <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Ödənişsiz</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-800">{ex.name}</h3>
                                    <a href={ex.url} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1"><ExternalLink size={10}/> {ex.url}</a>
                                </div>
                                <button onClick={()=>deleteExam(ex.id)} className="p-2 bg-white text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition shadow-sm opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                            </div>
                        ))}
                        {exams.length === 0 && <p className="text-center text-gray-400 py-4">İmtahan yoxdur.</p>}
                    </div>
                </div>
             </div>
          )}

          {/* 3. UPLOAD RESULTS */}
          {activeTab === "results" && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                 <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center flex flex-col items-center">
                     <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4"><FileText size={24}/></div>
                     <h2 className="text-xl font-bold mb-2">Nəticələri Yüklə</h2>
                     <p className="text-sm text-gray-500 mb-6">ZipGrade Excel (.xlsx, .csv) faylı</p>
                     <select value={uploadExamSelect} onChange={e=>setUploadExamSelect(e.target.value)} className="w-full p-3 border rounded-xl mb-4 bg-gray-50 outline-none focus:border-green-500 transition">
                         <option value="">İmtahan Seç...</option>
                         {Array.from(new Set(exams.map(e=>e.name))).map(n=><option key={n} value={n}>{n}</option>)}
                     </select>
                     <div className={`w-full border-2 border-dashed border-gray-300 p-8 rounded-xl hover:bg-gray-50 transition relative ${!uploadExamSelect && 'opacity-50 pointer-events-none'}`}>
                         <input type="file" accept=".xlsx,.csv" onChange={handleResultUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                         <div className="flex flex-col items-center text-gray-500">
                             {uploading ? <Loader2 className="animate-spin mb-2"/> : <Upload className="mb-2"/>}
                             <span>{uploading ? "Yüklənir..." : "Faylı bura atın"}</span>
                         </div>
                     </div>
                     {uploadMessage && <p className={`mt-4 font-bold text-sm ${uploadMessage.includes("Xəta") ? "text-red-500" : "text-green-600"}`}>{uploadMessage}</p>}
                 </div>
                 <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center flex flex-col items-center">
                     <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4"><ImageIcon size={24}/></div>
                     <h2 className="text-xl font-bold mb-2">Sertifikat Şablonu</h2>
                     <p className="text-sm text-gray-500 mb-6">Boş şablon (.jpg, .png)</p>
                     <select value={certExamSelect} onChange={e=>setCertExamSelect(e.target.value)} className="w-full p-3 border rounded-xl mb-4 bg-gray-50 outline-none focus:border-purple-500 transition">
                         <option value="">İmtahan Seç...</option>
                         {Array.from(new Set(exams.map(e=>e.name))).map(n=><option key={n} value={n}>{n}</option>)}
                     </select>
                     <div className={`w-full border-2 border-dashed border-gray-300 p-8 rounded-xl hover:bg-gray-50 transition relative ${!certExamSelect && 'opacity-50 pointer-events-none'}`}>
                         <input type="file" accept="image/*" onChange={handleCertificateUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                         <div className="flex flex-col items-center text-gray-500">
                             {uploading ? <Loader2 className="animate-spin mb-2"/> : <ImageIcon className="mb-2"/>}
                             <span>{uploading ? "Yüklənir..." : "Şəkli bura atın"}</span>
                         </div>
                     </div>
                     {certMessage && <p className={`mt-4 font-bold text-sm ${certMessage.includes("Xəta") ? "text-red-500" : "text-green-600"}`}>{certMessage}</p>}
                 </div>
             </div>
          )}

          {/* 4. SETTINGS */}
          {activeTab === "settings" && (
             <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="text-amber-500"/> Digər Tənzimləmələr</h2>
                <div className="space-y-6">
                    {siteSettings.filter(item => !item.label.includes("Sinif")).map((item) => (
                      <div key={item.id} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{item.label}</label>
                        <div className="flex gap-3">
                          <input id={`input-${item.key}`} defaultValue={item.value} className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition"/>
                          <button onClick={() => {const val = (document.getElementById(`input-${item.key}`) as HTMLInputElement).value; updateSetting(item.key, val);}} className="bg-blue-600 text-white px-5 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm flex items-center gap-2"><Save size={18} /> Yadda Saxla</button>
                        </div>
                      </div>
                    ))}
                    {siteSettings.length === 0 && <p className="text-gray-400 text-center">Tənzimləmə tapılmadı.</p>}
                </div>
             </div>
          )}

          {/* 5. GALLERY */}
          {activeTab === "gallery" && (
             <div className="max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2"><ImageIcon className="text-amber-500" /> Qalereya</h2>
                  <div className="relative overflow-hidden">
                    <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-md">
                        {uploading ? <Loader2 className="animate-spin" size={20}/> : <PlusCircle size={20} />} Yeni Şəkil
                    </button>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative group rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-200 aspect-square">
                      <img src={img.image_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                        <button onClick={() => deleteImage(img.id, img.image_url)} className="bg-white text-red-600 p-3 rounded-full hover:bg-red-50 transition shadow-lg transform hover:scale-110"><Trash2 size={24} /></button>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && <div className="col-span-full text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-300">Şəkil yoxdur.</div>}
                </div>
             </div>
          )}

        </main>
      </div>

      {/* EDIT MODAL */}
      {editingStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Edit className="text-blue-500"/> Düzəliş Et</h2>
                      <button onClick={()=>setEditingStudent(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"><X size={20}/></button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <form onSubmit={handleSaveStudent} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Ad</label><input value={editingStudent.first_name} onChange={e=>setEditingStudent({...editingStudent, first_name:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Soyad</label><input value={editingStudent.last_name} onChange={e=>setEditingStudent({...editingStudent, last_name:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                          </div>
                          <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Ata adı</label><input value={editingStudent.parent_name || ""} onChange={e=>setEditingStudent({...editingStudent, parent_name:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Sinif</label><input value={editingStudent.class} onChange={e=>setEditingStudent({...editingStudent, class:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Exam ID</label><input value={editingStudent.exam_id} onChange={e=>setEditingStudent({...editingStudent, exam_id:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Telefon 1</label><input value={editingStudent.phone1} onChange={e=>setEditingStudent({...editingStudent, phone1:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                              <div><label className="text-xs font-bold text-gray-500 uppercase ml-1">Telefon 2</label><input value={editingStudent.phone2} onChange={e=>setEditingStudent({...editingStudent, phone2:e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition"/></div>
                          </div>
                          <div className="flex gap-3 pt-4 border-t mt-2">
                              <button type="button" onClick={()=>setEditingStudent(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition">Ləğv Et</button>
                              <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition">Yadda Saxla</button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
