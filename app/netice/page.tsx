"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Search, Loader2, ArrowLeft, ChevronDown, Download, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import html2canvas from "html2canvas";

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
  
  // Sertifikatın arxa plan şəkli
  const [certificateBg, setCertificateBg] = useState<string | null>(null);

  // Gizli Sertifikat Ref-i
  const certificateRef = useRef<HTMLDivElement>(null);

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

  // 2. Nəticəni Yoxla və Şəkli Gətir
  async function checkResult(e?: any) {
    if (e) e.preventDefault();
    
    if (!id.trim() || !selectedExam) {
        setError("Zəhmət olmasa İmtahanı seçin və ID daxil edin");
        return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCertificateBg(null);

    try {
      const res = await fetch(`/api/netice?id=${id.trim()}&examName=${encodeURIComponent(selectedExam)}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Nəticə tapılmadı");
      } else {
        setResult(json);

        // Bazadan arxa plan şəklini (certificate_url) gətiririk
        const { data: examData } = await supabase
            .from("exams")
            .select("certificate_url") 
            .eq("name", selectedExam)
            .limit(1)
            .single();
        
        if (examData && examData.certificate_url) {
            setCertificateBg(examData.certificate_url);
        }
      }
    } catch {
      setError("Serverlə əlaqə kəsildi");
    } finally {
      setLoading(false);
    }
  }

  // 3. Sertifikatı Yüklə
  const downloadCertificate = async () => {
    if (certificateRef.current) {
        setLoading(true);
        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: null,
            });
            
            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.href = image;
            link.download = `Sertifikat_${result.students.first_name}.png`;
            link.click();
        } catch (err) {
            console.error("Sertifikat xətası:", err);
            setError("Sertifikatı yükləyərkən xəta baş verdi.");
        } finally {
            setLoading(false);
        }
    }
  };

  /* ===================== NƏTİCƏ KARTI ===================== */
  if (result) {
    const fullName = result.students
      ? `${result.students.first_name} ${result.students.last_name}`
      : "Ad tapılmadı";

    const displayValue = (val: any) => (val !== null && val !== undefined ? val : "-");
    let emptyCount: any = "-";
    if (result.total && result.correct_count != null && result.wrong_count != null) {
        emptyCount = result.total - (result.correct_count + result.wrong_count);
    }

    return (
      <div className="min-h-screen bg-orange-50/30 flex flex-col items-center justify-center p-4 relative overflow-y-auto">

        {/* --- 🟢 GİZLİ SERTİFİKAT ŞABLONU (DƏQİQ KOORDİNATLARLA) 🟢 --- */}
        <div className="absolute top-0 left-[-9999px]">
            <div 
                ref={certificateRef} 
                className="relative w-[1123px] h-[794px] bg-white overflow-hidden text-gray-900 font-sans" // A4 Landscape
            >
                {/* 1. ARXA FON (Adminin yüklədiyi) */}
                {certificateBg ? (
                    <img 
                        src={certificateBg} 
                        alt="Certificate BG" 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        crossOrigin="anonymous" 
                    />
                ) : (
                    // Default boş fon (əgər şəkil yoxdursa)
                    <div className="absolute inset-0 w-full h-full bg-white flex items-center justify-center border-[20px] border-amber-500 text-gray-300 font-bold text-4xl">
                        Şablon Yüklənməyib
                    </div>
                )}

                {/* 2. MƏLUMATLAR (Absolute Position ilə) */}
                {/* DİQQƏT: Buradakı 'top' və 'left' dəyərlərini şəklinizə görə dəyişin!
                    top-[Xpx] -> Yuxarıdan aşağı məsafə
                    left-[Xpx] -> Soldan sağa məsafə
                */}

                {/* --- AD SOYAD --- */}
                <div className="absolute top-[320px] left-0 w-full text-center z-10">
                    <h1 className="text-6xl font-bold uppercase tracking-wider text-black drop-shadow-md">
                        {fullName}
                    </h1>
                </div>

                {/* --- MƏTN (İmtahan adı və s.) --- */}
                <div className="absolute top-[420px] left-0 w-full text-center z-10 px-20">
                    <p className="text-2xl text-gray-800 font-medium">
                        Main Olympic Center tərəfindən keçirilən <b>{selectedExam}</b> imtahanında iştirak etmişdir.
                    </p>
                </div>

                {/* --- NƏTİCƏLƏR (Bal və Faiz) --- */}
                {/* gap-40: Bal və Faiz arasındakı məsafə */}
                <div className="absolute top-[520px] left-0 w-full flex justify-center gap-40 z-10">
                    
                    {/* Bal */}
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-600 mb-2 uppercase">Bal</p>
                        <p className="text-5xl font-black text-amber-600">{displayValue(result.score)}</p>
                    </div>

                    {/* Faiz */}
                    <div className="text-center">
                        <p className="text-xl font-bold text-gray-600 mb-2 uppercase">Faiz</p>
                        <p className="text-5xl font-black text-amber-600">{result.percent}%</p>
                    </div>

                </div>

                {/* --- TARİX --- */}
                <div className="absolute bottom-[60px] left-[80px] z-10">
                    <p className="text-xl font-bold text-gray-700">
                        {new Date().toLocaleDateString("az-AZ")}
                    </p>
                </div>

                {/* --- SİNİF --- */}
                <div className="absolute bottom-[60px] right-[80px] z-10">
                    <p className="text-xl font-bold text-gray-700">
                        {result.students.class}-ci Sinif
                    </p>
                </div>

            </div>
        </div>
        {/* --- GİZLİ ŞABLON SONU --- */}


        {/* EKRANDA GÖRÜNƏN İNTERFEYS (Dəyişməyib) */}
        <div className="w-full max-w-2xl mb-6 z-10 flex justify-between">
          <button
            onClick={() => { setResult(null); setId(""); }}
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 font-bold px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 transition active:scale-95"
          >
            <ArrowLeft size={18} /> Geri Qayıt
          </button>

          <button
            onClick={downloadCertificate}
            disabled={loading}
            className="flex items-center gap-2 text-white font-bold px-5 py-2 bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-200 transition active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
            {loading ? "Hazırlanır..." : "Sertifikatı Yüklə"}
          </button>
        </div>

        {/* --- Vizual Kart (Telefonda baxmaq üçün) --- */}
        <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
          <div className="text-center border-b-2 border-dashed border-gray-100 pb-8 mb-8 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-md">M</div>
                <h2 className="text-3xl font-black text-gray-800 uppercase tracking-wide">İmtahan Nəticəsi</h2>
            </div>
            <p className="text-gray-500 font-medium">Main Olympic Center - Rəsmi Hesabat</p>
          </div>

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

          <div className="flex justify-center mb-12 relative z-10">
              <div className="relative">
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
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm font-medium">
           Rəsmi sertifikatı yükləmək üçün yuxarıdakı düymədən istifadə edin.
        </div>
      </div>
    );
  }

  /* ===================== AXTARIŞ EKRANI ===================== */
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
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Nəticəni Yoxla</h2>
          <p className="text-amber-500 font-bold text-xs uppercase tracking-widest mt-3">Main Olympic Center</p>
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
    </div>
  );
}
