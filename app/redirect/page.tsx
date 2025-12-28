"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Loader2, AlertCircle, ExternalLink } from "lucide-react";

export default function ExamRedirect() {
  const [examId, setExamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartExam(e: React.FormEvent) {
    e.preventDefault();
    if (!examId) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/get-exam-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: examId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Xəta baş verdi");
      }

      if (data.url) {
        // Link tapıldı, yönləndiririk
        window.location.href = data.url;
      } else {
        throw new Error("Link tapılmadı.");
      }

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4 font-sans text-gray-800 relative overflow-hidden">
      
      {/* Arxa Fon Dekoru */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1] pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border border-orange-100"
      >
        <div className="flex justify-center mb-8">
           <Image src="/logo.png" alt="Logo" width={160} height={80} className="object-contain" priority />
        </div>

        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">İmtahana Başla 🚀</h1>
            <p className="text-gray-500 text-sm">
                Qeydiyyat zamanı əldə etdiyiniz <br/> 
                <span className="font-bold text-amber-600">8 rəqəmli kodu</span> daxil edin.
            </p>
        </div>

        <form onSubmit={handleStartExam} className="space-y-6">
            
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition">
                    <Search size={22} />
                </div>
                <input 
                    type="text" 
                    placeholder="Məs: 19576598"
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 text-gray-900 rounded-xl focus:ring-0 focus:border-amber-500 outline-none transition font-bold text-lg tracking-wider placeholder-gray-300"
                    maxLength={15}
                />
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-3"
                >
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span>{error}</span>
                </motion.div>
            )}

            <button 
                type="submit" 
                disabled={loading || !examId}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-orange-200/50 hover:from-amber-600 hover:to-orange-700 transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" /> Yönləndirilir...
                    </>
                ) : (
                    <>
                        İmtahana Keçid <ExternalLink size={20} />
                    </>
                )}
            </button>

        </form>

        <div className="mt-8 text-center">
            <p className="text-gray-400 text-xs">
                Kodu unutmusunuzsa, zəhmət olmasa nəzarətçiyə yaxınlaşın.
            </p>
        </div>

      </motion.div>
    </div>
  );
}
