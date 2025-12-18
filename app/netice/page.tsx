"use client";
import { useState } from "react";

export default function NeticePage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function checkResult() {
    if (!id) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/netice?id=${id}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Nəticə tapılmadı");
      } else {
        setResult(json);
      }
    } catch {
      setError("Server xətası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "80px auto",
        padding: 20,
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#fff",
        textAlign: "center"
      }}
    >
      <h2>📄 İmtahan Nəticəsi</h2>

      <input
        placeholder="Şagird ID-ni daxil et"
        value={id}
        onChange={e => setId(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 15,
          borderRadius: 6,
          border: "1px solid #cbd5e1"
        }}
      />

      <button
        onClick={checkResult}
        disabled={loading}
        style={{
          marginTop: 15,
          width: "100%",
          padding: 10,
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        {loading ? "Yoxlanılır..." : "Nəticəyə bax"}
      </button>

      {error && (
        <p style={{ marginTop: 15, color: "red" }}>
          ❌ {error}
        </p>
      )}

      {result && (
        <div style={{ marginTop: 20, textAlign: "left" }}>
          <p><b>Quiz:</b> {result.quiz}</p>
          <p><b>Bal:</b> {result.score} / {result.total}</p>
          <p><b>Faiz:</b> {result.percent}%</p>
          <p>
            <b>Tarix:</b>{" "}
            {new Date(result.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
