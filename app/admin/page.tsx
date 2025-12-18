"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// Tipləri təyin edirik
interface Student {
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  
  // Şagirdlər üçün State-lər
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Ayarlar (Linklər) üçün State-lər
  const [settings, setSettings] = useState<Setting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchStudents();
      fetchSettings(); // Giriş edən kimi linkləri də gətir
    } else {
      alert("Şifrə yanlışdır!");
    }
  }

  // --- ŞAGİRD FUNKSİYALARI ---
  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) alert("Xəta: " + error.message);
    else setStudents((data as Student[]) || []);
    setLoading(false);
  }

  // --- AYARLAR (LİNKLƏR) FUNKSİYALARI ---
  async function fetchSettings() {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("id", { ascending: true });

    if (error) console.error("Parametr xətası:", error);
    else setSettings((data as Setting[]) || []);
    setSettingsLoading(false);
  }

  async function updateSetting(key: string, newValue: string) {
    const { error } = await supabase
      .from("settings")
      .update({ value: newValue })
      .eq("key", key);

    if (error) {
      alert("Yadda saxlanmadı: " + error.message);
    } else {
      alert("Link uğurla yeniləndi!");
      fetchSettings(); // Yenilənmiş halını gətir
    }
  }

  // Digər funksiyalar (Excel, Delete, Edit)
  function exportToExcel() {
    const dataForExcel = students.map((s) => ({
      "Exam ID": s.exam_id,
      "Ad": s.first_name,
      "Soyad": s.last_name,
      "Valideyn": s.parent_name,
      "Sinif": s.class,
      "Tel 1": s.phone1,
      "Tel 2": s.phone2,
      "Tarix": s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Şagirdlər");
    XLSX.writeFile(workbook, "Imtahan_Siyahisi.xlsx");
  }

  async function saveEdit(e: any) {
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
      })
      .eq("exam_id", editingStudent.exam_id);
    if (error) alert("Yadda saxlanmadı: " + error.message);
    else {
      alert("Məlumat yeniləndi!");
      setEditingStudent(null);
      fetchStudents();
    }
  }

  async function deleteStudent(id: string) {
    if(!confirm("Bu şagirdi silmək istədiyinizə əminsiniz?")) return;
    const { error } = await supabase.from("students").delete().eq("exam_id", id);
    if(error) alert("Silinmədi: " + error.message);
    else fetchStudents();
  }

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(term) ||
      s.last_name?.toLowerCase().includes(term) ||
      s.exam_id?.toString().includes(term)
    );
  });

  if (!isAuthenticated) {
    return (
      <div style={styles.centerContainer}>
        <form onSubmit={handleLogin} style={styles.loginBox}>
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>Admin Panel</h2>
          <input
            type="password"
            placeholder="Şifrə"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.btnPrimary}>Daxil ol</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Admin İdarəetmə</h1>
        <div style={{ display: "flex", gap: "10px" }}>
           <button onClick={() => {fetchStudents(); fetchSettings();}} style={styles.btnSecondary}>Yenilə</button>
           <button onClick={exportToExcel} style={styles.btnSuccess}>Excel 📥</button>
        </div>
      </div>

      {/* --- YENİ HİSSƏ: LİNKLƏRİN İDARƏSİ --- */}
      <div style={styles.card}>
        <h2 style={{fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: 10}}>⚙️ Sayt Ayarları (Linklər)</h2>
        {settingsLoading ? <p>Yüklənir...</p> : (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
            {settings.map((setting) => (
              <div key={setting.id} style={{marginBottom: 10}}>
                <label style={styles.label}>{setting.label}</label>
                <div style={{display: 'flex', gap: 10}}>
                  <input 
                    defaultValue={setting.value} 
                    id={`input-${setting.key}`}
                    style={styles.input} 
                  />
                  <button 
                    style={styles.btnEdit}
                    onClick={() => {
                      // Inputun dəyərini tapıb göndəririk
                      const val = (document.getElementById(`input-${setting.key}`) as HTMLInputElement).value;
                      updateSetting(setting.key, val);
                    }}
                  >
                    Yadda Saxla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr style={{margin: '30px 0', border: 'none', borderTop: '1px solid #ddd'}}/>

      {/* --- KÖHNƏ HİSSƏ: ŞAGİRD CƏDVƏLİ --- */}
      <h2 style={{fontSize: '18px', marginBottom: '15px'}}>👨‍🎓 Şagirdlər ({students.length})</h2>
      <input
        placeholder="Axtar: Ad, Soyad, ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...styles.input, maxWidth: "400px", marginBottom: "20px" }}
      />

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ad</th>
              <th style={styles.th}>Soyad</th>
              <th style={styles.th}>Sinif</th>
              <th style={styles.th}>Tel 1</th>
              <th style={styles.th}>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 20, textAlign: "center" }}>Yüklənir...</td></tr>
            ) : filteredStudents.map((s) => (
              <tr key={s.exam_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={styles.td}><b>{s.exam_id}</b></td>
                <td style={styles.td}>{s.first_name}</td>
                <td style={styles.td}>{s.last_name}</td>
                <td style={styles.td}>{s.class}</td>
                <td style={styles.td}>{s.phone1}</td>
                <td style={styles.td}>
                  <div style={{display:'flex', gap: 5}}>
                    <button onClick={() => setEditingStudent(s)} style={styles.btnEdit}>Düzəlt</button>
                    <button onClick={() => deleteStudent(s.exam_id)} style={styles.btnDelete}>Sil</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (Köhnə hissə eyni qalır) */}
      {editingStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Məlumatı Dəyiş</h3>
            <form onSubmit={saveEdit}>
              <label style={styles.label}>Ad</label>
              <input style={styles.input} value={editingStudent.first_name} onChange={e => setEditingStudent({...editingStudent, first_name: e.target.value})}/>
              <label style={styles.label}>Soyad</label>
              <input style={styles.input} value={editingStudent.last_name} onChange={e => setEditingStudent({...editingStudent, last_name: e.target.value})}/>
              <label style={styles.label}>Valideyn</label>
              <input style={styles.input} value={editingStudent.parent_name} onChange={e => setEditingStudent({...editingStudent, parent_name: e.target.value})}/>
              <label style={styles.label}>Sinif</label>
              <input style={styles.input} value={editingStudent.class} onChange={e => setEditingStudent({...editingStudent, class: e.target.value})}/>
               <label style={styles.label}>Telefon 1</label>
              <input style={styles.input} value={editingStudent.phone1} onChange={e => setEditingStudent({...editingStudent, phone1: e.target.value})}/>
              <label style={styles.label}>Telefon 2</label>
              <input style={styles.input} value={editingStudent.phone2} onChange={e => setEditingStudent({...editingStudent, phone2: e.target.value})}/>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setEditingStudent(null)} style={styles.btnCancel}>Ləğv et</button>
                <button type="submit" style={styles.btnPrimary}>Yadda saxla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: any = {
  centerContainer: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f1f5f9" },
  loginBox: { background: "#fff", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", width: "300px" },
  container: { padding: "20px", fontFamily: "sans-serif", background: "#fff", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  input: { width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { padding: "12px", borderBottom: "2px solid #e2e8f0" },
  td: { padding: "12px", borderBottom: "1px solid #e2e8f0" },
  btnPrimary: { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%" },
  btnSecondary: { padding: "8px 16px", background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  btnSuccess: { padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  btnEdit: { padding: "8px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" },
  btnDelete: { padding: "6px 10px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  btnCancel: { padding: "10px 20px", background: "#94a3b8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "#fff", padding: "24px", borderRadius: "10px", width: "400px", maxWidth: "90%" },
  label: { fontSize: "12px", fontWeight: "bold", marginBottom: "4px", display: "block" },
  card: { background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "30px" }
};
