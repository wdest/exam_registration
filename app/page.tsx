"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion"; 
import { UserCircle, Menu, X } from "lucide-react"; 

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Animasiya
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
   
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [siteInfo, setSiteInfo] = useState({
    phone: "+994 50 123 45 67",
    address: "Bakı şəhəri, Nərimanov r.",
    email: "info@moc.az",
    map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3039.428674854084!2d49.85172431539656!3d40.37719087936967!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40307d079efb5163%3A0xc20aa51a5f0f5e01!2sBaku!5e0!3m2!1sen!2saz!4v1642155555555!5m2!1sen!2saz"
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: galData } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-orange-50/30 font-sans text-gray-800 overflow-x-hidden">
       
      {/* --- 1. NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
             
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 flex items-center cursor-pointer"
            >
              <Image 
                src="/logo.png" 
                alt="Main Olympic Center Logo" 
                width={140} 
                height={50} 
                className="object-contain h-12 md:h-16 w-auto" 
                priority
              />
            </motion.div>

            {/* --- DESKTOP MENU --- */}
            <div className="hidden md:flex items-center space-x-8 font-medium text-gray-600">
              <a href="#services" className="hover:text-amber-600 transition">Xidmətlər</a>
              <a href="#contact" className="hover:text-amber-600 transition">Əlaqə</a>
              <Link href="/netice" className="hover:text-amber-600 transition flex items-center gap-1">
                <span>📊</span> Nəticələr
              </Link>

              <Link 
                href="/login" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-600 transition font-bold border border-gray-100"
              >
                  <UserCircle size={20} />
                  Kabinetə Giriş
              </Link>

              <Link href="/exam" className="bg-amber-500 text-white px-6 py-3 rounded-xl hover:bg-amber-600 transition shadow-lg shadow-amber-500/20 font-bold">
                İmtahan Qeydiyyatı
              </Link>
            </div>

            {/* --- MOBILE MENU BUTTON --- */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 p-2">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* --- MOBILE MENU CONTENT --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700">Xidmətlər</a>
                <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700">Əlaqə</a>
                <Link href="/netice" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 flex items-center gap-2"><span>📊</span> Nəticələr</Link>
                 
                <Link 
                    href="/student-login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-lg font-bold text-gray-800 bg-gray-50 p-3 rounded-xl hover:bg-amber-50"
                >
                    <UserCircle size={20}/> Kabinetə Giriş
                </Link>

                <Link href="/exam" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center bg-amber-500 text-white py-4 rounded-xl font-bold shadow-md text-lg">
                  İmtahan Qeydiyyatı
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <section className="pt-32 pb-16 md:pt-48 md:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-orange-50 via-white to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4 md:mb-6"
          >
            Zirvəyə gedən yol <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Main Olympic Center</span> ilə başlayır
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-base md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 md:mb-10 px-2"
          >
            Peşəkar yanaşma və olimpiada standartlarında təhsil ilə övladınızın gələcəyini bu gündən sığortalayın.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center gap-6 px-4"
          >
             {/* 1. ÜST SIRA */}
             <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
                 <Link 
                   href="/redirect" 
                   className="w-full sm:w-auto px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border-2 border-gray-100 shadow-sm hover:border-blue-500 hover:text-blue-600 transition duration-200 text-center flex items-center justify-center gap-2"
                 >
                   🚀 İmtahana Başla
                 </Link>
                 <a 
                   href="#contact" 
                   className="w-full sm:w-auto px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border-2 border-gray-100 shadow-sm hover:border-orange-500 hover:text-orange-600 transition text-center"
                 >
                   Əlaqə Saxla
                 </a>
             </div>

             {/* 2. ALT SIRA */}
             <Link 
               href="/exam" 
               className="w-full sm:w-96 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-orange-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
             >
               ✍️ Sınağa Yazıl
             </Link>
          </motion.div>
        </div>
      </section>

      {/* --- 3. XİDMƏTLƏRİMİZ (DƏYİŞİKLİK BURADA: SMM) --- */}
      <section id="services" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tədris İstiqamətlərimiz</h2>
            <p className="mt-2 md:mt-4 text-gray-500">MOC keyfiyyəti ilə hər fənn daha maraqlı</p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {/* 1. Riyaziyyat */}
            <motion.div variants={itemVariants} className="p-6 md:p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition duration-300 group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 group-hover:scale-110 transition">📐</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">Riyaziyyat və Məntiq</h3>
              <p className="text-sm md:text-base text-gray-600">Güclü məntiqi təfəkkür formalaşdıran xüsusi proqramlar.</p>
            </motion.div>
            
            {/* 2. SMM (DƏYİŞDİRİLDİ) */}
            <motion.div variants={itemVariants} className="p-6 md:p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition duration-300 group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 group-hover:scale-110 transition">📢</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">SMM və Marketinq</h3>
              <p className="text-sm md:text-base text-gray-600">Sosial media hesablarının peşəkar idarə edilməsi və brendinq.</p>
            </motion.div>
            
            {/* 3. İT */}
            <motion.div variants={itemVariants} className="p-6 md:p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition duration-300 group">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-4 md:mb-6 group-hover:scale-110 transition">💻</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">İT və Proqramlaşdırma</h3>
              <p className="text-sm md:text-base text-gray-600">Gələcəyin texnologiyalarını indidən öyrənin.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- 4. QALEREYA (YENİ DİZAYN) --- */}
      <section id="gallery" className="py-16 md:py-24 bg-gradient-to-r from-orange-50 via-white to-orange-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 mb-10 text-center relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Mərkəzimizdən Görüntülər</h2>
            <p className="mt-2 text-gray-500">Tələbələrimizin uğurları və dərs mühiti</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-amber-500 animate-pulse">Yüklənir...</div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center text-gray-400">Şəkil yoxdur.</div>
        ) : (
          <div className="relative w-full py-10">
            {/* Gradient Mask for Smooth Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />

            {/* Sonsuz Fırlanan Hissə */}
            <motion.div 
              className="flex gap-8 w-max px-8"
              animate={{ x: ["0%", "-50%"] }} 
              transition={{ 
                ease: "linear", 
                duration: 50, // Sürəti tənzimlədim (daha asta və axıcı)
                repeat: Infinity 
              }}
              // Mouse üzərinə gələndə axını dayandırır ki, rahat baxılsın
              whileHover={{ animationPlayState: "paused" }}
            >
              {[...galleryImages, ...galleryImages, ...galleryImages].map((item, index) => (
                <motion.div 
                  key={index} 
                  className="relative w-72 h-52 md:w-96 md:h-64 flex-shrink-0 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gray-100 cursor-pointer"
                  // YENİLİK: Hover effektləri (Böyümə və Parıltı)
                  whileHover={{ 
                    scale: 1.15, 
                    rotate: index % 2 === 0 ? 2 : -2, // Bir az əyilir
                    zIndex: 50,
                    boxShadow: "0px 20px 40px rgba(245, 158, 11, 0.3)" // Amber kölgə
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <img src={item.image_url} alt="Gallery" className="w-full h-full object-cover"/>
                  
                  {/* Şəkil üzərinə gələndə yaranan parıltı layı */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                     <span className="text-white font-medium text-sm">MOC Gallery</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </section>

      {/* --- 5. FOOTER --- */}
      <section id="contact" className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          <div>
            <div className="mb-4">
               <span className="text-2xl font-extrabold text-amber-500">MOC</span>
               <span className="block text-xs font-bold text-black tracking-widest">MAIN OLYMPIC CENTER</span>
            </div>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Main Olympic Center - Təhsilin olimpiadası. Bizimlə hədəflərinizə daha sürətli çatın.
            </p>
            <div className="space-y-3 text-sm md:text-base">
              <p className="flex items-center text-gray-700"><span className="mr-3">📍</span> {siteInfo.address}</p>
              <a href={`tel:${siteInfo.phone}`} className="flex items-center text-gray-700 hover:text-amber-600"><span className="mr-3">📞</span> {siteInfo.phone}</a>
              <a href={`mailto:${siteInfo.email}`} className="flex items-center text-gray-700 hover:text-amber-600"><span className="mr-3">📧</span> {siteInfo.email}</a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6 text-lg">Keçidlər</h4>
            <ul className="space-y-3 text-gray-600 text-sm md:text-base">
              <li><Link href="/exam" className="hover:text-amber-500">🔹 İmtahan Qeydiyyatı</Link></li>
              <li><Link href="/netice" className="hover:text-amber-500">🔹 İmtahan Nəticələri</Link></li>
              <li><a href="#services" className="hover:text-amber-500">🔹 Xidmətlərimiz</a></li>
            </ul>
          </div>

          <div className="h-48 md:h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
             {!siteInfo.map_url ? <div className="flex items-center justify-center h-full text-gray-400">Xəritə...</div> : 
                <iframe src={siteInfo.map_url} width="100%" height="100%" style={{border:0}} loading="lazy" allowFullScreen></iframe>
             }
          </div>
        </div>
         
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs md:text-sm">
          <p>© 2025 Main Olympic Center. Bütün hüquqlar qorunur.</p>
          <p className="mt-2 md:mt-0">Created by DestTex </p>
        </div>
      </section>

    </div>
  );
}
