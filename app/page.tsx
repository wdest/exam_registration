"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// Supabase qoşulması
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  // --- STATE-LƏR ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Edit üçün state
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // --- GİRİŞ MƏNTİQİ ---
  function handleLogin(e: any) {
    e.preventDefault();
    // Vercel-də bu environment variable-ı əlavə etməyi unutma!
    if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      fetchStudents();
    } else {
      alert("Şifrə yanlışdır!");
    }
  }

  // --- DATA ÇƏKMƏK ---
  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Xəta: " + error.message);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  // --- EXCEL-Ə YÜKLƏMƏK ---
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

  // --- UPDATE (EDIT) ---
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

    if (error) {
      alert("Yadda saxlanmadı: " + error.message);
    } else {
      alert("Məlumat yeniləndi!");
      setEditingStudent(null);
      fetchStudents(); // Cədvəli yenilə
    }
  }

  // --- SİL (DELETE) ---
  async function deleteStudent(id: string) {
    if(!confirm("Bu şagirdi silmək istədiyinizə əminsiniz?")) return;
    
    const { error } = await supabase.from("students").delete().eq("exam_id", id);
    if(error) alert("Silinmədi: " + error.message);
    else fetchStudents();
  }

  // --- AXTARIŞ FİLTRİ ---
  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(term) ||
      s.last_name?.toLowerCase().includes(term) ||
      s.exam_id?.toString().includes(term) ||
      s.parent_name?.toLowerCase().includes(term)
    );
  });

  // --- 1. GİRİŞ EKRANI ---
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

  // --- 2. ADMIN PANEL ---
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Şagirdlər ({students.length})</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchStudents} style={styles.btnSecondary}>Yenilə</button>
          <button onClick={exportToExcel} style={styles.btnSuccess}>Excel-ə Yüklə 📥</button>
        </div>
      </div>

      {/* AXTARIŞ */}
      <input
        placeholder="Axtar: Ad, Soyad, ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...styles.input, maxWidth: "400px", marginBottom: "20px" }}
      />

      {/* CƏDVƏL */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Ad</th>
              <th style={styles.th}>Soyad</th>
              <th style={styles.th}>Valideyn</th>
              <th style={styles.th}>Sinif</th>
              <th style={styles.th}>Telefon 1</th>
              <th style={styles.th}>Telefon 2</th>
              <th style={styles.th}>Əməliyyat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 20, textAlign: "center" }}>Yüklənir...</td></tr>
            ) : filteredStudents.map((s) => (
              <tr key={s.exam_id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={styles.td}><b>{s.exam_id}</b></td>
                <td style={styles.td}>{s.first_name}</td>
                <td style={styles.td}>{s.last_name}</td>
                <td style={styles.td}>{s.parent_name}</td>
                <td style={styles.td}>{s.class}-ci</td>
                <td style={styles.td}>{s.phone1}</td>
                <td style={styles.td}>{s.phone2}</td>
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

      {/* EDIT MODAL (PƏNCƏRƏ) */}
      {editingStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Məlumatı Dəyiş</h3>
            <form onSubmit={saveEdit}>
              <label style={styles.label}>Ad</label>
              <input 
                style={styles.input} 
                value={editingStudent.first_name} 
                onChange={e => setEditingStudent({...editingStudent, first_name: e.target.value})}
              />
              <label style={styles.label}>Soyad</label>
              <input 
                style={styles.input} 
                value={editingStudent.last_name} 
                onChange={e => setEditingStudent({...editingStudent, last_name: e.target.value})}
              />
              <label style={styles.label}>Valideyn</label>
              <input 
                style={styles.input} 
                value={editingStudent.parent_name} 
                onChange={e => setEditingStudent({...editingStudent, parent_name: e.target.value})}
              />
              <label style={styles.label}>Sinif</label>
              <input 
                style={styles.input} 
                value={editingStudent.class} 
                onChange={e => setEditingStudent({...editingStudent, class: e.target.value})}
              />
               <label style={styles.label}>Telefon 1</label>
              <input 
                style={styles.input} 
                value={editingStudent.phone1} 
                onChange={e => setEditingStudent({...editingStudent, phone1: e.target.value})}
              />
              <label style={styles.label}>Telefon 2</label>
              <input 
                style={styles.input} 
                value={editingStudent.phone2} 
                onChange={e => setEditingStudent({...editingStudent, phone2: e.target.value})}
              />

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

// STILLƏR
const styles: any = {
  centerContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f1f5f9",
  },
  loginBox: {
    background: "#fff",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    width: "300px",
  },
  container: {
    padding: "20px",
    fontFamily: "sans-serif",
    background: "#fff",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    padding: "12px",
    borderBottom: "2px solid #e2e8f0",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
  },
  btnPrimary: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
  },
  btnSecondary: {
    padding: "8px 16px",
    background: "#64748b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnSuccess: {
    padding: "8px 16px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnEdit: {
    padding: "6px 10px",
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  btnDelete: {
    padding: "6px 10px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  },
  btnCancel: {
    padding: "10px 20px",
    background: "#94a3b8",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    padding: "24px",
    borderRadius: "10px",
    width: "400px",
    maxWidth: "90%",
  },
  label: {
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "4px",
    display: "block",
  },
};
