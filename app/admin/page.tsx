"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

/* ================== TYPES ================== */
interface Student {
  exam_id: string;
  first_name: string;
  last_name: string;
  parent_name?: string;
  class: string;
  phone1: string;
  phone2?: string;
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
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  /* ================== AUTH ================== */
  function login(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuth(true);
      loadStudents();
      loadSettings();
    } else {
      alert("Şifrə yanlışdır");
    }
  }

  /* ================== DATA ================== */
  async function loadStudents() {
    setLoading(true);
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    setStudents((data as Student[]) || []);
    setLoading(false);
  }

  async function loadSettings() {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .order("id", { ascending: true });

    setSettings((data as Setting[]) || []);
  }

  async function updateSetting(key: string, value: string) {
    await supabase.from("settings").update({ value }).eq("key", key);
    loadSettings();
  }

  /* ================== EXCEL ================== */
  function exportExcel() {
    const rows = students.map(s => ({
      ID: s.exam_id,
      Ad: s.first_name,
      Soyad: s.last_name,
      Valideyn: s.parent_name,
      Sinif: s.class,
      Telefon: s.phone1,
      Telefon2: s.phone2,
      Tarix: s.created_at
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Qeydiyyat");
    XLSX.writeFile(wb, "Qeydiyyat.xlsx");
  }

  /* ================== PDF ================== */
  async function uploadPdf(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const file = form.pdf.files[0];

    if (!file) {
      setPdfMessage("❌ PDF seçilməyib");
      return;
    }

    setPdfUploading(true);
    setPdfMessage("");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: new FormData(form)
      });

      const json = await res.json();
      setPdfMessage(json.error ? "❌ " + json.error : "✅ PDF yükləndi");
    } catch {
      setPdfMessage("❌ Server xətası");
    } finally {
      setPdfUploading(false);
      form.reset();
    }
  }

  /* ================== LOGIN UI ================== */
  if (!isAuth) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={login} style={styles.loginBox}>
          <div style={styles.loginHeader}>
  <img src="/desttex.png" alt="DestTex" style={styles.logoLeft} />
  <h2>Admin Panel</h2>
</div>


          <input
            type="password"
            placeholder="Admin şifrəsi"
            value={password}
            onChange={e => setPassword(e.target.value)}
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
        <h1>Admin Panel</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={loadStudents} style={styles.btnSecondary}>Yenilə</button>
          <button onClick={exportExcel} style={styles.btnSuccess}>Excel</button>
        </div>
      </div>

      {/* PDF */}
      <div style={styles.card}>
        <h3>📄 Nəticə PDF</h3>
        <form onSubmit={uploadPdf} style={{ display: "flex", gap: 6 }}>
          <input type="file" name="pdf" accept="application/pdf" />
          <button disabled={pdfUploading} style={styles.btnPrimary}>Yüklə</button>
        </form>
        {pdfMessage && <p>{pdfMessage}</p>}
      </div>

      {/* SETTINGS */}
      <div style={styles.card}>
        <h3>🔗 Linklər</h3>
        <div style={styles.grid}>
          {settings.map(s => (
            <div key={s.id}>
              <label>{s.label}</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input defaultValue={s.value} id={s.key} style={styles.inputSmall} />
                <button
                  onClick={() =>
                    updateSetting(
                      s.key,
                      (document.getElementById(s.key) as HTMLInputElement).value
                    )
                  }
                  style={styles.btnPrimary}
                >
                  💾
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STUDENTS */}
      <h2>👨‍🎓 Qeydiyyat ({students.length})</h2>
      <input
        placeholder="Axtarış..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...styles.input, maxWidth: 350 }}
      />

      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Ad Soyad</th>
              <th>Valideyn</th>
              <th>Sinif</th>
              <th>Telefon</th>
              <th>Tarix</th>
            </tr>
          </thead>
          <tbody>
            {students
              .filter(s =>
                `${s.first_name} ${s.last_name} ${s.exam_id}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map(s => (
                <tr key={s.exam_id}>
                  <td>{s.exam_id}</td>
                  <td>{s.first_name} {s.last_name}</td>
                  <td>{s.parent_name}</td>
                  <td>{s.class}</td>
                  <td>{s.phone1}</td>
                  <td>
                    {s.created_at &&
                      new Date(s.created_at).toLocaleString("az-AZ")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================== STYLES ================== */
const styles: any = {
  loginWrap: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9"
  },
  loginBox: {
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    width: 320,
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,.1)"
  },
  logo: {
    width: 120,
    marginBottom: 15
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },
  card: {
    background: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
    gap: 10
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #cbd5e1"
  },
  inputSmall: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #cbd5e1"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  btnPrimary: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6
  },
  btnSecondary: {
    background: "#64748b",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6
  },
  btnSuccess: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6
  }
};
