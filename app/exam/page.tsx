"use client";
import { useState, useEffect } from "react";
import Image from "next/image"; 
import { createClient } from "@supabase/supabase-js"; // Supabase əlavə etdik

// Supabase-i işə salırıq
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ examId: string; already: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  // --- YENİ: İmtahana Giriş üçün State-lər ---
  const [entryCode, setEntryCode] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);
  // -------------------------------------------

  const styles = getStyles(darkMode);

  useEffect(() => {
    setAnimKey((prev) => prev + 1);
  }, [result]);

  function onlyLetters(e: any) {
    e.target.value = e.target.value.replace(/[^a-zA-ZəƏğĞıİöÖşŞüÜçÇ\s]/g, "");
  }

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  // --- 1. FORM QEYDİYYAT FUNKSİYASI ---
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
          firstName, lastName, fatherName, operator1, phone7_1, operator2, phone7_2, className,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Xəta oldu");
        setLoading(false);
        return;
      }
      setResult({ examId: data.examId, already: !!data.already });
    } catch {
      setError("İnternet/Server xətası");
    } finally {
      setLoading(false);
    }
  }

  // --- 2. YENİ: İMTAHANA GİRİŞ FUNKSİYASI ---
  async function enterExam() {
    if (!entryCode) return alert("Zəhmət olmasa İmtahan Kodunu yazın!");
    setEntryLoading(true);

    try {
      // A. Şagirdi tap
      const { data: student, error: stError } = await supabase
        .from("students")
        .select("class, first_name")
        .eq("exam_id", entryCode.trim())
        .single();

      if (stError || !student) throw new Error("Kod yanlışdır və ya tapılmadı.");

      // B. Sinif rəqəmini təmizlə (Məs: '5-ci' -> '5')
      const classNum = student.class.toString().replace(/\D/g, ""); 
      const key = `class_${classNum.padStart(2, "0")}_link`; // class_05_link

      // C. Linki gətir
      const { data: setting, error: setError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", key)
        .single();

      if (setError || !setting?.value) throw new Error(`Sizin sinif (${classNum}-ci) üçün imtahan linki hələ aktiv deyil.`);

      // D. Yönləndir
      alert(`Uğurlu! ${student.first_name}, imtahana yönləndirilirsən...`);
      window.location.href = setting.value;

    } catch (err: any) {
      alert(err.message);
    } finally {
      setEntryLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      
      {/* ARXA PLAN (Background) */}
      <div style={{ position: "fixed", height: "100vh", width: "100vw", overflow: "hidden", zIndex: -1 }}>
        <Image src="/logo.png" alt="Background" fill quality={100} style={{ objectFit: "cover", opacity: 0.10 }} />
      </div>

      <button onClick={() => setDarkMode(!darkMode)} style={styles.themeToggle} title="Rejimi dəyiş">
        {darkMode ? "☀️" : "🌙"}
      </button>

      {result ? (
        <div key="result-card" style={styles.card}>
           <div style={styles.logoWrapper}>
            <Image src="/logo.png" alt="Logo" width={120} height={60} style={{ objectFit: "contain" }} />
          </div>

          <h1 style={styles.title}>
            {result.already ? "Siz artıq keçmisiniz ✅" : "Qeydiyyat tamamlandı ✅"}
          </h1>
          
          <p style={{ textAlign: "center", marginTop: 10, color: styles.textMain }}>Şagird ID-niz:</p>
          <h2 style={styles.idBox}>{result.examId}</h2>
          
          {/* Nəticə ekranında da İmtahana giriş düyməsi olsun */}
          <div style={{ marginTop: 20, paddingTop: 15, borderTop: `1px dashed ${styles.borderColor}` }}>
             <p style={{textAlign:'center', fontSize: 14, marginBottom: 5, color: styles.textLabel}}>İmtahan vaxtıdır?</p>
             <button style={{...styles.button, background: "#ef4444"}} onClick={() => {
                setEntryCode(result.examId); // Avtomatik kodu yazsın
                setTimeout(enterExam, 500);  // Yarım saniyə sonra daxil olsun
             }}>
                İmtahana Başla 🚀
             </button>
          </div>

          <button style={styles.secondaryBtn} onClick={() => setResult(null)}>Geri</button>
        </div>
      ) : (
        <div key="form-card" style={styles.card}>
          
          <div style={styles.logoWrapper}>
            <Image src="/logo.png" alt="Logo" width={220} height={110} style={{ objectFit: "contain" }} priority />
          </div>

          <h1 style={styles.title}>İmtahan Qeydiyyatı</h1>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <form onSubmit={submitForm}>
            <input name="firstName" placeholder="Ad" onInput={onlyLetters} required style={styles.input} />
            <input name="lastName" placeholder="Soyad" onInput={onlyLetters} required style={styles.input} />
            <input name="fatherName" placeholder="Valideyn adı" onInput={onlyLetters} required style={styles.input} />

            <div style={styles.phoneLabel}>Telefon 1</div>
            <div style={styles.phoneRow}>
              <input value="+994" disabled style={styles.prefix} />
              <select name="operator1" required style={styles.operator}>
                <option value="">Kod</option>
                <option value="50">50</option>
                <option value="51">51</option>
                <option value="55">55</option>
                <option value="70">70</option>
                <option value="77">77</option>
                <option value="99">99</option>
              </select>
              <input name="phone7_1" placeholder="1234567" maxLength={7} onInput={onlyNumbers} required style={styles.number} />
            </div>

            <div style={styles.phoneLabel}>Telefon 2</div>
            <div style={styles.phoneRow}>
              <input value="+994" disabled style={styles.prefix} />
              <select name="operator2" required style={styles.operator}>
                <option value="">Kod</option>
                <option value="50">50</option>
                <option value="51">51</option>
                <option value="55">55</option>
                <option value="70">70</option>
                <option value="77">77</option>
                <option value="99">99</option>
              </select>
              <input name="phone7_2" placeholder="1234567" maxLength={7} onInput={onlyNumbers} required style={styles.number} />
            </div>

            <select name="className" required style={styles.input}>
              <option value="">Sinif seçin</option>
              <option value="1">1-ci sinif</option>
              <option value="2">2-ci sinif</option>
              <option value="3">3-cü sinif</option>
              <option value="4">4-cü sinif</option>
              <option value="5">5-ci sinif</option>
              <option value="6">6-cı sinif</option>
              <option value="7">7-ci sinif</option>
              <option value="8">8-ci sinif</option>
              <option value="9">9-cu sinif</option>
              <option value="10">10-cu sinif</option>
              <option value="11">11-ci sinif</option>
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
              {loading ? "Gözləyin..." : "Yadda saxla"}
            </button>
          </form>

          {/* --- YENİ HİSSƏ: İMTAHANA GİRİŞ --- */}
          <div style={{ 
            marginTop: "30px", 
            paddingTop: "20px", 
            borderTop: `1px dashed ${styles.borderColor}`,
            textAlign: "center" 
          }}>
            <h3 style={{fontSize: "16px", margin: "0 0 10px 0", color: styles.textMain}}>Artıq qeydiyyatlısan?</h3>
            <div style={{display: "flex", gap: "8px"}}>
               <input 
                  placeholder="İmtahan ID (Kod)" 
                  value={entryCode}
                  onChange={(e) => setEntryCode(e.target.value)}
                  style={{...styles.input, marginBottom: 0, textAlign: 'center', letterSpacing: 1}}
               />
               <button 
                  onClick={enterExam}
                  disabled={entryLoading}
                  style={{
                    ...styles.button, 
                    marginTop: 0, 
                    width: "auto", 
                    background: "#dc2626", // Qırmızı rəng
                    padding: "0 20px"
                  }}
               >
                 {entryLoading ? "..." : "GİR ▶"}
               </button>
            </div>
          </div>
          {/* ---------------------------------- */}

        </div>
      )}

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const getStyles = (isDark: boolean): any => {
  const colors = {
    bgBase: isDark ? "#0f172a" : "#f1f5f9", 
    cardBg: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
    textMain: isDark ? "#f1f5f9" : "#1e293b",
    textLabel: isDark ? "#cbd5e1" : "#334155",
    inputBg: isDark ? "#0f172a" : "#fff",
    inputBorder: isDark ? "#475569" : "#cbd5e1",
    inputPrefixBg: isDark ? "#1e293b" : "#f1f5f9",
    inputText: isDark ? "#fff" : "#000",
  };

  const commonInput = {
    borderRadius: "10px",
    border: `1px solid ${colors.inputBorder}`,
    background: colors.inputBg,
    color: colors.inputText,
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease-in-out",
  };

  return {
    page: {
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      backgroundColor: colors.bgBase,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Inter, Arial",
      padding: "16px",
      overflowX: "hidden",
    },
    themeToggle: {
      position: "absolute",
      top: "20px",
      right: "20px",
      background: isDark ? "#334155" : "#fff",
      border: "1px solid",
      borderColor: isDark ? "#475569" : "#cbd5e1",
      borderRadius: "50%",
      width: "44px",
      height: "44px",
      cursor: "pointer",
      fontSize: "20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      zIndex: 10,
      transition: "all 0.3s ease",
    },
    card: {
      background: colors.cardBg,
      padding: "20px 24px 24px 24px",
      borderRadius: "14px",
      width: "100%",
      maxWidth: "400px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
      boxSizing: "border-box",
      color: colors.textMain,
      animation: "slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      transition: "background 0.3s ease, color 0.3s ease",
    },
    logoWrapper: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "10px",
    },
    title: {
      textAlign: "center",
      marginBottom: "14px",
      fontSize: "22px",
      lineHeight: "1.2",
      color: colors.textMain,
      marginTop: "0px",
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
      animation: "slideUpFade 0.3s ease-out",
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "14px",
      ...commonInput,
    },
    phoneLabel: {
      fontSize: "13px",
      fontWeight: 700,
      color: colors.textLabel,
      marginBottom: "6px",
    },
    phoneRow: {
      display: "flex",
      gap: "6px",
      marginBottom: "14px",
      width: "100%",
    },
    prefix: {
      width: "55px",
      textAlign: "center",
      padding: "12px 4px",
      ...commonInput,
      background: colors.inputPrefixBg,
    },
    operator: {
      width: "90px",
      padding: "12px 4px",
      ...commonInput,
    },
    number: {
      flex: 1,
      padding: "12px",
      minWidth: "0",
      ...commonInput,
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
      cursor: "pointer",
      boxSizing: "border-box",
      transition: "transform 0.1s ease, opacity 0.2s",
    },
    idBox: {
      textAlign: "center",
      padding: "12px",
      borderRadius: "12px",
      background: isDark ? "#1e293b" : "#eff6ff",
      border: isDark ? "1px solid #475569" : "1px solid #bfdbfe",
      color: isDark ? "#60a5fa" : "#1d4ed8",
      marginTop: "10px",
      animation: "slideUpFade 0.5s ease-out 0.2s forwards",
      opacity: 0,
    },
    secondaryBtn: {
      width: "100%",
      marginTop: "14px",
      padding: "12px",
      ...commonInput,
      fontWeight: 700,
      cursor: "pointer",
      background: colors.inputBg,
    },
    textMain: colors.textMain,
    borderColor: colors.inputBorder, // Style-a əlavə etdim
  };
};
