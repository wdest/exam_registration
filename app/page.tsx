"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion"; // Animasiya kitabxanası

// Supabase tənzimləmələri
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Animasiya variantları (Kartların tək-tək açılması üçün)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2 // Hər kart arasında 0.2 saniyə fərq qoyur
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5 }
  }
};

export default function LandingPage() {
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Qalereyanı bazadan çəkmək
  useEffect(() => {
    async function fetchGallery() {
      try {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) setGalleryImages(data);
      } catch (err) {
        console.error("Qalereya xətası:", err);
      } finally {
        setLoadingGallery(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <div className="min-h-screen bg-orange-50/30 font-sans text-gray-800">
      
      {/* --- 1. NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            
            {/* Logo Hissəsi */}
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

            {/* Desktop Menu */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:flex items-center space-x-8 font-medium text-gray-600"
            >
              <a href="#services" className="hover:text-amber-600 transition duration-200">Xidmətlər</a>
              <a href="#gallery" className="hover:text-amber-600 transition duration-200">Həyatımız</a>
              <a href="#contact" className="hover:text-amber-600 transition duration-200">Əlaqə</a>
              
              <Link href="/netice" className="hover:text-amber-600 transition duration-200 flex items-center gap-1">
                <span>📊</span> Nəticələr
              </Link>

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

      {/* --- 2. HERO SECTION (Giriş) --- */}
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

      {/* --- 3. XİDMƏTLƏRİMİZ (Services) --- */}
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
            {/* Card 1 */}
            <motion.div variants={itemVariants} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition duration-300 group">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">📐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Riyaziyyat və Məntiq</h3>
              <p className="text-gray-600">Güclü məntiqi təfəkkür formalaşdıran xüsusi proqramlar.</p>
            </motion.div>
            
            {/* Card 2 */}
            <motion.div variants={itemVariants} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-teal-500/10 transition duration-300 group">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Xarici Dillər</h3>
              <p className="text-gray-600">İngilis və Rus dili üzrə qabaqcıl tədris metodikası.</p>
            </motion.div>
            
            {/* Card 3 */}
            <motion.div variants={itemVariants} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-rose-500/10 transition duration-300 group">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition">💻</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">İT və Proqramlaşdırma</h3>
              <p className="text-gray-600">Gələcəyin texnologiyalarını indidən öyrənin.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- 4. DİNAMİK QALEREYA --- */}
      <section id="gallery" className="py-24 bg-orange-50/50 border-t border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900">Mərkəzimizdən Görüntülər</h2>
            <p className="mt-4 text-gray-500">Tələbələrimizin uğurları və dərs mühiti</p>
          </motion.div>

          {loadingGallery ? (
            <div className="text-center py-10 text-amber-500 animate-pulse font-medium">Şəkillər yüklənir...</div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400">Hələlik qalereyada şəkil yoxdur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {galleryImages.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }} // Hər şəkil bir az gecikir
                  viewport={{ once: true }}
                  className="group relative overflow-hidden rounded-2xl shadow-md h-64 cursor-pointer"
                >
                  <img 
                    src={item.image_url} 
                    alt="MOC Qalereya" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-300"></div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
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
                Bakı şəhəri, Nərimanov r.
              </p>
              <p className="flex items-center text-gray-700 group cursor-pointer">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition">📞</span> 
                +994 50 123 45 67
              </p>
              <p className="flex items-center text-gray-700 group cursor-pointer">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3 group-hover:bg-amber-500 group-hover:text-white transition">📧</span> 
                info@moc.az
              </p>
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

          {/* Xəritə */}
          <div className="h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3039.428490145657!2d49.8670924!3d40.4092617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40307d40a880b19d%3A0x66c7b04921f08e4!2sBaku!5e0!3m2!1sen!2saz!4v1648000000000!5m2!1sen!2saz" 
              width="100%" 
              height="100%" 
              style={{border:0}} 
              loading="lazy"
            ></iframe>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-20 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>© 2025 Main Olympic Center. Bütün hüquqlar qorunur.</p>
          <p className="mt-2 md:mt-0">Created by HARX Group</p>
        </div>
      </section>

    </div>
  );
}
