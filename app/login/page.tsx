"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<"student" | "teacher" | "admin">("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleTabChange = (type: "student" | "teacher" | "admin") => {
    setLoginType(type);
    setIdentifier("");
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: loginType, identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Giriş uğursuz oldu");
      }

      if (data.redirect) {
        router.push(data.redirect);
        router.refresh();
      }
    } catch (error: any) {
      alert("Xəta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Giriş</h1>

        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            type="button"
            className={`flex-1 py-2 ${loginType === "student" ? "border-b-2 border-blue-600 font-bold text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => handleTabChange("student")}
          >
            Şagird
          </button>
          <button
            type="button"
            className={`flex-1 py-2 ${loginType === "teacher" ? "border-b-2 border-blue-600 font-bold text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => handleTabChange("teacher")}
          >
            Müəllim
          </button>
          <button
            type="button"
            className={`flex-1 py-2 ${loginType === "admin" ? "border-b-2 border-blue-600 font-bold text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => handleTabChange("admin")}
          >
            Admin
          </button>
        </div>

        {loginType === "student" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Şagird Kodu</label>
            <input
              type="text"
              placeholder="Şagird kodunu daxil edin"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
        )}

        {loginType === "teacher" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">İstifadəçi adı</label>
              <input
                type="text"
                placeholder="İstifadəçi adı"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Şifrə</label>
              <input
                type="password"
                placeholder="Şifrə"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>
          </>
        )}

        {loginType === "admin" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Şifrəsi</label>
            <input
              type="password"
              placeholder="Şifrə"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>
        )}

        <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
          {loading ? "Giriş edilir..." : "Daxil Ol"}
        </button>
      </form>
    </div>
  );
}
