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
  
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      // 1. Tənzimləmələr (DÜZƏLİŞ: Artıq əsas 'settings' cədvəlini oxuyuruq)
      const { data: setData } = await supabase.from("settings").select("*").order("id", { ascending: true });
      if (setData) setSettings(setData as any);

      // 2. Tələbələr
      const { data: stData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
      if (stData) setStudents(stData as any);

      // 3. Qalereya
      const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      if (galData) setGallery(galData as any);
    } catch (error) {
      console.error("Xəta:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- UPDATE ---
  async function updateSetting(key: string, newValue: string) {
    // DÜZƏLİŞ: 'settings' cədvəlini yeniləyirik
    const { error } = await supabase.from("settings").update({ value: newValue }).eq("key", key);
    if (!error) {
      alert("Yadda saxlanıldı! ✅");
      fetchAllData();
    } else {
      alert("Xəta: " + error.message);
    }
  }

  // --- IMAGE UPLOAD ---
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

  // --- IMAGE DELETE ---
  async function deleteImage(id: number, imageUrl: string) {
    if(!confirm("Silmək istədiyinizə əminsiniz?")) return;
    const fileName = imageUrl.split("/").pop(); 
    if (fileName) await supabase.storage.from("images").remove([fileName]);
    await supabase.from("gallery").delete().eq("id", id);
    fetchAllData();
  }

  // --- EXCEL ---
  function exportExcel() {
    const rows = students.map((s) => ({ ID: s.exam_id, Ad: s.first_name, Soyad: s.last_name, Telefon: s.phone1 }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Telebeler.xlsx");
  }

  // --- LOGOUT ---
  function logout() {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-blue-900">MOC Admin Panel</h1>
        <div className="flex gap-4">
             <button onClick={() => fetchAllData()} className="p-2 bg-gray-100 rounded-full"><RefreshCw size={20}/></button>
             <button onClick={logout} className="text-red-600 font-bold">Çıxış</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r hidden md:block p-4 space-y-2">
          <button onClick={() => setActiveTab("settings")} className={`w-full flex gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === "settings" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
            <Settings size={20} /> Tənzimləmələr
          </button>
          <button onClick={() => setActiveTab("students")} className={`w-full flex gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === "students" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
            <Users size={20} /> Tələbələr
          </button>
          <button onClick={() => setActiveTab("gallery")} className={`w-full flex gap-3 px-4 py-3 rounded-xl font-bold transition ${activeTab === "gallery" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
            <ImageIcon size={20} /> Qalereya
          </button>
        </aside>

        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* TƏNZİMLƏMƏLƏR (Həm linklər, həm nömrələr) */}
          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">⚙️ Bütün Tənzimləmələr</h2>
              <p className="mb-4 text-gray-500 text-sm">Buradan həm İmtahan linklərini, həm də Əlaqə məlumatlarını dəyişə bilərsiniz.</p>
              
              {settings.length === 0 ? (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">Məlumat yüklənir...</div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {settings.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center">
                      <label className="w-full md:w-1/3 text-sm font-bold text-gray-700">{item.label || item.key}</label>
                      <input 
                        id={`input-${item.key}`} 
                        defaultValue={item.value} 
                        className="flex-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                         onClick={() => {
                            const val = (document.getElementById(`input-${item.key}`) as HTMLInputElement).value;
                            updateSetting(item.key, val);
                         }}
                         className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TƏLƏBƏLƏR */}
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="flex justify-between mb-4">
                 <h2 className="text-xl font-bold">Tələbə Siyahısı</h2>
                 <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Download size={18}/> Excel</button>
              </div>
              <input placeholder="Axtar..." onChange={(e) => setSearch(e.target.value)} className="w-full p-2 border rounded-lg mb-4" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 uppercase font-bold text-xs">
                    <tr><th className="p-3">Ad Soyad</th><th className="p-3">Sinif</th><th className="p-3">Telefon</th></tr>
                  </thead>
                  <tbody>
                    {students.filter(s => (s.first_name+s.last_name).toLowerCase().includes(search.toLowerCase())).map(s => (
                      <tr key={s.exam_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{s.first_name} {s.last_name}</td>
                        <td className="p-3">{s.class}</td>
                        <td className="p-3">{s.phone1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QALEREYA */}
          {activeTab === "gallery" && (
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
                  <h2 className="text-xl font-bold">Qalereya</h2>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex gap-2">
                    {uploading ? "Yüklənir..." : <><Upload size={20}/> Şəkil Yüklə</>}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm">
                      <img src={img.image_url} className="w-full h-full object-cover" />
                      <button onClick={() => deleteImage(img.id, img.image_url)} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg shadow-lg hover:bg-red-700 transition">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}
