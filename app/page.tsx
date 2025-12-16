"use client";
import { useState } from "react";

export default function Home() {
  const [done, setDone] = useState(false);

  function submitForm(e) {
    e.preventDefault();
    setDone(true);
  }

  if (done) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Qeydiyyat alındı ✅</h1>
        <p>Yaxın zamanda sizinlə əlaqə saxlanılacaq.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>İmtahan Qeydiyyatı</h1>

      <form onSubmit={submitForm} style={{ maxWidth: "400px" }}>
        <label>Ad</label><br />
        <input required type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Soyad</label><br />
        <input required type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Valideyn adı</label><br />
        <input required type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Telefon 1</label><br />
        <input required type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Telefon 2</label><br />
        <input type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Sinif</label><br />
        <select required style={{ width: "100%", marginBottom: "20px" }}>
          <option value="">Sinif seçin</option>
          <option>5-ci sinif</option>
          <option>6-cı sinif</option>
          <option>7-ci sinif</option>
        </select>

        <button type="submit">Qeydiyyatdan keç</button>
      </form>
    </main>
  );
}
