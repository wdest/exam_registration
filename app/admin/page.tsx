"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

/* ================== TYPES ================== */
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

/* ================== SUPABASE ================== */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ================== PAGE ================== */
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  /* PDF STATES */
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  /* ================== AUTH ================== */
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

  /* ================== SETTINGS ================== */
  async function fetchSettings() {
    setSettingsLoading(true);
    const { data } = await supabase
      .from("settings")
      .select("*")
      .order("id", { ascending: true });
    setSettings((data as Setting[]) || []);
    setSettingsLoading(false);
  }

  async function updateSetting(key: string, value: string) {
    const { error } = await supabase
      .from("settings")
      .update({ value })
      .eq("key", key);
    if (error) alert(error.message);
    else fetchSettings();
  }

  /* ================== STUDENTS ================== */
  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    setStudents((data as Student[]) || []);
    setLoading(false);
  }

  function exportToExcel() {
    const rows = students.map(s => ({
      ID: s.exam_id,
      Ad: s.first_name,
      Soyad: s.last_name,
      Sinif: s.class,
      Tel1: s.phone1,
      Tel2: s.phone2
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Şagirdlər");
    XLSX.writeFile(wb, "Imtahan_Siyahisi.xlsx");
  }

  async function saveEdit(e: any) {
    e.preventDefault();
    if (!editingStudent) return;
    await supabase.from("students").update({
      first_name: editingStudent.first_name,
      last_name: editingStudent.last_name,
      parent_name: editingStudent.parent_name,
      class: editingStudent.class,
      phone1: editingStudent.phone1,
      phone2: editingStudent.phone2
    }).eq("exam_id", editingStudent.exam_id);
    setEditingStudent(null);
    fetchStudents();
  }

  async function deleteStudent(id: string) {
    if (!confirm("Silinsin?")) return;
    await supabase.from("students").delete().eq("exam_id", id);
    fetchStudents();
  }

  const filteredStudents = students.filter(s => {
    const t = search.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(t) ||
      s.last_name.toLowerCase().includes(t) ||
      s.exam_id.includes(t)
    );
  });

  /* ================== PDF UPLOAD ================== */
  async function uploadResultPdf(e: any) {
    e.preventDefault();
    const file = e.target.pdf.files[0];
    if (!file) return;

    setPdfUploading(true);
    setPdfMessage("");

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd
    });

    const json = await res.json();
    setPdfUploading(false);

    if (json.error) setPdfMessage("❌ " + json.error);
    else setPdfMessage("✅ Nəticə bazaya yazıldı");
  }

  /* ================== LOGIN UI ================== */
  if (!isAuthenticated) {
    return (
      <div style={styles.center}>
        <form onSubmit={handleLogin} style={styles.login}>
          <h2>Admin Panel</h2>
          <input
            type="password"
            placeholder="Şifrə"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            style={styles.input}
          />
          <button style={styles.btnPrimary}>Daxil ol</button>
        </form>
      </div>
    );
  }

  /* ================== MAIN UI ================== */
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Admin İdarəetmə</h1>
        <div>
          <button onClick={fetchStudents} style={styles.btnSecondary}>Yenilə</button>
          <button onClick={exportToExcel} style={styles.btnSuccess}>Excel</button>
        </div>
      </div>

      {/* PDF CARD */}
      <div style={styles.card}>
        <h2>📄 Nəticə PDF yüklə</h2>
        <form onSubmit={uploadResultPdf}>
          <input type="file" name="pdf" accept="application/pdf" style={styles.input}/>
          <button disabled={pdfUploading} style={styles.btnPrimary}>
            {pdfUploading ? "Yüklənir..." : "PDF yüklə"}
          </button>
        </form>
        {pdfMessage && <p>{pdfMessage}</p>}
      </div>

      {/* SETTINGS */}
      <div style={styles.card}>
        <h2>🔗 İmtahan Linkləri</h2>
        {settingsLoading ? "Yüklənir..." : (
          <div style={styles.grid}>
            {settings.map(s => (
              <div key={s.id}>
                <label>{s.label}</label>
                <div style={{display:"flex", gap:5}}>
                  <input id={s.key} defaultValue={s.value} style={styles.inputSmall}/>
                  <button onClick={()=>{
                    const v = (document.getElementById(s.key) as HTMLInputElement).value;
                    updateSetting(s.key, v);
                  }}>💾</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STUDENTS */}
      <h2>👨‍🎓 Şagirdlər ({students.length})</h2>
      <input placeholder="Axtar..." value={search} onChange={e=>setSearch(e.target.value)} style={styles.input}/>

      <table style={styles.table}>
        <thead>
          <tr><th>ID</th><th>Ad</th><th>Sinif</th><th>Tel</th><th></th></tr>
        </thead>
        <tbody>
          {filteredStudents.map(s=>(
            <tr key={s.exam_id}>
              <td>{s.exam_id}</td>
              <td>{s.first_name} {s.last_name}</td>
              <td>{s.class}</td>
              <td>{s.phone1}</td>
              <td>
                <button onClick={()=>setEditingStudent(s)}>✏️</button>
                <button onClick={()=>deleteStudent(s.exam_id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================== STYLES ================== */
const styles:any = {
  center:{height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"},
  login:{background:"#fff",padding:30,borderRadius:8,width:300},
  container:{maxWidth:1200,margin:"0 auto",padding:20},
  header:{display:"flex",justifyContent:"space-between",marginBottom:20},
  card:{background:"#f8fafc",padding:20,borderRadius:8,marginBottom:20},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10},
  input:{width:"100%",padding:10,marginBottom:10},
  inputSmall:{width:"100%",padding:8},
  table:{width:"100%",borderCollapse:"collapse"},
  btnPrimary:{padding:10,background:"#2563eb",color:"#fff",border:"none"},
  btnSecondary:{padding:10,background:"#64748b",color:"#fff",border:"none"},
  btnSuccess:{padding:10,background:"#16a34a",color:"#fff",border:"none"}
};
