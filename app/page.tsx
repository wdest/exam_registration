"use client";
import { useState } from "react";

/* ====== KÖMƏKÇİ FUNKSİYALAR ====== */

// yalnız hərf saxla + formatla (İlk hərf böyük)
function normalizeName(value: string) {
  const onlyLetters = value.replace(/[^a-zA-ZəƏöÖüÜğĞçÇıİ\s]/g, "");
  return onlyLetters
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// yalnız rəqəm saxla, max uzunluq
function onlyDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

export default function Home() {
  const [done, setDone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [operator, setOperator] = useState("50");
  const [number, setNumber] = useState("");

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const form = e.target;

    const phone = `+994${operator}${number}`;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: normalizeName(form.firstName.value),
        lastName: normalizeName(form.lastName.value),
        parentName: normalizeName(form.parentName.value),
        phone1: phone,
        phone2: "",
        className: form.className.value,
      }),
    });

    const data = await res.json();
    setDone(data.uniqueId);
  }

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2>Qeydiyyat tamamlandı ✅</h2>
          <p>Şagird ID-niz:</p>
          <h1 style={{ color: "#2563eb" }}>{done}</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ textAlign: "center" }}>İmtahan Qeydiyyatı</h2>

        <form onSubmit={submitForm}>
          <input
            name="firstName"
            placeholder="Ad"
            required
            style={styles.input}
            onChange={(e) => (e.target.value = normalizeName(e.target.value))}
          />

          <input
            name="lastName"
            placeholder="Soyad"
            required
            style={styles.input}
            onChange={(e) => (e.target.value = normalizeName(e.target.value))}
          />

          <input
            name="parentName"
            placeholder="Ata adı"
            required
            style={styles.input}
            onChange={(e) => (e.target.value = normalizeName(e.target.value))}
          />

          {/* TELEFON */}
          <label style={styles.label}>Telefon (WhatsApp)</label>
          <div style={styles.phoneRow}>
            <div style={styles.prefix}>+994</div>

            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={styles.operator}
            >
              <option value="50">50</option>
              <option value="51">51</option>
              <option value="55">55</option>
              <option value="70">70</option>
              <option value="77">77</option>
              <option value="99">99</option>
              <option value="10">10</option>
              <option value="60">60</option>
            </select>

            <input
              placeholder="1234567"
              value={number}
              required
              style={styles.phoneInput}
              onChange={(e) => setNumber(onlyDigits(e.target.value, 7))}
            />
          </div>

          <select name="className" required style={styles.input}>
            <option value="">Sinif seçin</option>
            <option value="5">5-ci sinif</option>
            <option value="6">6-cı sinif</option>
            <option value="7">7-ci sinif</option>
          </select>

          <button
            type="submit"
            disabled={loading || number.length !== 7}
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

/* ====== STYLE ====== */
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
    background: "#fff",
    padding: "28px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
  },
  label: {
    fontSize: "14px",
    marginBottom: "6px",
    display: "block",
  },
  phoneRow: {
    display: "flex",
    gap: "6px",
    marginBottom: "12px",
  },
  prefix: {
    padding: "10px",
    background: "#e5e7eb",
    borderRadius: "6px",
    fontSize: "14px",
  },
  operator: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
  },
  phoneInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
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
