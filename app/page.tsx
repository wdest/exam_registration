"use client";
import { useState } from "react";

export default function Home() {
  const [done, setDone] = useState<string | null>(null);

  async function submitForm(e: any) {
    e.preventDefault();

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

  if (done) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Qeydiyyat tamamlandı ✅</h1>
        <p>Şagird ID-niz:</p>
        <h2>{done}</h2>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>İmtahan Qeydiyyatı</h1>

      <form onSubmit={submitForm} style={{ maxWidth: "400px" }}>
        <label>Ad</label><br />
        <input required />

        <label>Soyad</label><br />
        <input required />

        <label>Valideyn adı</label><br />
        <input required />

        <label>Telefon 1</label><br />
        <input required />

        <label>Telefon 2</label><br />
        <input />

        <label>Sinif</label><br />
        <select required>
          <option value="">Sinif seçin</option>
          <option>5-ci sinif</option>
          <option>6-cı sinif</option>
          <option>7-ci sinif</option>
        </select>

        <br /><br />
        <button type="submit">Qeydiyyatdan keç</button>
      </form>
    </main>
  );
}
