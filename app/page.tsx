"use client";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ uniqueId: string; already: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onlyLetters(e: any) {
    e.target.value = e.target.value.replace(/[^a-zA-ZəƏğĞıİöÖşŞüÜçÇ\s]/g, "");
  }

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    const f = e.target;

    const firstName = f.firstName.value;
    const lastName = f.lastName.value;
    const fatherName = f.fatherName.value;

    const operator1 = f.operator1.value;
    const phone7_1 = f.phone7_1.value;

    const operator2 = f.operator2.value;
    const phone7_2 = f.phone7_2.value;

    const className = f.className.value;

    if (phone7_1.length !== 7 || phone7_2.length !== 7) {
      setLoading(false);
      setError("7 rəqəm tam yazılmalıdır.");
      return;
    }
    if (operator1 && operator2 && operator1 === operator2 && phone7_1 === phone7_2) {
      setLoading(false);
      setError("Telefon 2, Telefon 1-dən fərqli olmalıdır.");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          fatherName,
          operator1,
          phone7_1,
          operator2,
          phone7_2,
          className,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Xəta oldu");
        setLoading(false);
        return;
      }

      setResult({ uniqueId: data.uniqueId, already: !!data.already });
    } catch {
      setError("İnternet/Server xətası");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>
            {result.already ? "Siz artıq keçmisiniz ✅" : "Qeydiyyat tamamlandı ✅"}
          </h1>

          <div style={styles.subBrand}>MAIN OLYMPIC CENTER</div>

          <p style={{ textAlign: "center", marginTop: 16 }}>Şagird ID-niz:</p>
          <h2 style={styles.idBox}>{result.uniqueId}</h2>

          <button style={styles.secondaryBtn} onClick={() => setResult(null)}>
            Geri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>İmtahan Qeydiyyatı</h1>
        <div style={styles.subBrand}>MAIN OLYMPIC CENTER</div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        <form onSubmit={submitForm}>
          <input
            name="firstName"
            placeholder="Ad"
            onInput={onlyLetters}
            required
            style={styles.input}
          />
          <input
            name="lastName"
            placeholder="Soyad"
            onInput={onlyLetters}
            required
            style={styles.input}
          />
          <input
            name="fatherName"
            placeholder="Ata adı"
            onInput={onlyLetters}
            required
            style={styles.input}
          />

          {/* TELEFON 1 */}
          <div style={styles.phoneLabel}>Telefon 1</div>
          <div style={styles.phoneRow}>
            <input value="+994" disabled style={styles.prefix} />
            <select name="operator1" required style={styles.operator}>
              <option value="">Operator</option>
              <option value="50">50</option>
              <option value="51">51</option>
              <option value="55">55</option>
              <option value="70">70</option>
              <option value="77">77</option>
              <option value="99">99</option>
            </select>
            <input
              name="phone7_1"
              placeholder="1234567"
              maxLength={7}
              onInput={onlyNumbers}
              required
              style={styles.number}
            />
          </div>

          {/* TELEFON 2 */}
          <div style={styles.phoneLabel}>Telefon 2</div>
          <div style={styles.phoneRow}>
            <input value="+994" disabled style={styles.prefix} />
            <select name="operator2" required style={styles.operator}>
              <option value="">Operator</option>
              <option value="50">50</option>
              <option value="51">51</option>
              <option value="55">55</option>
              <option value="70">70</option>
              <option value="77">77</option>
              <option value="99">99</option>
            </select>
            <input
              name="phone7_2"
              placeholder="1234567"
              maxLength={7}
              onInput={onlyNumbers}
              required
              style={styles.number}
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
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={styles.spinner} />
                <span style={{ marginLeft: 8 }}>Gözləyin...</span>
              </span>
            ) : (
              "Yadda saxla"
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
    padding: "18px",
  },
  card: {
    background: "#fff",
    padding: "28px",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "380px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
  },
  title: {
    textAlign: "center",
    marginBottom: "8px",
    fontSize: "22px",
  },
  subBrand: {
    textAlign: "center",
    fontWeight: 800,
    letterSpacing: "0.5px",
    color: "#f59e0b",
    marginBottom: "18px",
  },
  errorBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "14px",
    marginBottom: "14px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },
  phoneLabel: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "6px",
  },
  phoneRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "14px",
  },
  prefix: {
    width: "62px",
    textAlign: "center",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#f1f5f9",
    padding: "12px 8px",
    fontSize: "15px",
  },
  operator: {
    width: "110px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "12px 8px",
    fontSize: "15px",
    background: "#fff",
  },
  number: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 800,
    marginTop: "8px",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #ffffff",
    borderTop: "2px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  idBox: {
    textAlign: "center",
    padding: "12px",
    borderRadius: "12px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    marginTop: "10px",
  },
  secondaryBtn: {
    width: "100%",
    marginTop: "14px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
