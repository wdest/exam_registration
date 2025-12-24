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
    background: "#f1f5f9"
  },
  loginBox: {
    background: "#fff",
    padding: 30,
    borderRadius: 12,
    width: 320,
    boxShadow: "0 10px 30px rgba(0,0,0,.1)"
  },
  loginHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20
  },
  logoLeft: {
    width: 80
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
    gap: 12
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
    borderCollapse: "collapse",
    marginTop: 12,
    background: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
  },
  th: {
    padding: "12px 14px",
    background: "#f1f5f9",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
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
