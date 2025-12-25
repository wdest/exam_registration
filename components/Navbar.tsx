// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenTool, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // Linkin aktiv olub-olmadığını yoxlamaq üçün köməkçi funksiya
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LOGO HİSSƏSİ */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">M</div>
              <span className="text-xl font-bold text-gray-800">MOC Sistem</span>
            </Link>
          </div>

          {/* LİNKLƏR HİSSƏSİ */}
          <div className="flex items-center gap-4">
            
            {/* Ana Səhifə Linki */}
            <Link 
              href="/" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive("/") 
                  ? "bg-amber-50 text-amber-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Home size={18} />
              <span className="hidden md:inline">Ana Səhifə</span>
            </Link>

            {/* Qeydiyyat Linki (Sizin yaratdığınız /exam səhifəsi) */}
            <Link 
              href="/exam" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive("/exam") 
                  ? "bg-amber-50 text-amber-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <PenTool size={18} />
              <span className="hidden md:inline">Qeydiyyat</span>
            </Link>

            {/* Admin Panel Linki */}
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive("/admin") 
                  ? "bg-amber-50 text-amber-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <LayoutDashboard size={18} />
              <span className="hidden md:inline">Admin</span>
            </Link>

          </div>
        </div>
      </div>
    </nav>
  );
}
