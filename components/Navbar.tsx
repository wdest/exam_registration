"use client";

import Link from "next/link";
import Image from "next/image"; // Logo üçün
import { usePathname } from "next/navigation";
import { Home, PenTool, LayoutDashboard, ClipboardList } from "lucide-react"; // ClipboardList - Nəticələr üçün ikon

export default function Navbar() {
  const pathname = usePathname();

  // ŞƏRT 1: Əgər Ana səhifədəyiksə, bu Navbar-ı GÖSTƏRMƏ (return null)
  // Çünki ana səhifənin öz dizaynı var.
  if (pathname === "/") {
    return null;
  }

  // Linkin aktiv olub-olmadığını yoxlayan funksiya
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* SOL TƏRƏF - LOGO */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 transition hover:opacity-80">
              {/* ŞƏRT 2: Yazı əvəzinə Logo şəkli */}
              <Image 
                src="/logo.png" 
                alt="MOC Logo" 
                width={120} // Ölçünü özünə uyğun tənzimlə
                height={50} 
                className="object-contain h-10 w-auto"
              />
            </Link>
          </div>

          {/* SAĞ TƏRƏF - MENYU LİNKLƏRİ */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* 1. ANA SƏHİFƏ (Əgər ana səhifədə deyiliksə göstər - onsuz da navbar orda yoxdur, amma məntiq qalsın) */}
            {!isActive("/") && (
              <Link 
                href="/" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <Home size={18} />
                <span className="hidden md:inline">Ana Səhifə</span>
              </Link>
            )}

            {/* 2. QEYDİYYAT (Əgər Qeydiyyat səhifəsində deyiliksə göstər) */}
            {!isActive("/exam") && (
              <Link 
                href="/exam" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <PenTool size={18} />
                <span className="hidden md:inline">Qeydiyyat</span>
              </Link>
            )}

            {/* 3. NƏTİCƏLƏR (YENİ - Əgər Nəticələr səhifəsində deyiliksə göstər) */}
            {!isActive("/results") && (
              <Link 
                href="/results" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <ClipboardList size={18} />
                <span className="hidden md:inline">Nəticələr</span>
              </Link>
            )}

            {/* 4. ADMIN PANEL (Əgər Admin səhifəsində deyiliksə göstər) */}
            {!isActive("/admin") && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
              >
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
