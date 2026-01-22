"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { usePathname } from "next/navigation";
import { Home, PenTool, ClipboardList, Zap, Menu, X, UserCircle } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- GİZLƏTMƏ MƏNTİQİ ---
  if (
    pathname === "/" ||                   // 1. Ana Səhifədə gizlət
    // pathname === "/login" ||           // Logində görünür
    pathname === "/student-login" ||      // (Köhnə login varsa, orada da gizlət)
    pathname === "/redirect" ||           // Redirect səhifəsində gizlət
    pathname.startsWith("/student") ||    // 3. Şagird kabinetinin içində hər yerdə gizlət
    pathname.startsWith("/teacher-cabinet") // 4. Müəllim kabinetinin içində hər yerdə gizlət
  ) {
    return null; 
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* SOL TƏRƏF - LOGO */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
              <Image 
                src="/logo.png" 
                alt="MOC Logo" 
                width={300}        
                height={120} 
                className="object-contain h-16 w-auto"
                priority
              />
            </Link>
          </div>

          {/* SAĞ TƏRƏF - DESKTOP MENYU */}
          <div className="hidden md:flex items-center gap-2 md:gap-4">
            
            <Link 
                href="/" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
            >
                <Home size={18} />
                <span>Ana Səhifə</span>
            </Link>

            {!isActive("/exam") && (
              <Link 
                href="/exam" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <PenTool size={18} />
                <span>Qeydiyyat</span>
              </Link>
            )}

            {!isActive("/netice") && (
              <Link 
                href="/netice" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <ClipboardList size={18} />
                <span>Nəticələr</span>
              </Link>
            )}

            {/* DÜZƏLDİLDİ: İmtahana Başla -> /redirect */}
            <Link 
              href="/redirect" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 transition border border-amber-200"
            >
              <Zap size={18} className="text-amber-500" />
              <span>İmtahana Başla</span>
            </Link>

          </div>

          {/* MOBİL MENU DÜYMƏSİ (HAMBURGER) */}
          <div className="md:hidden flex items-center">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 p-2">
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
             </button>
          </div>
        </div>
      </div>

      {/* --- MOBİL MENU CONTENT --- */}
      <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg absolute w-full left-0 top-20 z-40"
            >
              <div className="px-4 py-6 space-y-4 flex flex-col">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <Home size={20} /> Ana Səhifə
                </Link>
                
                <Link href="/exam" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <PenTool size={20} /> Qeydiyyat
                </Link>

                <Link href="/netice" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 flex items-center gap-2">
                    <ClipboardList size={20} /> Nəticələr
                </Link>
                
                {/* DÜZƏLDİLDİ: Kabinetə Giriş -> /login */}
                <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-lg font-bold text-gray-800 bg-gray-50 p-3 rounded-xl hover:bg-amber-50"
                >
                    <UserCircle size={20}/> Kabinetə Giriş
                </Link>

                {/* DÜZƏLDİLDİ: İmtahana Başla -> /redirect */}
                <Link href="/redirect" onClick={() => setIsMobileMenuOpen(false)} className="block w-full text-center bg-amber-500 text-white py-4 rounded-xl font-bold shadow-md text-lg">
                  ⚡ İmtahana Başla
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </nav>
  );
}
