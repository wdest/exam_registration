"use client";

import Link from "next/link";
import Image from "next/image"; 
import { usePathname } from "next/navigation";
import { Home, PenTool, ClipboardList, Zap } from "lucide-react"; 

export default function Navbar() {
  const pathname = usePathname();

  // Ana səhifədə, Login səhifəsində və Redirect səhifəsində Navbar gizlədilsin
  if (pathname === "/" || pathname === "/student-login" || pathname === "/redirect") {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* SOL TƏRƏF - LOGO */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
              <Image 
                src="/logo.png" 
                alt="MOC Logo" 
                width={140} 
                height={50} 
                className="object-contain h-12 w-auto"
                priority
              />
            </Link>
          </div>

          {/* SAĞ TƏRƏF - MENYU LİNKLƏRİ */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Ana Səhifə Linki */}
            {!isActive("/") && (
              <Link 
                href="/" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <Home size={18} />
                <span className="hidden md:inline">Ana Səhifə</span>
              </Link>
            )}

            {/* Qeydiyyat Linki */}
            {!isActive("/exam") && (
              <Link 
                href="/exam" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <PenTool size={18} />
                <span className="hidden md:inline">Qeydiyyat</span>
              </Link>
            )}

            {/* NƏTİCƏLƏR LİNKİ */}
            {!isActive("/netice") && (
              <Link 
                href="/netice" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <ClipboardList size={18} />
                <span className="hidden md:inline">Nəticələr</span>
              </Link>
            )}

            {/* --- YENİ: İMTAHANA BAŞLA (Redirect) --- */}
            {/* Admin linki silindi, yerinə bu gəldi */}
            {!isActive("/redirect") && (
              <Link 
                href="/redirect" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 transition border border-amber-200"
              >
                <Zap size={18} className="text-amber-500" />
                <span className="hidden md:inline">İmtahana Başla</span>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
