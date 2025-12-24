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
  
  // LOGİKA DƏYİŞDİ: Əvvəlcə İmtahan adları, sonra Siniflər
  const [uniqueExamNames, setUniqueExamNames] = useState<string[]>([]); // Unikal imtahan adları
  const [availableClassesForExam, setAvailableClassesForExam] = useState<string[]>([]); // Seçilən imtahanın sinifləri

  // FORM STATE-ləri
  const [selectedExamName, setSelectedExamName] = useState(""); // 1-ci seçim
  const [selectedClass, setSelectedClass] = useState("");       // 2-ci seçim

  // 1. Məlumatları çəkirik və Unikal İmtahan Adlarını tapırıq
  useEffect(() => {
    async function fetchExams() {
      const { data } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (data) {
        const examsData = data as Exam[];
        setAllExams(examsData);

        // İmtahan adlarını unikal edirik (Təkrarları silirik)
        const uniqueNames = Array.from(new Set(examsData.map(item => item.name)));
        setUniqueExamNames(uniqueNames);
      }
    }
    fetchExams();
  }, []);

  // 2. İmtahan adı seçiləndə, ona uyğun SİNİFLƏRİ tapırıq
  useEffect(() => {
    if (!selectedExamName) {
      setAvailableClassesForExam([]);
      setSelectedClass("");
      return;
    }

    // Seçilmiş ada uyğun bütün sətirləri tapırıq
    const matchingExams = allExams.filter(ex => ex.name === selectedExamName);
    
    // Həmin imtahanların siniflərini çıxarırıq
    const classes = Array.from(new Set(matchingExams.map(ex => ex.class_grade)));

    // Sinifləri sort edirik (Rəqəm sırası ilə)
    const sortedClasses = classes.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA)) return 1; 
        if (isNaN(numB)) return -1;
        return numA - numB;
    });

    setAvailableClassesForExam(sortedClasses);
    setSelectedClass(""); // İmtahan dəyişəndə sinfi sıfırla
  }, [selectedExamName, allExams]);

  // Yalnız rəqəm girişi
  function onlyNumbers(e: any) {
    e.target.value = e.target.value.replace(/\D/g, "");
  }

  // Formu göndərmək
  async function submitForm(e: any) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // Həm imtahan adı, həm sinif seçilməlidir
    if (!selectedExamName || !selectedClass) {
      setError("Zəhmət olmasa imtahanı və sinfi seçin!");
      return;
    }

    // İndi konkret ID-ni tapmaq lazımdır (Adı bu olan VƏ Sinfi bu olan)
    const exactExam = allExams.find(
        ex => ex.name === selectedExamName && ex.class_grade === selectedClass
    );

    if (!exactExam) {
        setError("Bu imtahan bu sinif üçün tapılmadı.");
        return;
    }

    setLoading(true);
    const f = e.target;

    const formData = {
      firstName: f.firstName.value,
      lastName: f.lastName.value,
      fatherName: f.fatherName.value,
      phone7_1: "+994" + f.operator1.value + f.phone7_1.value,
      phone7_2: f.phone7_2.value ? "+994" + f.operator2.value + f.phone7_2.value : null,
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
      if (!res.ok) throw new Error(data.error || "Xəta oldu");
      
      // exactExam.id əvəzinə serverdən gələn ID-ni və ya birbaşa exactExam.id-ni istifadə edə bilərik
      // Amma serverdə qeydiyyatdan keçən unikal ID (examId) daha vacibdir
      setResult({ examId: data.examId });

    } catch (err: any) {
      setError(err.message || "Server xətası");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-orange-50/50 flex items-center justify-center p-4 font-sans text-gray-800">
      
      {/* Background Logo */}
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
          // --- NƏTİCƏ EKRANI ---
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
          // --- FORM EKRANI ---
          <form onSubmit={submitForm} className="space-y-4">
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">İmtahan Qeydiyyatı</h1>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">{error}</div>}

            {/* --- ADIM 1: İMTAHAN SEÇİMİ (Bütün unikal imtahanlar) --- */}
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

            {/* --- ADIM 2: SİNİF SEÇİMİ (Seçilən İmtahana uyğun) --- */}
            <motion.div 
               initial={{ opacity: 0.5, height: 'auto' }}
               animate={{ opacity: selectedExamName ? 1 : 0.5 }}
               className="transition-all"
            >
              <label className="block text-sm font-bold text-gray-700 mb-1">Sinifiniz</label>
              <select 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={!selectedExamName} // İmtahan seçilməyibsə deaktiv et
                className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">
                    {!selectedExamName ? "Əvvəlcə imtahanı seçin" : "Sinfi seçin..."}
                </option>
                {availableClassesForExam.map((cls, index) => (
                  <option key={index} value={cls}>
                      {isNaN(Number(cls)) ? cls : `${cls}-ci sinif`}
                  </option>
                ))}
              </select>
            </motion.div>

            {/* Digər inputlar */}
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
