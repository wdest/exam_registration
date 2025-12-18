"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// Tiplər
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
  
  // Data State-ləri
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  
  // UI State-ləri
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchStudents();
      fetchSettings(); 
    } else {
      alert("Şifrə yanlışdır!");
    }
  }

  // --- LİNKLƏRİ GƏTİRƏN FUNKSİYA ---
  async function fetchSettings() {
    setSettingsLoading(true);
    // id-yə görə sıralayırıq ki, 1-ci sinif 1-ci gəlsin
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("id", { ascending: true });

    if (error) console.error("Parametr xətası:", error);
    else setSettings((data as Setting[]) || []);
    setSettingsLoading(false);
  }

  // --- LİNKİ YENİLƏYƏN FUNKSİYA ---
  async function updateSetting(key: string, newValue: string) {
    const { error } = await supabase
      .from("settings")
      .update({ value: newValue })
      .eq("key", key);

    if (error) {
      alert("Xəta: " + error.message);
    } else {
      // İstifadəçini narahat etməmək üçün alert vermirik, sadəcə düymə rəngini dəyişə bilərik, 
      // amma sadəlik üçün bura 'success' logu qoyuruq.
      alert("✅ Link yeniləndi!");
      fetchSettings(); 
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

  function exportToExcel() {
    const dataForExcel = students.map((s) => ({
      "ID": s.exam_id,
      "Ad": s.first_name,
      "Soyad": s.last_name,
      "Sinif": s.class,
      "Tel 1": s.phone1,
      "Tel 2": s.phone2,
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
    if (error) alert("Xəta: " + error.message);
    else {
      alert("Məlumat yeniləndi!");
      setEditingStudent(null);
      fetchStudents();
    }
  }

  async function deleteStudent(id: string) {
    if(!confirm("Silmək istədiyinizə əminsiniz?")) return;
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
          <input type="password" placeholder="Şifrə" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={styles.input} />
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

      {/* --- SİNİF LİNKLƏRİ BÖLMƏSİ --- */}
      <div style={styles.card}>
        <h2 style={{fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: 10}}>🔗 İmtahan Linkləri (Siniflər üzrə)</h2>
        
        {settingsLoading ? <p>Linklər yüklənir...</p> : (
          <div style={styles.gridContainer}>
            {settings.map((setting) => (
              <div key={setting.id} style={styles.settingItem}>
                <label style={styles.label}>{setting.label}</label>
                <div style={{display: 'flex', gap: 5}}>
                  <input 
                    defaultValue={setting.value} 
                    id={`input-${setting.key}`}
                    placeholder="Link yapışdırın..."
                    style={styles.inputSmall} 
                  />
                  <button 
                    style={styles.btnSave}
                    onClick={() => {
                      const val = (document.getElementById(`input-${setting.key}`) as HTMLInputElement).value;
                      updateSetting(setting.key, val);
                    }}
                  >
                    💾
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- ŞAGİRD SİYAHISI --- */}
      <h2 style={{fontSize: '18px', marginBottom: '15px', marginTop: '30px'}}>👨‍🎓 Qeydiyyatdan keçənlər ({students.length})</h2>
      <input
        placeholder="Axtarış..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...styles.input, maxWidth: "400px", marginBottom: "20px" }}
      />

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ad Soyad</th>
              <th style={styles.th}>Sinif</th>
              <th style={styles.th}>Telefon</th>
              <th style={styles.th}>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: "center" }}>Yüklənir...</td></tr>
            ) : filteredStudents.map((s) => (
              <tr key={s.exam_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={styles.td}><b>{s.exam_id}</b></td>
                <td style={styles.td}>{s.first_name} {s.last_name}</td>
                <td style={styles.td}>{s.class}-ci</td>
                <td style={styles.td}>{s.phone1}</td>
                <td style={styles.td}>
                  <button onClick={() => setEditingStudent(s)} style={styles.btnEdit}>Düzəlt</button>
                  <button onClick={() => deleteStudent(s.exam_id)} style={styles.btnDelete}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {editingStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Məlumatı Dəyiş</h3>
            <form onSubmit={saveEdit}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10}}>
                <div>
                  <label style={styles.label}>Ad</label>
                  <input style={styles.input} value={editingStudent.first_name} onChange={e => setEditingStudent({...editingStudent, first_name: e.target.value})}/>
                </div>
                <div>
                  <label style={styles.label}>Soyad</label>
                  <input style={styles.input} value={editingStudent.last_name} onChange={e => setEditingStudent({...editingStudent, last_name: e.target.value})}/>
                </div>
                <div>
                   <label style={styles.label}>Sinif</label>
                   <input style={styles.input} value={editingStudent.class} onChange={e => setEditingStudent({...editingStudent, class: e.target.value})}/>
                </div>
                <div>
                   <label style={styles.label}>Telefon</label>
                   <input style={styles.input} value={editingStudent.phone1} onChange={e => setEditingStudent({...editingStudent, phone1: e.target.value})}/>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="button" onClick={() => setEditingStudent(null)} style={styles.btnCancel}>Bağla</button>
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
  container: { padding: "20px", fontFamily: "sans-serif", background: "#fff", minHeight: "100vh", maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  
  // Grid layout (Yeni əlavə)
  gridContainer: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px" },
  settingItem: { background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" },
  
  input: { width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #cbd5e1", borderRadius: "6px" },
  inputSmall: { width: "100%", padding: "8px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" },
  
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { padding: "12px", borderBottom: "2px solid #e2e8f0" },
  td: { padding: "12px", borderBottom: "1px solid #e2e8f0" },
  
  btnPrimary: { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%" },
  btnSecondary: { padding: "8px 16px", background: "#64748b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  btnSuccess: { padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" },
  btnSave: { padding: "0 15px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "18px" },
  btnEdit: { padding: "6px 12px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", marginRight: 5 },
  btnDelete: { padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  btnCancel: { padding: "10px 20px", background: "#94a3b8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", width: "100%" },
  
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "#fff", padding: "24px", borderRadius: "10px", width: "500px", maxWidth: "90%" },
  label: { fontSize: "12px", fontWeight: "bold", marginBottom: "4px", display: "block", color: "#475569" },
  card: { background: "#f8fafc", padding: "20px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "30px" }
};
