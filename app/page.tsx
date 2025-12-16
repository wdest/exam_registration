export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>İmtahan Qeydiyyatı</h1>

      <form style={{ maxWidth: "400px" }}>
        <label>Ad</label><br />
        <input type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Soyad</label><br />
        <input type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Valideyn adı</label><br />
        <input type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Telefon 1</label><br />
        <input type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Telefon 2</label><br />
        <input type="text" style={{ width: "100%", marginBottom: "10px" }} />

        <label>Sinif</label><br />
        <select style={{ width: "100%", marginBottom: "20px" }}>
          <option>5-ci sinif</option>
          <option>6-cı sinif</option>
          <option>7-ci sinif</option>
        </select>

        <button type="submit">Qeydiyyatdan keç</button>
      </form>
    </main>
  );
}
