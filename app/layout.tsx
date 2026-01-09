// app/layout.tsx
import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
        
        {/* DİQQƏT: ThemeProvider hər şeyi əhatə etməlidir */}
        <ThemeProvider>
          
          <ThemeToggle />
          
          {/* Navbar mütləq ThemeProvider-in İÇİNDƏ olmalıdır */}
          <Navbar />

          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          
        </ThemeProvider>

      </body>
    </html>
  );
}
