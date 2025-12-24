"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

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
  const [activeTab, setActiveTab] = useState("students");
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
    // 1. Tələbələr
    const { data: stData } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (stData) setStudents(stData as any);

    // 2. Tənzimləmələr
    const { data: setData } = await supabase.from("settings").select("*").order("id", { ascending: true });
    if (setData) setSettings(setData as any);

    // 3. Qalereya
    const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    if (galData) setGallery(galData as any);

    setLoading(false);
  }

  // --- FUNKSİYALAR: TƏNZİMLƏMƏLƏR ---
  async function updateSetting(key: string, newValue: string) {
    const { error } = await supabase.from("settings").update({ value: newValue }).eq("key", key);
    if (!error) alert("Yadda saxlanıldı! ✅");
  }

  // --- FUNKSİYALAR: QALEREYA (YÜKLƏMƏ) ---
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 1. Storage-a yüklə (Bucket adı 'images' olmalıdır)
    const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);

    if (uploadError) {
      alert("Şəkil yüklənə bilmədi. Supabase Storage-də 'images' bucket-i yaradılıbmı?");
      setUploading(false);
      return;
    }

    // 2. Public URL al
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(filePath);

    // 3. Bazaya yaz
    await supabase.from("gallery").insert({ image_url: publicUrl });
    
    // Yenilə
    fetchAllData();
    setUploading(false);
    alert("Şəkil əlavə olundu! 🖼️");
  }

  async function deleteImage(id: number) {
    if(!confirm("Bu şəkli silmək istədiyinizə əminsiniz?")) return;
    await supabase.from("gallery").delete().eq("id", id);
    fetchAllData();
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
    // Cookie-ni silirik (tarixini keçmişə ataraq)
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-2xl font-bold text-blue-900">MOC Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Xoş gəldiniz, Admin</span>
          <button onClick={logout} className="text-red-600 font-medium text-sm hover:underline">Çıxış et</button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* SIDEBAR (Menyu) */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
          <nav className="p-4 space-y-2">
            <button 
              onClick={() => setActiveTab("students")} 
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === "students" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              👨‍🎓 Tələbələr
            </button>
            <button 
              onClick={() => setActiveTab("settings")} 
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === "settings" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              ⚙️ Tənzimləmələr
            </button>
            <button 
              onClick={() => setActiveTab("gallery")} 
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${activeTab === "gallery" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              🖼️ Qalereya
            </button>
          </nav>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto">
          
          {/* TAB: TƏLƏBƏLƏR */}
          {activeTab === "students" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Qeydiyyat Siyahısı</h2>
                  <p className="text-gray-500 text-sm">Ümumi: {students.length} tələbə</p>
                </div>
                <div className="flex gap-3">
                  <input 
                    placeholder="Axtarış..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                  <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition">
                    Excel Yüklə
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
                      <tr key={s.exam_id} className="hover:bg-gray-50">
                        <td className="p-4 font-mono text-blue-600">{s.exam_id}</td>
                        <td className="p-4 font-medium text-gray-900">{s.first_name} {s.last_name}</td>
                        <td className="p-4">{s.class}-ci sinif</td>
                        <td className="p-4">{s.phone1}</td>
                        <td className="p-4 text-gray-400">{s.created_at ? new Date(s.created_at).toLocaleDateString("az-AZ") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TƏNZİMLƏMƏLƏR */}
          {activeTab === "settings" && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 max-w-3xl">
              <h2 className="text-xl font-bold mb-6">Sayt Məlumatları (CMS)</h2>
              <div className="space-y-6">
                {settings.map((item) => (
                  <div key={item.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{item.label}</label>
                    <div className="flex gap-3">
                      <input 
                        id={`input-${item.key}`} 
                        defaultValue={item.value} 
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                         onClick={() => {
                            const val = (document.getElementById(`input-${item.key}`) as HTMLInputElement).value;
                            updateSetting(item.key, val);
                         }}
                         className="bg-blue-600 text-white px-5 rounded-xl font-medium hover:bg-blue-700 transition"
                      >
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
             <div className="space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold mb-4">Yeni Şəkil Yüklə</h2>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition">
                      📁 Şəkil Seç
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {uploading && <span className="text-blue-600 animate-pulse">Yüklənir... Gözləyin</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {gallery.map((img) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm h-48">
                      <img src={img.image_url} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
                      >
                        🗑️ Sil
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
