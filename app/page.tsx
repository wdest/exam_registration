"use client";
import { useState } from "react";

export default function Home() {
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  async function submitForm(e: any) {
  e.preventDefault();
  if (loading) return; // ikinci dəfə basmağı blokla

  setLoading(true);

  const form = e.target;

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
}


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

          <button type="submit" style={styles.button}>
            Qeydiyyatdan keç
          </button>
        </form>
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
    padding: "30px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "360px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
