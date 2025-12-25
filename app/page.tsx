"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
// Yeni ikonlar əlavə etdik
import { ChevronDown, UserCircle, GraduationCap, FileText } from "lucide-react";

// Supabase tənzimləmələri
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Animasiya variantları
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export default function LandingPage() {
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [siteInfo, setSiteInfo] = useState({
    phone: "+994 50 123 45 67",
    address: "Bakı şəhəri, Nərimanov r.",
    email: "info@moc.az",
    map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3039.428674854084!2d49.85172431539656!3d40.37719087936967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40307d079efb5163%3A0xc20aa51a5f0f5e01!2sBaku!5e0!3m2!1sen!2saz!4v1642155555555!5m2!1sen!2saz"
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: galData } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (galData) setGalleryImages(galData);

        const { data: settingsData } = await supabase.from("settings").select("*");
        
        if (settingsData) {
          const newInfo: any = { ...siteInfo };
          settingsData.forEach((item) => {
            if (item.key) newInfo[item.key] = item.value;
          });
          setSiteInfo(newInfo);
        }

      } catch (err) {
        console.error("Data xətası:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-orange-50/30 font-sans text-gray-800">
      
      {/* --- 1. NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-shrink-0 flex items-center cursor-pointer"
            >
              <Image 
                src="/logo.png" 
                alt="Main Olympic Center Logo" 
                width={180} 
                height={60} 
                className="object-contain h-16 w-auto" 
                priority
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex items-center space-x-8 font-medium text-gray-600"
            >
              <a href="#services" className="hover:text-amber-600 transition duration-200">Xidmətlər</a>
              {/* "Həyatımız" silindi */}
              <a href="#contact" className="hover:text-amber-600 transition duration-200">Əlaqə</a>
              
              <Link href="/netice" className="hover:text-amber-600 transition duration-200 flex items-center gap-1">
                <span>📊</span> Nəticələr
              </Link>

              {/* --- YENİ: KABİNETƏ GİRİŞ DROPDOWN --- */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-600 transition font-bold border border-gray-100">
                    <UserCircle size={20} />
                    Kabinetə Giriş
                    <ChevronDown size={16} className="group-hover:rotate-180 transition duration-300"/>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 pt-4 w-72 hidden group-hover:block transform origin-top-right transition-all duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 overflow-hidden ring-1 ring-black ring-opacity-5">
                        
                        {/* Seçim 1: İmtahan Kabineti */}
                        <Link href="/login?type=exam" className="flex items-center gap-4 p-3 hover:bg-orange-50 rounded-xl transition group/item">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center group-hover/item:bg-orange-500 group-hover/item:text-white transition">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">İmtahan Kabineti</p>
                                <p className="text-xs text-gray-400">Sınaq iştirakçıları üçün</p>
                            </div>
                        </Link>

                        {/* Seçim 2: Şagird Kabineti */}
                        <Link href="/login?type=student" className="flex items-center gap-4 p-3 hover:bg-amber-50 rounded-xl transition mt-1 group/item">
                            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center group-hover/item:bg-amber-500 group-hover/item:text-white transition">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Şagird Kabineti</p>
                                <p className="text-xs text-gray-400">Kurs tələbələri üçün</p>
                            </div>
                        </Link>

                    </div>
                </div>
              </div>
              {/* --- KABİNET SONU --- */}

              <Link 
                href="/exam" 
                className="bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 font-bold"
              >
                İmtahan Qeydiyyatı
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <section className="pt-40 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 via-white to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            Zirvəyə gedən yol <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Main Olympic Center</span> ilə başlayır
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-10"
          >
            Peşəkar yanaşma və olimpiada standartlarında təhsil ilə övladınızın gələcəyini bu gündən sığortalayın.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
             <Link 
               href="/exam" 
               className="px-10 py-4 bg-amber-500 text-white font-bold rounded-xl shadow-xl hover:bg-amber-600 transform hover:-translate-y-1 transition duration-200"
             >
               Sınağa Yazıl
             </Link>
             <a 
               href="#contact" 
               className="px-10 py-4 bg-white text-amber-600 font-bold rounded-xl border-2 border-amber-100 shadow-sm hover:border-amber-500 hover:bg-orange-50 transition"
             >
               Əlaqə Saxla
             </a>
          </motion.div>
        </div>
      </section>

      {/* --- 3. XİDMƏTLƏRİMİZ --- */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900">Tədris İstiqamətlərimiz</h2>
            <p className="mt-4 text-gray-500">MOC keyfiyyəti ilə hər fənn daha maraqlı</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={itemVariants} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition duration-300 group">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">📐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Riyaziyyat və Məntiq</h3>
              <p className="text-gray-600">Güclü məntiqi təfəkkür formalaşdıran xüsusi proqramlar.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-teal-500/10 transition duration-300 group">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Xarici Dillər</h3>
              <p className="text-gray-600">İngilis və Rus dili üzrə qabaqcıl tədris metodikası.</p>
            </motion.div>
            
            <motion.div variants={itemVariants} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-rose-500/10 transition duration-300 group">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">💻</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">İT və Proqramlaşdırma</h3>
              <p className="text-gray-600">Gələcəyin texnologiyalarını indidən öyrənin.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- 4. QALEREYA (SONSUZ KARUSEL) --- */}
      <section id="gallery" className="py-24 bg-orange-50/50 border-t border-orange-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900">Mərkəzimizdən Görüntülər</h2>
            <p className="mt-4 text-gray-500">Tələbələrimizin uğurları və dərs mühiti</p>
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-amber-500 animate-pulse font-medium">Yüklənir...</div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center py-12 max-w-2xl mx-auto bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400">Hələlik qalereyada şəkil yoxdur.</p>
          </div>
        ) : (
          <div className="relative w-full">
            {/* Şəkillərin kənarlarında yumşaq keçid (fade effect) üçün */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-orange-50 via-orange-50/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-orange-50 via-orange-50/80 to-transparent z-10 pointer-events-none" />

            {/* Sonsuz Sürüşən Konteyner */}
            <motion.div 
              className="flex gap-8 w-max"
              // X oxu üzrə hərəkət edir: 0%-dən -50%-ə (çünki şəkilləri 2 qat artırdıq)
              animate={{ x: ["0%", "-50%"] }} 
              transition={{
                  ease: "linear",
                  duration: 40, // Sürəti burdan tənzimlə (rəqəm böyüdükcə yavaşlayır)
                  repeat: Infinity,
              }}
            >
              {/* Şəkilləri 2 dəfə təkrarlayırıq ki, sonsuz dövr yaransın */}
              {[...galleryImages, ...galleryImages].map((item, index) => (
                <div 
                  key={index} 
                  className="relative w-72 h-48 sm:w-80 sm:h-56 md:w-96 md:h-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border-4 border-white hover:scale-105 transition duration-300"
                >
                  <img 
                    src={item.image_url} 
                    alt="MOC Qalereya" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </section>

      {/* --- 5. ƏLAQƏ (Footer) --- */}
      <section id="contact" className="bg-white border-t border-gray-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-16">
          
          {/* Məlumat */}
          <div>
            <div className="mb-6">
               <span className="text-2xl font-extrabold text-amber-500 tracking-wide">MOC</span>
               <span className="block text-sm font-bold text-black tracking-widest">MAIN OLYMPIC CENTER</span>
            </div>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Main Olympic Center - Təhsilin olimpiadası. Bizimlə hədəflərinizə daha sürətli çatın.
            </p>
            <div className="space-y-4">
              <p className="flex items-center text-gray-700 group cursor-pointer">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition">📍</span> 
                {siteInfo.address || "Ünvan yüklənir..."}
              </p>
              
              <a href={`tel:${siteInfo.phone}`} className="flex items-center text-gray-700 group cursor-pointer hover:text-amber-600">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition">📞</span> 
                {siteInfo.phone || "Telefon yüklənir..."}
              </a>
              
              <a href={`mailto:${siteInfo.email}`} className="flex items-center text-gray-700 group cursor-pointer hover:text-amber-600">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition">📧</span> 
                {siteInfo.email || "Email yüklənir..."}
              </a>
            </div>
          </div>

          {/* Faydalı Linklər */}
          <div>
            <h4 className="font-bold text-gray-900 mb-8 text-lg">Keçidlər</h4>
            <ul className="space-y-4 text-gray-600">
              <li><Link href="/exam" className="hover:text-amber-500 transition flex items-center gap-2">🔹 İmtahan Qeydiyyatı</Link></li>
              <li><Link href="/netice" className="hover:text-amber-500 transition flex items-center gap-2">🔹 İmtahan Nəticələri</Link></li>
              <li><a href="#services" className="hover:text-amber-500 transition flex items-center gap-2">🔹 Xidmətlərimiz</a></li>
              <li><a href="#gallery" className="hover:text-amber-500 transition flex items-center gap-2">🔹 Qalereya</a></li>
            </ul>
          </div>

          {/* DİNAMİK XƏRİTƏ */}
          <div className="h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative">
             {!siteInfo.map_url ? (
               <div className="flex items-center justify-center h-full text-gray-400">Xəritə yüklənir...</div>
             ) : (
                <iframe 
                  src={siteInfo.map_url} 
                  width="100%" 
                  height="100%" 
                  style={{border:0}} 
                  loading="lazy"
                  allowFullScreen
                ></iframe>
             )}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2025 Main Olympic Center. Bütün hüquqlar qorunur.</p>
          <p className="mt-2 md:mt-0">Created by DestTex </p>
        </div>
      </section>

    </div>
  );
}
