import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../components/ThemeProvider"; // Yeni import
import ThemeToggle from "../components/ThemeToggle";       // Yeni import

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning - bu vacibdir, yoxsa konsolda xəta verir
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
        
        <ThemeProvider>
          {/* Düyməni bura qoydum ki, hər yerdə görünsün */}
          <ThemeToggle />

          <Navbar />

          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
        </ThemeProvider>

      </body>
    </html>
  );
}
