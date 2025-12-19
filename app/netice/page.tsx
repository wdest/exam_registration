"use client";
import { useState } from "react";
import Image from "next/image";
import { Search, Loader2, Trophy, GraduationCap } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [id, setId] = useState("");

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  async function submitForm(e: any) {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    setError("");

    setTimeout(() => {
      setLoading(false);
      alert("Qeydiyyat OK (demo)");
    }, 1200);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">

      {/* FON EFFEKTİ – RESULT PAGE İLƏ EYNİ */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-200 rounded-full blur-[120px] opacity-30"></div>
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-indigo-200 rounded-full blur-[120px] opacity-30"></div>

      {/* KART */}
      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white/60 backdrop-blur-sm z-10">

        {/* BAŞLIQ – RESULT PAGE İLƏ EYNİ */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-200">
              <Trophy size={42} className="text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            İmtahan Qeydiyyatı
          </h2>

          <div className="flex items-center justify-center gap-2 mt-3">
            <GraduationCap size={18} className="text-blue-500" />
            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest italic">
              Main Olympic Center
            </p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={submitForm} className="space-y-6">

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-[0.15em]">
              Şagird ID
            </label>

            <div className="relative">
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                onInput={onlyNumbers}
                placeholder="ID daxil edin"
                className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-lg text-slate-800"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <Search size={22} />
              </div>
            </div>
          </div>

          {/* BUTTON – RESULT PAGE İLƏ EYNİ */}
          <button
            type="submit"
            disabled={loading || !id}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <span className="text-lg">Qeydiyyatı Tamamla</span>
            )}
          </button>
        </form>

        {/* ERROR */}
        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl text-center">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* ALT TEXT – RESULT PAGE İLƏ EYNİ */}
      <div className="mt-12 text-center z-10">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
          Rəsmi İmtahan Portalı
        </p>
        <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
      </div>
    </div>
  );
}
