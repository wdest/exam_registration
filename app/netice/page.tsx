"use client";
import { useState } from "react";
// Əgər components qovluğu app ilə yan-yanadırsa:
import ResultCard from "../../components/ResultCard";
import { Search, Loader2, ArrowLeft } from "lucide-react"; // İkonlar üçün

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

  // ENTER düyməsi ilə axtarış etmək üçün
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkResult();
    }
  };

  // --- EKRAN 1: Nəticə Tapılanda ---
  if (result) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        {/* Geri Qayıt Düyməsi */}
        <div className="w-full max-w-md mb-6">
            <button 
                onClick={() => { setResult(null); setId(""); }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow transition"
            >
                <ArrowLeft size={18} /> Yeni Axtarış
            </button>
        </div>

        {/* Nəticə Kartı */}
        <ResultCard
          studentName={result.students?.full_name || "Ad Tapılmadı"} // Adı buradan ötürürük
          studentId={result.student_id}
          quizName={result.quiz}
          score={result.score}
          total={result.total}
          percent={result.percent}
          date={new Date(result.created_at).toLocaleDateString("az-AZ")}
          logoUrl="/images/logo.png" // Logonuzu 'public/images/logo.png' qovluğuna atın
        />
      </div>
    );
  }

  // --- EKRAN 2: Giriş Formu (Axtarış) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl">
        
        {/* Başlıq və İkon */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 transform hover:rotate-6 transition duration-300">
             <Search size={36} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nəticəni Yoxla</h2>
          <p className="text-gray-500 mt-3 font-medium">Main Olympic Center İmtahan Portalı</p>
        </div>

        {/* Form Hissəsi */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Şagird ID</label>
            <div className="relative">
                <input
                  type="text"
                  placeholder="Məsələn: 19576598"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-5 pr-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition outline-none font-medium text-lg text-gray-800 placeholder-gray-400"
                />
            </div>
          </div>

          <button
            onClick={checkResult}
            disabled={loading || !id}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
                <>
                    <Loader2 className="animate-spin" /> Yoxlanılır...
                </>
            ) : (
                "Nəticəyə Bax"
            )}
          </button>
        </div>

        {/* Xəta Mesajı */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl flex items-center justify-center border border-red-100 animate-pulse text-center">
            ⚠️ {error}
          </div>
        )}
      </div>
      
      <p className="mt-8 text-gray-400 text-sm font-medium">© 2025 Main Olympic Center</p>
    </div>
  );
}
