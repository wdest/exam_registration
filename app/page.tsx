"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  function onlyLetters(e: any) {
    e.target.value = e.target.value
      .replace(/[^a-zA-ZəƏğĞıİöÖşŞüÜçÇ\s]/g, "")
      .toLowerCase()
      .replace(/(^|\s)\S/g, (l: string) => l.toUpperCase());
  }

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // BURADA BACKEND YOXLAMASI OLACAQ:
    // eyni data varsa → köhnə ID qaytar
    // yoxdursa → yeni ID

    setTimeout(() => {
      setLoading(false);
      alert("Siz artıq keçmisiniz");
    }, 1200);
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>İmtahan Qeydiyyatı</h1>
        <p style={styles.centerName}>MAIN OLYMPIC CENTER</p>

        <form onSubmit={submitForm}>
          <input placeholder="Ad" onInput={onlyLetters} required style={styles.input} />
          <input placeholder="Soyad" onInput={onlyLetters} required style={styles.input} />
          <input placeholder="Ata adı" onInput={onlyLetters} required style={styles.input} />

          {/* TELEFON 1 */}
          <div style={styles.phoneRow}>
            <input value="+994" disabled style={styles.prefix} />

            <select required style={styles.operator}>
              <option value="">Operator</option>
              <option value="50">50</option>
              <option value="51">51</option>
              <option value="55">55</option>
              <option value="70">70</option>
              <option value="77">77</option>
              <option value="99">99</option>
            </select>

            <input
              placeholder="1234567"
              maxLength={7}
              onInput={onlyNumbers}
              required
              style={styles.number}
            />
          </div>

          {/* TELEFON 2 */}
          <div style={styles.phoneRow}>
            <input value="+994" disabled style={styles.prefix} />
            <input
              placeholder="İkinci telefon (istəyə bağlı)"
              onInput={onlyNumbers}
              maxLength={10}
              style={styles.number}
            />
          </div>

          <select required style={styles.input}>
            <option value="">Sinif seçin</option>
            <option>5-ci sinif</option>
            <option>6-cı sinif</option>
            <option>7-ci sinif</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Gözləyin..." : "Yadda saxla"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Inter, Arial",
  },
  card: {
    background: "#fff",
    padding: "32px",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  },
  title: {
    textAlign: "center",
    fontSize: "22px",
    marginBottom: "6px",
  },
  centerName: {
    textAlign: "center",
    color: "#f59e0b",
    fontWeight: "700",
    marginBottom: "20px",
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },
  phoneRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "14px",
  },
  prefix: {
    width: "60px",
    textAlign: "center",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    background: "#f1f5f9",
  },
  operator: {
    width: "100px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },
  number: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
  },
};
