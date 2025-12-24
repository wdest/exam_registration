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
  RefreshCw 
} from "lucide-react";

// --- SUPABASE SETUP ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- TİPLƏR ---
interface Student {
  exam_id: string;
  first_name: string;
  last_name: string;
  class: string;
  phone1: string;
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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);
  
  // Data State-ləri
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [search, setSearch] = useState("");

  // Yükləmə State-ləri
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      // 1. Tələbələr
      const { data: stData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (stData) setStudents(stData as any);

      // 2. Tənzimləmələr (DÜZƏLDİLDİ: site_settings)
      // Sənin şəkildəki cədvəl adın 'site_settings' idi, ona görə bura 'site_settings' yazmalıyıq.
      const { data: setData } = await supabase.from("site_settings").select("*").order("id", { ascending: true });
      if (setData) setSettings(setData as any);

      // 3. Qalereya
      const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (galData) setGallery(galData as any);
    } catch (error) {
      console.error("Data yüklənərkən xəta:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- FUNKSİYALAR: TƏNZİMLƏMƏLƏR ---
  async function updateSetting(key: string, newValue: string) {
    // DÜZƏLDİLDİ: site_settings
    const { error } = await supabase.from("site_settings").update({ value: newValue }).eq("key", key);
    if (!error) {
      alert("Məlumat yeniləndi! ✅");
      fetchAllData();
    } else {
      alert("Xəta: " + error.message);
    }
  }

  // --- FUNKSİYALAR: QALEREYA (YÜKLƏMƏ & SİLMƏ) ---
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`; // Unikal ad
      const filePath = `${fileName}`;

      // 1. Storage-a yüklə (Bucket adı 'images' olmalıdır)
      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Public URL al
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);

      // 3. Bazaya yaz
      const { error: dbError } = await supabase.from("gallery").insert({ image_url: publicUrl });
      if (dbError) throw dbError;
      
      alert("Şəkil əlavə olundu! 🖼️");
      fetchAllData(); // Siyahını yenilə

    } catch (error: any) {
      alert("Xəta: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(id: number, imageUrl: string) {
    if(!confirm("Bu şəkli silmək istədiyinizə əminsiniz?")) return;

    try {
      // 1. Şəklin adını URL-dən tapırıq
      const fileName = imageUrl.split("/").pop(); 

      if (fileName) {
        // 2. Storage-dan (Anbardan) silirik
        await supabase.storage.from("images").remove([fileName]);
      }

      // 3. Bazadan (Cədvəldən) silirik
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      
      if (error) throw error;

      fetchAllData(); // Siyahını yenilə
    } catch (error: any) {
      alert("Silinmə zamanı xəta: " + error.message);
    }
  }

  // --- FUNKSİYALAR: EXCEL ---
  function exportExcel() {
    const rows = students.map((s) => ({
      ID: s.exam_id,
      Ad: s.first_name,
      Soyad: s.last_name,
      Sinif: s.class,
      Telefon: s.phone1,
      Tarix: s.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Telebeler.xlsx");
  }

  // --- ÇIXIŞ ---
  function logout() {
    // Cookie-ni silirik
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
        {/* SIDEBAR (Menyu) */}
        <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col pt-4 pb-4">
          <nav className="space-y-2 px-2 md:px-4">
            <button 
              onClick={() => setActiveTab("students")} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "students" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Users size={20} />
              <span className="hidden md:block">Tələbələr</span>
            </button>
            <button 
              onClick={() => setActiveTab("settings")} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "settings" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Settings size={20} />
              <span className="hidden md:block">Tənzimləmələr</span>
            </button>
            <button 
              onClick={() => setActiveTab("gallery")} 
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition ${activeTab === "gallery" ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <ImageIcon size={20} />
              <span className="hidden md:block">Qalereya</span>
            </button>
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          
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
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 w-full md:w-64"
                    />
                  </div>
                  <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm">
                    <Download size={18} />
                    <span className="hidden md:inline">Excel</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Ad Soyad</th>
                      <th className="p-4">Sinif</th>
                      <th className="p-4">Telefon</th>
                      <th className="p-4">Tarix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.filter(s => (s.first_name + s.last_name + s.exam_id).toLowerCase().includes(search.toLowerCase())).map((s) => (
                      <tr key={s.exam_id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-mono text-blue-600 font-bold">{s.exam_id}</td>
                        <td className="p-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                        <td className="p-4"><span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">{s.class}</span></td>
                        <td className="p-4">{s.phone1}</td>
                        <td className="p-4 text-gray-400">{s.created_at ? new Date(s.created_at).toLocaleDateString("az-AZ") : "-"}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">Heç bir məlumat tapılmadı</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TƏNZİMLƏMƏLƏR */}
          {activeTab === "settings" && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Settings size={24} className="text-amber-500" />
                Sayt Məlumatları (CMS)
              </h2>
              <div className="space-y-6">
                {settings.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{item.label}</label>
                    <div className="flex gap-3">
                      <input 
                        id={`input-${item.key}`} 
                        defaultValue={item.value} 
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition"
                      />
                      <button 
                         onClick={() => {
                            const val = (document.getElementById(`input-${item.key}`) as HTMLInputElement).value;
                            updateSetting(item.key, val);
                         }}
                         className="flex items-center gap-2 bg-blue-600 text-white px-5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm active:scale-95"
                      >
                        <Save size={18} />
                        Yadda saxla
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                       <ImageIcon size={22} className="text-amber-500" />
                       Qalereya İdarəetməsi
                    </h2>
                    <p className="text-gray-500 text-sm">Saytın "Həyatımız" bölməsindəki şəkilləri buradan idarə edin.</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className={`cursor-pointer flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg hover:shadow-amber-500/30 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                      {uploading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
                      {uploading ? "Yüklənir..." : "Yeni Şəkil Seç"}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>

                {gallery.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400">Hələlik heç bir şəkil yüklənməyib.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {gallery.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-md bg-white border border-gray-100 aspect-square">
                        <img src={img.image_url} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                          <button 
                            onClick={() => deleteImage(img.id, img.image_url)}
                            className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition shadow-xl transform hover:scale-110"
                            title="Şəkli sil"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

        </main>
      </div>
    </div>
  );
}
