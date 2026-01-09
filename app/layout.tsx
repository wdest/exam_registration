import "./globals.css";
import Navbar from "../components/Navbar"; 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        
        <Navbar />

        <main className="min-h-[calc(100vh-64px)]">
           {children}
        </main>
        
      </body>
    </html>
  );
}
