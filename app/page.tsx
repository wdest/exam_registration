"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// Supabase tənzimləmələri
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LandingPage() {
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Qalereyanı bazadan çəkmək üçün funksiya
  useEffect(() => {
    async function fetchGallery() {
      try {
        const { data, error } = await supabase
          .from("gallery") // Cədvəl adı 'gallery' olmalıdır
          .select("*")
          .order("created_at", { ascending: false }); // Ən yenilər birinci gəlsin

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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- 1. NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                K
              </div>
              <span className="font-bold text-xl tracking-tight text-blue-900">KursAdı</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center font-medium">
              <a href="#services" className="hover:text-blue-600 transition">Xidmətlər</a>
              <a href="#gallery" className="hover:text-blue-600 transition">Həyatımız</a>
              <a href="#contact" className="hover:text-blue-600 transition">Əlaqə</a>
              <Link 
                href="/imtahan-qeydiyyat" 
                className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                İmtahan Qeydiyyatı
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- 2. HERO SECTION (Giriş) --- */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Gələcəyini <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Bizimlə</span> İnşa Et
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Peşəkar müəllim heyəti, müasir tədris metodları və zəmanətli nəticələr.
            Hədəflərinizə çatmaq üçün doğru ünvandasınız.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
             <Link href="/imtahan-qeydiyyat" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-xl hover:bg-blue-700 transform hover:-translate-y-1 transition duration-200">
               Sınağa Yazıl
             </Link>
             <a href="#contact" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition">
               Əlaqə Saxla
             </a>
          </div>
        </div>
      </section>

      {/* --- 3. XİDMƏTLƏRİMİZ (Services) --- */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Tədris Proqramlarımız</h2>
            <p className="mt-4 text-gray-500">Hər yaş qrupu üçün xüsusi hazırlanmış dərslər</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition duration-300">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl mb-6">📐</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Riyaziyyat və Məntiq</h3>
              <p className="text-gray-600">Abituriyentlər və aşağı siniflər üçün gücləndirilmiş riyaziyyat dərsləri.</p>
            </div>
            {/* Card 2 */}
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition duration-300">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-2xl mb-6">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Xarici Dillər</h3>
              <p className="text-gray-600">İngilis və Rus dili üzrə danışıq və qrammatika dərsləri.</p>
            </div>
            {/* Card 3 */}
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl transition duration-300">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-2xl mb-6">💻</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">İT və Proqramlaşdırma</h3>
              <p className="text-gray-600">Uşaqlar üçün kodlaşdırma və kompüter savadlılığı kursları.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. DİNAMİK QALEREYA --- */}
      <section id="gallery" className="py-20 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Kursumuzdan Görüntülər</h2>
            <p className="mt-4 text-gray-500">Tələbələrimizin uğurları və dərs prosesi</p>
          </div>

          {loadingGallery ? (
            <div className="text-center py-10 text-gray-400 animate-pulse">Şəkillər yüklənir...</div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Hələlik qalereyada şəkil yoxdur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {galleryImages.map((item) => (
                <div key={item.id} className="group relative overflow-hidden rounded-2xl shadow-md h-64 cursor-pointer">
                  {/* Next.js Image yerinə sadə img işlədirik ki, URL konfiqurasiyası ilə uğraşmayasınız */}
                  <img 
                    src={item.image_url} 
                    alt="Kurs qalereyası" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition duration-300"></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- 5. ƏLAQƏ (Footer) --- */}
      <section id="contact" className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Məlumat */}
          <div>
            <h3 className="text-2xl font-bold text-blue-900 mb-6">KursAdı</h3>
            <p className="text-gray-600 mb-6">Təhsilin keyfiyyətini artırmaq və gələcəyin mütəxəssislərini yetişdirmək üçün xidmətinizdəyik.</p>
            <div className="space-y-3">
              <p className="flex items-center text-gray-700">📍 Bakı şəhəri, Nərimanov r.</p>
              <p className="flex items-center text-gray-700">📞 +994 50 123 45 67</p>
              <p className="flex items-center text-gray-700">📧 info@kursadi.com</p>
            </div>
          </div>

          {/* Keçidlər */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Tez-tez verilən suallar</h4>
            <ul className="space-y-3 text-gray-600">
              <li><a href="#" className="hover:text-blue-600">Qeydiyyat prosesi</a></li>
              <li><a href="#" className="hover:text-blue-600">Ödəniş üsulları</a></li>
              <li><a href="#" className="hover:text-blue-600">Müəllimlər</a></li>
            </ul>
          </div>

          {/* Xəritə (Sadə görünüş) */}
          <div className="h-48 bg-gray-200 rounded-xl overflow-hidden relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3039.428490145618!2d49.86709241539656!3d40.409261679366!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40307d5c9c65603f%3A0x6c57d76b4a8761!2sBaku!5e0!3m2!1sen!2saz!4v1625684321234!5m2!1sen!2saz" 
              width="100%" 
              height="100%" 
              style={{border:0}} 
              loading="lazy"
            ></iframe>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-100 text-center text-gray-500 text-sm">
          © 2024 Bütün hüquqlar qorunur. Designed by Gemini.
        </div>
      </section>

    </div>
  );
}
