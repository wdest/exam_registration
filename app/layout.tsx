import "./globals.css";
import Navbar from "@/components/Navbar"; // <--- 1. Navbar-ı import edirik

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50"> {/* Arxa fon rəngi əlavə etdim */}
        
        {/* 2. Navbar-ı bura qoyuruq ki, hər səhifədə görünsün */}
        <Navbar />

        {/* 3. Məzmunu main içinə alırıq */}
        <main className="min-h-[calc(100vh-64px)]">
           {children}
        </main>
        
      </body>
    </html>
  );
}
