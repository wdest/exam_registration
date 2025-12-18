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
    await supabase.from("settings").update({ value }).eq("key", key);
    fetchSettings();
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
      Telefon: s.phone1
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Şagirdlər");
    XLSX.writeFile(wb, "Imtahan_Siyahisi.xlsx");
  }

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

  /* ================== LOGIN ================== */
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
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={fetchStudents} style={styles.btnSecondary}>Yenilə</button>
          <button onClick={exportToExcel} style={styles.btnSuccess}>Excel 📥</button>
        </div>
      </div>

      {/* PDF UPLOAD – UI EYNİ */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📄 İmtahan Nəticəsi (PDF)</h2>

        <form onSubmit={uploadResultPdf}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px", gap: 8, maxWidth: 500 }}>
            <input
              type="file"
              name="pdf"
              accept="application/pdf"
              style={styles.inputSmall}
            />
            <button
              disabled={pdfUploading}
              style={{
                ...styles.btnSave,
                opacity: pdfUploading ? 0.6 : 1
              }}
            >
              💾
            </button>
          </div>

          {pdfMessage && (
            <p style={{ marginTop: 10, fontSize: 14 }}>{pdfMessage}</p>
          )}
        </form>
      </div>

      {/* SETTINGS */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>🔗 İmtahan Linkləri (Siniflər üzrə)</h2>

        {settingsLoading ? "Yüklənir..." : (
          <div style={styles.grid}>
            {settings.map(s => (
              <div key={s.id} style={styles.settingItem}>
                <label style={styles.label}>{s.label}</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    id={s.key}
                    defaultValue={s.value}
                    style={styles.inputSmall}
                  />
                  <button
                    style={styles.btnSave}
                    onClick={() => {
                      const v = (document.getElementById(s.key) as HTMLInputElement).value;
                      updateSetting(s.key, v);
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

      {/* STUDENTS */}
      <h2 style={{ marginBottom: 10 }}>👨‍🎓 Qeydiyyatdan keçənlər ({students.length})</h2>
      <input
        placeholder="Axtarış..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...styles.input, maxWidth: 400 }}
      />

      <table style={styles.table}>
        <thead>
          <tr>
            <th>ID</th><th>Ad Soyad</th><th>Sinif</th><th>Telefon</th>
          </tr>
        </thead>
        <tbody>
          {students
            .filter(s =>
              s.first_name.toLowerCase().includes(search.toLowerCase()) ||
              s.last_name.toLowerCase().includes(search.toLowerCase()) ||
              s.exam_id.includes(search)
            )
            .map(s => (
              <tr key={s.exam_id}>
                <td>{s.exam_id}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.class}</td>
                <td>{s.phone1}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================== STYLES ================== */
const styles: any = {
  center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f1f5f9" },
  login: { background: "#fff", padding: 30, borderRadius: 10, width: 300 },
  container: { maxWidth: 1200, margin: "0 auto", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },

  card: { background: "#f8fafc", padding: 20, borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 25 },
  cardTitle: { fontSize: 18, marginBottom: 15, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 15 },
  settingItem: { background: "#fff", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0" },

  input: { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 10 },
  inputSmall: { width: "100%", padding: 8, border: "1px solid #cbd5e1", borderRadius: 6 },

  table: { width: "100%", borderCollapse: "collapse", marginTop: 10 },
  label: { fontSize: 12, fontWeight: "bold", marginBottom: 4, display: "block" },

  btnPrimary: { padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6 },
  btnSecondary: { padding: "8px 16px", background: "#64748b", color: "#fff", border: "none", borderRadius: 6 },
  btnSuccess: { padding: "8px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6 },
  btnSave: { padding: "0 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontSize: 18 }
};
