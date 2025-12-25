"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Search, Loader2, ArrowLeft, ChevronDown, Download, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import html2canvas from "html2canvas"; // Yükləmək üçün

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [id, setId] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [examList, setExamList] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  // Nəticə kartını şəkli çevirmək üçün referans
  const resultRef = useRef<HTMLDivElement>(null);

  // 1. İmtahanları gətir
  useEffect(() => {
    async function fetchExams() {
      const { data } = await supabase
        .from("exams")
        .select("name")
        .order("created_at", { ascending: false });

      if (data) {
        const uniqueNames = Array.from(new Set(data.map((item: any) => item.name)));
        setExamList(uniqueNames as string[]);
      }
    }
    fetchExams();
  }, []);

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  // 2. Nəticəni Yoxla
  async function checkResult(e?: any) {
    if (e) e.preventDefault();
    
    if (!id.trim() || !selectedExam) {
        setError("Zəhmət olmasa İmtahanı seçin və ID daxil edin");
        return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/netice?id=${id.trim()}&examName=${encodeURIComponent(selectedExam)}`);
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

  // 3. Şəkli Yükləmə Funksiyası (FIX: Keyfiyyət artırıldı)
  const downloadImage = async () => {
    if (resultRef.current) {
        setLoading(true); // Yüklənərkən gözləmə göstərək
        try {
            const canvas = await html2canvas(resultRef.current, {
                scale: 3, // Daha yüksək keyfiyyət
                useCORS: true, // Şəkillərin düzgün yüklənməsi üçün
                logging: false,
                backgroundColor: "#ffffff", // Arxa fonu ağ edirik
                windowWidth: resultRef.current.scrollWidth,
                windowHeight: resultRef.current.scrollHeight
            });
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.href = image;
            link.download = `MOC_Netice_${result.students.first_name}.png`;
            link.click();
        } catch (err) {
            console.error("Şəkil yüklənmə xətası:", err);
            setError("Şəkli yükləyərkən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    }
  };

  /* ===================== NƏTİCƏ EKRANI ===================== */
  if (result) {
    const fullName = result.students
      ? `${result.students.first_name} ${result.students.last_name}`
      : "Ad tapılmadı";

    // Məlumat yoxdursa "-" göstərmək üçün köməkçi funksiya
    const displayValue = (val: any) => (val !== null && val !== undefined ? val : "-");

    // Boş qalan sualları hesablamaq (əgər total və digərləri varsa)
    let emptyCount: any = "-";
    if (result.total && result.correct_count != null && result.wrong_count != null) {
        emptyCount = result.total - (result.correct_count + result.wrong_count);
    }

    return (
      <div className="min-h-screen bg-orange-50/30 flex flex-col items-center justify-center p-4 relative overflow-y-auto">

        {/* Arxa Fon Bəzəkləri */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-20 -ml-32 -mb-32"></div>

        {/* Düymələr Paneli */}
        <div className="w-full max-w-2xl mb-6 z-10 flex justify-between">
          <button
            onClick={() => {
              setResult(null);
              setId("");
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 font-bold px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 transition active:scale-95"
          >
            <ArrowLeft size={18} /> Geri Qayıt
          </button>

          <button
            onClick={downloadImage}
            disabled={loading}
            className="flex items-center gap-2 text-white font-bold px-5 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-200 transition active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
            {loading ? "Yüklənir..." : "Yüklə (PNG)"}
          </button>
        </div>

        {/* --- NƏTİCƏ KARTI (KARNE) --- */}
        {/* html2canvas bu div-i çəkəcək */}
        <div ref={resultRef} className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden print:shadow-none print:border-none">
          
          {/* Logo Watermark (Çapda və PNG-də daha yaxşı görünməsi üçün opacity artırıldı) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none">
             <Image src="/logo.png" alt="watermark" width={400} height={400} className="object-contain" />
          </div>

          {/* Başlıq */}
          <div className="text-center border-b-2 border-dashed border-gray-100 pb-8 mb-8 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md">M</div>
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-wide">İmtahan Nəticəsi</h2>
            </div>
            <p className="text-gray-500 font-medium">Main Olympic Center - Rəsmi Hesabat</p>
          </div>

          {/* Şagird Məlumatları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
             <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Şagird</p>
                <p className="text-xl font-black text-gray-800">{fullName}</p>
             </div>
             <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Sinif / İmtahan</p>
                <p className="text-xl font-black text-gray-800">{result.students.class}-ci Sinif | {selectedExam}</p>
             </div>
          </div>

          {/* Əsas Nəticə (Dairə) */}
          <div className="flex justify-center mb-12 relative z-10">
             <div className="relative">
                {/* Dairənin arxasında yüngül parıltı */}
                <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-30"></div>
                <div className="w-48 h-48 rounded-full border-8 border-amber-100 flex flex-col items-center justify-center bg-white shadow-xl relative z-10">
                    <span className="text-6xl font-black text-amber-500 leading-none">{displayValue(result.score)}</span>
                    <span className="text-sm text-gray-400 font-bold uppercase mt-2 tracking-wider">Ümumi Bal</span>
                </div>
                {result.percent != null && (
                    <div className="absolute -right-4 -top-2 bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg text-lg z-20 border-2 border-white">
                        {result.percent}%
                    </div>
                )}
             </div>
          </div>

          {/* Detallı Statistika (FIX: Boş dəyərlər üçün '-' yoxlaması) */}
          <div className="grid grid-cols-3 gap-4 text-center relative z-10">
             <div className="p-5 rounded-2xl bg-green-50 text-green-700 border border-green-100">
                <CheckCircle className="mx-auto mb-3 opacity-80" size={28} />
                <div className="text-3xl font-black">{displayValue(result.correct_count)}</div>
                <div className="text-xs font-bold uppercase opacity-70 mt-1">Düzgün</div>
             </div>
             <div className="p-5 rounded-2xl bg-red-50 text-red-700 border border-red-100">
                <XCircle className="mx-auto mb-3 opacity-80" size={28} />
                <div className="text-3xl font-black">{displayValue(result.wrong_count)}</div>
                <div className="text-xs font-bold uppercase opacity-70 mt-1">Səhv</div>
             </div>
             <div className="p-5 rounded-2xl bg-gray-100 text-gray-600 border border-gray-200">
                <HelpCircle className="mx-auto mb-3 opacity-80" size={28} />
                <div className="text-3xl font-black">{emptyCount}</div>
                <div className="text-xs font-bold uppercase opacity-70 mt-1">Boş</div>
             </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-end relative z-10">
             <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tarix</p>
                <p className="text-sm text-gray-600 font-medium mt-1">{new Date().toLocaleDateString("az-AZ")}</p>
             </div>
             <div className="text-right flex flex-col items-end">
                {/* Logo üçün useCORS vacibdir */}
                <Image src="/logo.png" alt="logo" width={100} height={50} className="object-contain mb-1" unoptimized />
                <p className="text-[10px] text-amber-600 font-black tracking-[0.2em] uppercase">MAIN OLYMPIC CENTER</p>
             </div>
          </div>

        </div>
        {/* html2canvas sonu */}

        <div className="mt-8 text-center text-gray-400 text-sm font-medium">
           Nəticə avtomatik formalaşdırılıb və rəsmi sənəddir.
        </div>
      </div>
    );
  }

  /* ===================== AXTARIŞ EKRANI ===================== */
  // (Bu hissə dəyişməyib, olduğu kimi qalır)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50/30 p-6 relative overflow-hidden">

      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-amber-200 rounded-full blur-[120px] opacity-30"></div>
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-orange-200 rounded-full blur-[120px] opacity-30"></div>

      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 z-10 border border-white">

        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-amber-200 mb-6 transform hover:scale-105 transition duration-500">
            <Image src="/logo.png" alt="Main Olympic Center Logo" width={64} height={64} className="object-contain brightness-0 invert" priority />
          </div>

          <h2 className="text-3xl font-black text-gray-800 tracking-tight">
            Nəticəni Yoxla
          </h2>

          <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mt-3">
            Main Olympic Center
          </p>
        </div>

        <form onSubmit={checkResult} className="space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest ml-1">İmtahan</label>
            <div className="relative group">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-amber-100 focus:border-amber-500 outline-none font-bold text-lg text-gray-800 appearance-none cursor-pointer transition-all"
              >
                <option value="">İmtahanı seçin...</option>
                {examList.map((exam, idx) => (
                    <option key={idx} value={exam}>{exam}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition">
                <ChevronDown size={22} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest ml-1">Şagird ID</label>
            <div className="relative group">
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                onInput={onlyNumbers}
                placeholder="ID daxil edin"
                className="w-full pl-5 pr-12 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-amber-100 focus:border-amber-500 outline-none font-bold text-lg text-gray-800 transition-all placeholder-gray-300"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-amber-500 transition">
                <Search size={22} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !id || !selectedExam}
            className="w-full bg-gray-900 hover:bg-amber-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-amber-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <span className="text-lg group-hover:tracking-wide transition-all">Nəticəni Göstər</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-500 text-sm font-bold rounded-2xl text-center flex items-center justify-center gap-2 animate-pulse">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      <div className="mt-12 text-center z-10 opacity-60">
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Rəsmi İmtahan Portalı</p>
        <div className="h-1 w-12 bg-amber-500 mx-auto rounded-full"></div>
      </div>
    </div>
  );
}
