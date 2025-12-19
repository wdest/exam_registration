"use client";
import { useState } from "react";
import ResultCard from "../../components/ResultCard";
import { Search, Loader2, ArrowLeft, Trophy, GraduationCap, Award } from "lucide-react";

export default function NeticePage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  async function checkResult() {
    if (!id.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/netice?id=${id.trim()}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Nəticə tapılmadı. ID-ni düzgün yazdığınıza əmin olun.");
      } else {
        setResult(json);
      }
    } catch {
      setError("Serverlə əlaqə kəsildi. İnternetinizi yoxlayın.");
    } finally {
      setLoading(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') checkResult();
  };

  if (result) {
    const fullName = result.students 
      ? `${result.students.first_name} ${result.students.last_name}` 
      : "Ad Tapılmadı";

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Dekorativ elementlər */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
        
        <div className="w-full max-w-md mb-6 z-10">
            <button 
                onClick={() => { setResult(null); setId(""); }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold px-4 py-2 bg-white rounded-2xl shadow-sm border border-blue-50 transition-all active:scale-95"
            >
                <ArrowLeft size={18} /> Yeni Axtarış
            </button>
        </div>

        <div className="z-10 w-full flex justify-center animate-in fade-in zoom-in duration-500">
          <ResultCard
            studentName={fullName} 
            studentId={result.student_id}
            quizName={result.quiz}
            score={result.score}
            total={result.total}
            percent={result.percent}
            date={new Date(result.created_at).toLocaleDateString("az-AZ")}
            logoUrl="/images/logo.png" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 relative overflow-hidden">
      {/* Premium Fon Naxışı */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* Arxa fon rəngli ləkələr */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-200 rounded-full blur-[120px] opacity-30"></div>
      <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-indigo-200 rounded-full blur-[120px] opacity-30"></div>

      <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white/60 backdrop-blur-sm z-10">
        
        <div className="text-center mb-10">
          <div className="relative inline-block mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-200 rotate-3 transform hover:rotate-0 transition-transform duration-500">
               <Trophy size={42} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 p-2 rounded-xl shadow-lg border-2 border-white">
                <Award size={20} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Nəticəni Yoxla</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
             <GraduationCap size={18} className="text-blue-500" />
             <p className="text-blue-600 font-bold text-xs uppercase tracking-widest italic">Main Olympic Center</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-400 mb-2 ml-1 uppercase tracking-[0.15em]">Şagird ID</label>
            <div className="relative">
                <input
                  type="text"
                  placeholder="ID daxil edin (Məs: 1957...)"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-5 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-lg text-slate-800 placeholder-slate-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <Search size={22} />
                </div>
            </div>
          </div>

          <button
            onClick={checkResult}
            disabled={loading || !id}
            className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
                <Loader2 className="animate-spin" size={24} />
            ) : (
                <>
                  <span className="text-lg">Hesabatı Göster</span>
                  <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>
      
      {/* Alt məlumat */}
      <div className="mt-12 text-center z-10">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Rəsmi İmtahan Portalı</p>
        <div className="h-1 w-12 bg-blue-500 mx-auto rounded-full"></div>
      </div>
    </div>
  );
}
