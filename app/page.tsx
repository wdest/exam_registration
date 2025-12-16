"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const f = e.target;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: f.firstName.value,
        lastName: f.lastName.value,
        fatherName: f.fatherName.value,
        phone:
          "+994" + f.operator.value + f.phoneEnd.value,
        className: f.className.value,
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
          <p>Şagird ID:</p>
          <h1>{done}</h1>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>İmtahan Qeydiyyatı</h2>

        <form onSubmit={submitForm}>
          <input name="firstName" placeholder="Ad" required pattern="[A-Za-zƏəÖöÜüĞğÇçİıŞş ]+" style={styles.input} />
          <input name="lastName" placeholder="Soyad" required pattern="[A-Za-zƏəÖöÜüĞğÇçİıŞş ]+" style={styles.input} />
          <input name="fatherName" placeholder="Ata adı" required pattern="[A-Za-zƏəÖöÜüĞğÇçİıŞş ]+" style={styles.input} />

          <div style={{ display: "flex", gap: "6px" }}>
            <input value="+994" disabled style={{ width: "60px", ...styles.input }} />
            <select name="operator" required style={{ width: "70px", ...styles.input }}>
              <option value="">Op</option>
              <option>50</option><option>51</option><option>55</option>
              <option>70</option><option>77</option><option>99</option>
            </select>
            <input
              name="phoneEnd"
              placeholder="1234567"
              maxLength={7}
              pattern="[0-9]{7}"
              required
              style={{ flex: 1, ...styles.input }}
            />
          </div>

          <select name="className" required style={styles.input}>
            <option value="">Sinif seçin</option>
            <option>5</option><option>6</option><option>7</option>
          </select>

          <button disabled={loading} style={styles.button}>
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
    background:
      "linear-gradient(rgba(255,255,255,0.9),rgba(255,255,255,0.9)), url('/logo.png') center/300px no-repeat",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: 12,
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};
