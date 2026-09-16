import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { ToastProvider } from "@/components/Toast";
import { AppLayoutWrapper } from "@/components/AppLayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedSim AI — Medical Prescription Learning Simulator",
  description: "Educational simulation project for medical students to learn prescription workflows and medicine inventory tracking."
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 antialiased text-slate-900`}>
        <AuthProvider>
          <ToastProvider>
            <AppLayoutWrapper>
              {children}
            </AppLayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
