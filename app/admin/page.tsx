"use client";

import { useState } from "react";
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
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    setStudents((data as Student[]) || []);
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

  /* ================== LOGIN UI ================== */
  if (!isAuth) {
    return (
      <div style={styles.loginWrap}>
        <form onSubmit={login} style={styles.loginBox}>
          <div style={styles.loginHeader}>
            <img src="/desttex.png" alt="DestTex" style={styles.logoLeft} />
            <div>
              <h2 style={styles.loginTitle}>Admin Panel</h2>
              <p style={styles.loginSubtitle}>İdarəetmə paneli</p>
            </div>
          </div>

          <input
            type="password"
            placeholder="Admin şifrəsi"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={styles.input}
          />

          <button style={{ ...styles.btnPrimary, width: "100%", marginTop: 12 }}>
            Daxil ol
          </button>
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

      {/* SETTINGS */}
      <div style={styles.card}>
        <h3>🔗 Linklər</h3>
        <div style={styles.grid}>
          {settings.map(s => (
            <div key={s.id}>
              <label style={{ fontSize: 12 }}>{s.label}</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input id={s.key} defaultValue={s.value} style={styles.inputSmall} />
                <button
                  style={styles.btnPrimary}
                  onClick={() =>
                    updateSetting(
                      s.key,
                      (document.getElementById(s.key) as HTMLInputElement).value
                    )
                  }
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
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ad Soyad</th>
              <th style={styles.th}>Valideyn</th>
              <th style={styles.th}>Sinif</th>
              <th style={styles.th}>Telefon</th>
              <th style={styles.th}>Telefon 2</th>
              <th style={styles.th}>Tarix</th>
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
                <tr key={s.exam_id} style={styles.tr}>
                  <td style={styles.td}>{s.exam_id}</td>
                  <td style={styles.td}>{s.first_name} {s.last_name}</td>
                  <td style={styles.td}>{s.parent_name}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>{s.class}</td>
                  <td style={styles.td}>{s.phone1}</td>
                  <td style={styles.td}>{s.phone2 || "-"}</td>
                  <td style={styles.td}>
                    {s.created_at && new Date(s.created_at).toLocaleString("az-AZ")}
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
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)"
  },

  loginBox: {
    background: "#ffffff",
    padding: "28px 32px",
    borderRadius: 16,
    width: 360,
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)"
  },

  loginHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24
  },

  logoLeft: {
    width: 48,
    height: 48,
    objectFit: "contain"
  },

  loginTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: "#0f172a",
    lineHeight: "22px"
  },

  loginSubtitle: {
    margin: 0,
    fontSize: 12,
    color: "#64748b"
  },

  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px 20px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24
  },

  card: {
    background: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: "0 6px 16px rgba(0,0,0,0.04)"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14
  },

  inputSmall: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 13
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 14,
    background: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)"
  },

  th: {
    padding: "12px 14px",
    background: "#f1f5f9",
    fontSize: 13,
    fontWeight: 600,
    borderBottom: "1px solid #e5e7eb",
    userSelect: "none"
  },

  td: {
    padding: "12px 14px",
    fontSize: 14,
    borderBottom: "1px solid #f1f5f9",
    userSelect: "none"
  },

  tr: {
    transition: "background 0.15s"
  },

  btnPrimary: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer"
  },

  btnSecondary: {
    background: "#64748b",
    color: "#ffffff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer"
  },

  btnSuccess: {
    background: "#16a34a",
    color: "#ffffff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer"
  }
};
