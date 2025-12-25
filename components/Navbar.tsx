// app/results/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Search, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResultPage() {
  const [examCode, setExamCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentData, setStudentData] = useState<any>(null);
  const [resultData, setResultData] = useState<any>(null);

  async function checkResult(e: React.FormEvent) {
    e.preventDefault();
    if (!examCode) return;
    
    setLoading(true);
    setError("");
    setStudentData(null);
    setResultData(null);

    try {
      // Tələbəni tapırıq
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("exam_id", examCode)
        .single();

      if (studentError || !student) {
        throw new Error("Bu kodla qeydiyyat tapılmadı.");
      }
      setStudentData(student);

      // Nəticəni tapırıq
      const { data: result } = await supabase
        .from("results")
        .select("*")
        .eq("exam_id", examCode)
        .single();

      if (result) {
        setResultData(result);
      } else {
        setResultData(null); // Nəticə hələ yoxdur
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start pt-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">İmtahan Nəticəsi</h1>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <form onSubmit={checkResult} className="relative">
             <input 
               type="text" 
               placeholder="İmtahan Kodunuz (Məs: 123456)"
               value={examCode}
               onChange={(e) => setExamCode(e.target.value)}
               className="w-full pl-4 pr-12 py-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none font-mono text-lg"
             />
             <button 
               type="submit"
               disabled={loading}
               className="absolute right-2 top-2 bottom-2 bg-amber-500 hover:bg-amber-600 text-white p-3 rounded-lg transition disabled:opacity-50"
             >
               {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Search size={20} />}
             </button>
          </form>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </motion.div>

      {studentData && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
        >
          <div className="bg-amber-500 p-6 text-white text-center">
             <div className="text-sm font-medium opacity-80">TƏLƏBƏ KARTI</div>
             <h2 className="text-2xl font-bold mt-1">{studentData.first_name} {studentData.last_name}</h2>
             <p className="opacity-90">{studentData.class}-ci sinif</p>
          </div>

          <div className="p-8">
            {resultData ? (
              <div className="text-center space-y-6">
                <div>
                   <span className="text-gray-400 text-sm uppercase font-bold tracking-wider">TOPLANAN BAL</span>
                   <div className="text-6xl font-black text-amber-500 mt-2">{resultData.score}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-green-50 p-3 rounded-xl">
                    <div className="text-green-600 font-bold text-xl">{resultData.correct_count}</div>
                    <div className="text-xs text-green-800">Düzgün</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl">
                    <div className="text-red-600 font-bold text-xl">{resultData.wrong_count}</div>
                    <div className="text-xs text-red-800">Səhv</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">⏳</div>
                <h3 className="text-lg font-bold text-gray-800">Nəticə Tapılmadı</h3>
                <p className="text-gray-500 mt-2 text-sm">İmtahan nəticələri hələ sistemə yüklənməyib.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
