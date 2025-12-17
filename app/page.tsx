"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function onlyLetters(e: any) {
    e.target.value = e.target.value.replace(
      /[^a-zA-ZəƏğĞıİöÖşŞüÜçÇ\s]/g,
      ""
    );
  }

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    // 🔴 BURADA BACKEND OLMALIDIR
    // indi demo üçün ID veririk
    setTimeout(() => {
      setLoading(false);
      setResultId("A7F3K92Q"); // random ID demo
    }, 1200);
  }

  if (resultId) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>Siz artıq keçmisiniz ✅</h1>
          <p style={{ textAlign: "center" }}>Şagird ID-niz:</p>
          <h2 style={styles.id}>{resultId}</h2>

          <div style={styles.subTitle}>MAIN OLYMPIC CENTER</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>İmtahan Qeydiyyatı</h1>
        <div style={styles.subTitle}>MAIN OLYMPIC CENTER</div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submitForm}>
          <input
            placeholder="Ad"
            required
            onInput={onlyLetters}
            style={styles.input}
          />

          <input
            placeholder="Soyad"
            required
            onInput={onlyLetters}
            style={styles.input}
          />

          <input
            placeholder="Ata adı"
            required
            onInput={onlyLetters}
            style={styles.input}
          />

          {/* TELEFON 1 */}
          <label style={styles.label}>Telefon 1</label>
          <div style={styles.phoneRow}>
            <input value="+994" disabled style={styles.prefix} />

            <select required style={styles.operator}>
              <option value="">Operator</option>
              <option>50</option>
              <option>51</option>
              <option>55</option>
              <option>70</option>
              <option>77</option>
              <option>99</option>
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
          <label style={styles.label}>Telefon 2</label>
          <div style={styles.phoneRow}>
            <input value="+994" disabled style={styles.prefix} />

            <select required style={styles.operator}>
              <option value="">Operator</option>
              <option>50</option>
              <option>51</option>
              <option>55</option>
              <option>70</option>
              <option>77</option>
              <option>99</option>
            </select>

            <input
              placeholder="1234567"
              maxLength={7}
              onInput={onlyNumbers}
              required
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
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
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
    padding: "16px",
    fontFamily: "Inter, Arial",
  },

  card: {
    background: "#fff",
    padding: "28px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.12)",
  },

  title: {
    textAlign: "center",
    fontSize: "22px",
    marginBottom: "6px",
  },

  subTitle: {
    textAlign: "center",
    fontWeight: "700",
    color: "#f59e0b",
    marginBottom: "20px",
    letterSpacing: "0.5px",
  },

  id: {
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "700",
    color: "#4f46e5",
    margin: "12px 0",
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "6px",
    display: "block",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },

  /* 🔑 MOBİL FIX BURADADIR */
  phoneRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
    marginBottom: "14px",
  },

  prefix: {
    width: "100%",
    textAlign: "center",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f1f5f9",
    padding: "10px",
  },

  operator: {
    width: "100%",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "10px",
  },

  number: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
  },

  button: {
    width: "100%",
    padding: "14px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
  },

  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "10px",
    borderRadius: "10px",
    marginBottom: "14px",
    textAlign: "center",
    fontSize: "14px",
  },
};
