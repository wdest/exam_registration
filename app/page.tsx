"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase qoşulması
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [examId, setExamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleExamEnter(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Şagirdi ID-yə görə tapırıq
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("class, first_name, last_name")
        .eq("exam_id", examId.trim()) // Boşluqları təmizləyirik
        .single();

      if (studentError || !student) {
        throw new Error("Bu İmtahan Kodu ilə şagird tapılmadı.");
      }

      // 2. Sinif nömrəsini təmizləyirik (Məsələn '5-ci' -> '5' edirik)
      // Əgər bazada sadəcə rəqəm yazmısınızsa, bu kod yenə də düz işləyəcək.
      const rawClass = student.class.toString(); 
      const classNumber = rawClass.replace(/\D/g, ""); // Sadəcə rəqəmləri saxla

      if (!classNumber) {
        throw new Error("Sizin sinif məlumatınız bazada düzgün qeyd olunmayıb.");
      }

      // 3. Açar sözü düzəldirik (Məsələn: 'class_05_link' və ya 'class_11_link')
      // padStart(2, '0') funksiyası tək rəqəmlərin qabağına 0 artırır (5 -> 05).
      const settingKey = `class_${classNumber.padStart(2, "0")}_link`;

      // 4. Həmin sinfin linkini 'settings' cədvəlindən gətiririk
      const { data: setting, error: settingError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", settingKey)
        .single();

      if (settingError || !setting?.value) {
        throw new Error(`Sizin sinif (${classNumber}-ci sinif) üçün imtahan linki hələ aktiv deyil.`);
      }

      // 5. Uğurlu! Şagirdi yönləndiririk
      // Adını salamlayıb yönləndirə bilərik
      alert(`Xoş gəldin, ${student.first_name}! İmtahana yönləndirilirsən...`);
      window.location.href = setting.value;

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo hissəsi - Əgər bazada logo varsa */}
        <h1 style={styles.title}>İmtahan Girişi</h1>
        <p style={styles.subtitle}>İmtahana başlamaq üçün kodunuzu daxil edin</p>

        <form onSubmit={handleExamEnter} style={styles.form}>
          <input
            type="text"
            placeholder="İmtahan Kodu (Məs: 12345)"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            style={styles.input}
            required
          />
          
          {errorMsg && <p style={styles.error}>{errorMsg}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Yoxlanılır..." : "İmtahana Başla 🚀"}
          </button>
        </form>

        <div style={styles.footer}>
          <p>Kodunuzu unutmusunuz? Nəzarətçi müəllimə yaxınlaşın.</p>
        </div>
      </div>
    </div>
  );
}

// Sadə və Gözəl Dizayn (Mobil uyğun)
const styles: any = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // Gözəl arxa fon
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  card: {
    background: "white",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  title: {
    margin: "0 0 10px 0",
    color: "#333",
    fontSize: "28px",
    fontWeight: "bold",
  },
  subtitle: {
    margin: "0 0 30px 0",
    color: "#666",
    fontSize: "16px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "15px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    outline: "none",
    transition: "all 0.3s",
    textAlign: "center",
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  button: {
    padding: "15px",
    fontSize: "18px",
    background: "#2563eb", // Göy rəng
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.3s",
  },
  error: {
    color: "#ef4444",
    background: "#fee2e2",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "14px",
    margin: 0,
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#94a3b8",
  },
};
