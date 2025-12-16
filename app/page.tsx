"use client";
import { useState } from "react";

export default function Home() {
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return; // təkrar basmanı blokla
    setLoading(true);

    const form = e.target;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form[0].value,
          lastName: form[1].value,
          parentName: form[2].value,
          phone1: form[3].value,
          phone2: form[4].value,
          className: form[5].value,
        }),
      });

      const data = await res.json();
      setDone(data.uniqueId);
    } catch (err) {
      alert("Xəta baş verdi, yenidən cəhd edin.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1>Qeydiyyat tamamlandı ✅</h1>
          <p>Şagird ID-niz:</p>
          <h2 style={{ color: "#2563eb" }}>{done}</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>İmtahan Qeydiyyatı</h1>

        <form onSubmit={submitForm}>
          <input placeholder="Ad" required style={styles.input} />
          <input placeholder="Soyad" required style={styles.input} />
          <input placeholder="Valideyn adı" required style={styles.input} />
          <input placeholder="Telefon 1" required style={styles.input} />
          <input placeholder="Telefon 2" style={styles.input} />

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
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={styles.loadingRow}>
                <span style={styles.spinner}></span>
                <span style={{ marginLeft: 8 }}>Gözləyin...</span>
              </span>
            ) : (
              "Qeydiyyatdan keç"
            )}
          </button>
        </form>

        {/* Spinner animasiyası */}
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial",
  },
  card: {
    background: "#ffffff",
    padding: 30,
    borderRadius: 12,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 16,
  },
  loadingRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  spinner: {
    width: 16,
    height: 16,
    border: "2px solid #ffffff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};
