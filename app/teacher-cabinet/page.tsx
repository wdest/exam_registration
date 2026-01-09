"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users, BookOpen, UserCheck } from "lucide-react";
import Link from "next/link";

export default function TeacherCabinet() {
  const router = useRouter();

  // Giriş icazəsini yoxlayırıq (Sadə versiya)
  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const hasToken = cookies.find((row) => row.startsWith("teacher_token="));
    if (!hasToken) {
      router.push("/login?type=teacher");
    }
  }, [router]);

  const handleLogout = () => {
    document.cookie = "teacher_token=; path=/; max-age=0"; // Tokeni silirik
    router.push("/login?type=teacher");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Üst Panel (Navbar) */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BookOpen className="text-blue-600" />
          Müəllim Kabineti
        </h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium transition"
        >
          <LogOut size={18} /> Çıxış
        </button>
      </nav>

      {/* Əsas Hissə */}
      <main className="p-6 max-w-7xl mx-auto">
        
        {/* Salamlama */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-8">
          <h2 className="text-3xl font-bold mb-2">Xoş Gəldiniz, Müəllim! 👋</h2>
          <p className="opacity-90">Buradan şagirdlərin nəticələrini və qrupları idarə edə bilərsiniz.</p>
        </div>

        {/* Statistikalar (Kartlar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Ümumi Şagird</p>
              <h3 className="text-2xl font-bold text-gray-800">124</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">İmtahan Verən</p>
              <h3 className="text-2xl font-bold text-gray-800">98</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Aktiv Qruplar</p>
              <h3 className="text-2xl font-bold text-gray-800">8</h3>
            </div>
          </div>
        </div>

        {/* Bura gələcəkdə cədvəl qoyacağıq */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[300px] flex items-center justify-center text-gray-400 border-dashed border-2">
            Bura şagird siyahısı və ya imtahan nəticələri gələcək...
        </div>

      </main>
    </div>
  );
}
