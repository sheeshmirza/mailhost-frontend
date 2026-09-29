import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Resend | Email for developers",
  description: "High-performance email delivery engine and developer platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-brand-100 font-sans antialiased selection:bg-brand-800">
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 pl-56 min-h-[calc(100vh-3.5rem)] pb-16">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
