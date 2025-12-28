"use client";
import { useState, useEffect } from "react";
import Image from "next/image"; 
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";

// Supabase müştərisini yaradırıq
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Məlumat tipləri
interface Exam {
  id: number;
  name: string;
  class_grade: string;
  url: string;
}

export default function ExamRegister() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ examId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // DATA STATE-ləri
  const [allExams, setAllExams] = useState<Exam[]>([]); 
  
  const [uniqueExamNames, setUniqueExamNames] = useState<string[]>([]); 
  const [availableClassesForExam, setAvailableClassesForExam] = useState<string[]>([]); 

  // FORM STATE-ləri
  const [selectedExamName, setSelectedExamName] = useState(""); 
  const [selectedClass, setSelectedClass] = useState("");       

  useEffect(() => {
    async function fetchExams() {
      const { data } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        const examsData = data as Exam[];
        setAllExams(examsData);
        const uniqueNames = Array.from(new Set(examsData.map(item => item.name)));
        setUniqueExamNames(uniqueNames);
      }
    }
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamName) {
      setAvailableClassesForExam([]);
      setSelectedClass("");
      return;
    }

    const matchingExams = allExams.filter(ex => ex.name === selectedExamName);
    const classes = Array.from(new Set(matchingExams.map(ex => ex.class_grade)));

    const sortedClasses = classes.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA)) return 1; 
        if (isNaN(numB)) return -1;
        return numA - numB;
    });

    setAvailableClassesForExam(sortedClasses);
    setSelectedClass(""); 
  }, [selectedExamName, allExams]);

  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  // --- Şəkilçi Düzəldən Funksiya ---
  function getSuffix(grade: string) {
      const num = parseInt(grade);
      if ([1, 2, 5, 7, 8, 11].includes(num)) return "-ci";
      if ([3, 4].includes(num)) return "-cü";
      if ([6].includes(num)) return "-cı";
      if ([9, 10].includes(num)) return "-cu";
      return "-ci"; 
  }

  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // 1. İmtahan və Sinif seçimi yoxlaması
    if (!selectedExamName || !selectedClass) {
      setError("Zəhmət olmasa imtahanı və sinfi seçin!");
      return;
    }

    const f = e.target;
    
    // --- YENİ HİSSƏ: Telefon Nömrələrinin Eyniliyini Yoxlamaq ---
    const phone1_full = f.operator1.value + f.phone7_1.value;
    const phone2_val = f.phone7_2.value;
    const phone2_full = phone2_val ? (f.operator2.value + phone2_val) : null;

    if (phone2_full && phone1_full === phone2_full) {
        setError("Əsas nömrə ilə əlavə nömrə eyni ola bilməz! Zəhmət olmasa fərqli nömrə qeyd edin.");
        return;
    }
    // -----------------------------------------------------------

    const exactExam = allExams.find(
        ex => ex.name === selectedExamName && ex.class_grade === selectedClass
    );

    if (!exactExam) {
        setError("Bu imtahan bu sinif üçün tapılmadı.");
        return;
    }

    setLoading(true);

    const formData = {
      firstName: f.firstName.value,
      lastName: f.lastName.value,
      fatherName: f.fatherName.value,
      phone7_1: "+994" + phone1_full,
      phone7_2: phone2_full ? "+994" + phone2_full : null,
      className: selectedClass, 
      examName: selectedExamName  
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      
      if (!res.ok) {
          // Bazada təkrar qeydiyyat yoxlaması
          if (res.status === 409 || data.error?.includes("already exists") || data.error?.includes("duplicate")) {
              throw new Error("Bu şagird artıq qeydiyyatdan keçib!");
          }
          throw new Error(data.error || "Xəta baş verdi");
      }
      
      setResult({ examId: data.examId });

    } catch (err: any) {
      setError(err.message || "Server xətası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4 font-sans text-gray-800">
      
      <div className="fixed inset-0 z-[-1] opacity-5 flex items-center justify-center pointer-events-none">
         <Image src="/logo.png" alt="bg" width={600} height={600} className="object-contain" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-2xl border border-orange-100"
      >
        <div className="flex justify-center mb-6">
           <Image src="/logo.png" alt="Logo" width={140} height={70} className="object-contain" />
        </div>

        {result ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Qeydiyyat Uğurlu!</h2>
            <p className="text-gray-600 mb-6">Sizin İmtahan Kodunuz:</p>
            <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-xl p-6 mb-6">
              <span className="text-4xl font-mono font-bold text-amber-600 tracking-widest">{result.examId}</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Zəhmət olmasa bu kodu yadda saxlayın.</p>
            <button onClick={() => setResult(null)} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">
              Yeni Qeydiyyat
            </button>
          </div>
        ) : (
          <form onSubmit={submitForm} className="space-y-4">
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">İmtahan Qeydiyyatı</h1>
            
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm text-center font-bold border border-red-100 animate-pulse">{error}</div>}

            {/* İMTAHAN SEÇİMİ */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Hansı imtahana yazılırsınız?</label>
              <select 
                value={selectedExamName}
                onChange={(e) => setSelectedExamName(e.target.value)}
                className="w-full p-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none transition font-bold"
                required
              >
                <option value="">İmtahan seçin...</option>
                {uniqueExamNames.length === 0 ? (
                  <option disabled>Aktiv imtahan yoxdur</option>
                ) : (
                  uniqueExamNames.map((name, index) => (
                    <option key={index} value={name}>
                       {name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* SİNİF SEÇİMİ */}
            <motion.div 
               initial={{ opacity: 0.5, height: 'auto' }}
               animate={{ opacity: selectedExamName ? 1 : 0.5 }}
               className="transition-all"
            >
              <label className="block text-sm font-bold text-gray-700 mb-1">Sinifiniz</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={!selectedExamName} 
                className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                    {!selectedExamName ? "Əvvəlcə imtahanı seçin" : "Sinfi seçin..."}
                </option>
                {availableClassesForExam.map((cls, index) => (
                  <option key={index} value={cls}>
                      {isNaN(Number(cls)) ? cls : `${cls}${getSuffix(cls)} sinif`}
                  </option>
                ))}
              </select>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <input name="firstName" placeholder="Ad" required className="p-3 border rounded-xl w-full outline-none focus:border-amber-500" />
              <input name="lastName" placeholder="Soyad" required className="p-3 border rounded-xl w-full outline-none focus:border-amber-500" />
            </div>
            <input name="fatherName" placeholder="Ata adı" required className="p-3 border rounded-xl w-full outline-none focus:border-amber-500" />

            <div>
               <label className="text-xs font-bold text-gray-500 ml-1">Əlaqə Nömrəsi</label>
               <div className="flex gap-2">
                 <select name="operator1" className="p-3 border rounded-xl bg-gray-50 outline-none">
                    <option value="50">050</option>
                    <option value="51">051</option>
                    <option value="55">055</option>
                    <option value="70">070</option>
                    <option value="77">077</option>
                 </select>
                 <input name="phone7_1" placeholder="1234567" maxLength={7} onInput={onlyNumbers} required className="p-3 border rounded-xl w-full outline-none focus:border-amber-500" />
               </div>
            </div>

            <div>
               <label className="text-xs font-bold text-gray-500 ml-1">Əlavə Nömrə (İstəyə bağlı)</label>
               <div className="flex gap-2">
                 <select name="operator2" className="p-3 border rounded-xl bg-gray-50 outline-none">
                    <option value="50">050</option>
                    <option value="51">051</option>
                    <option value="55">055</option>
                    <option value="70">070</option>
                    <option value="77">077</option>
                 </select>
                 <input name="phone7_2" placeholder="1234567" maxLength={7} onInput={onlyNumbers} className="p-3 border rounded-xl w-full outline-none focus:border-amber-500" />
               </div>
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full py-4 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-600 transition disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? "Qeydiyyat gedir..." : "Təsdiqlə və Kod Al"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
