"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Loader2, ArrowLeft } from "lucide-react";

export default function Page() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  async function checkResult(e?: any) {
    if (e) e.preventDefault();
    if (!id.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/netice?id=${id.trim()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Nəticə tapılmadı");
      } else {
        setResult(json);
      }
    } catch {
      setError("Serverlə əlaqə kəsildi");
    } finally {
      setLoading(false);
    }
  }

  /* ===================== NƏTİCƏ EKRANI ===================== */
  if (result) {
    const fullName = result.students
      ? `${result.students.first_name} ${result.students.last_name}`
      : "Ad tapılmadı";

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>

        <div className="w-full max-w-md mb-6 z-10">
          <button
            onClick={() => {
              setResult(null);
              setId("");
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold px-4 py-2 bg-white rounded-2xl shadow border transition active:scale-95"
          >
            <ArrowLeft size={18} /> Yeni Axtarış
          </button>
        </div>

        <div className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] z-10 animate-in fade-in zoom-in duration-300">

          <div className="text-center mb-6">
            {/* LOGO */}
            <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-200 mb-4">
              <Image
                src="/logo.png"
                alt="Main Olympic Center Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>

            <h2 className="text-2xl font-black text-slate-800">
              Nəticə Hesabatı
            </h2>

            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-2">
              Main Olympic Center
            </p>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">
              Şagird
            </p>
            <p className="text-xl font-black text-slate-800">
              {fullName}
            </p>

            <div className="rounded-2xl bg-slate-50 p-4 border">
              <p className="font-bold text-slate-700">
                {result.quiz}
              </p>
              <p className="text-slate-600 mt-1">
                Bal: <b>{result.score}</b> / {result.total}
              </p>
              <p className="text-3xl font-black text-blue-600 mt-2">
                {result.percent}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center z-10">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
            Rəsmi İmtahan Portalı
          </p>
          <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
        </div>
      </div>
    );
  }

  /* ===================== AXTARIŞ EKRANI ===================== */
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">

      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-200 rounded-full blur-[120px] opacity-30"></div>
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-indigo-200 rounded-full blur-[120px] opacity-30"></div>

      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] z-10">

        <div className="text-center mb-10">
          {/* LOGO */}
          <div className="bg-blue-600 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-200 mb-6">
            <Image
              src="/logo.png"
              alt="Main Olympic Center Logo"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>

          <h2 className="text-3xl font-black text-slate-800">
            Nəticəni Yoxla
          </h2>

          <p className="text-blue-600 font-bold text-xs uppercase tracking-widest italic mt-3">
            Main Olympic Center
          </p>
        </div>

        <form onSubmit={checkResult} className="space-y-6">
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
                className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-lg text-slate-800"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                <Search size={22} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !id}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <span className="text-lg">Nəticəni Göstər</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl text-center">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="mt-12 text-center z-10">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">
          Rəsmi İmtahan Portalı
        </p>
        <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
      </div>
    </div>
  );
}
