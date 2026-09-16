"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SyntheticDisclaimerBanner } from "./SyntheticDisclaimerBanner";

export const AppLayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Get current page title dynamically
  const getPageMeta = () => {
    if (pathname === "/dashboard") return { title: "Dashboard Overview", subtitle: "Synthetic prescription simulation metrics & quick generator" };
    if (pathname === "/doctors") return { title: "Doctors Registry", subtitle: "20 dummy medical practitioners for educational simulation" };
    if (pathname === "/patients") return { title: "Patients Directory", subtitle: "60 dummy patient records for educational scenario modeling" };
    if (pathname === "/inventory") return { title: "Medicine Inventory", subtitle: "Track available stock, usages, restocks, and deductions" };
    if (pathname === "/generate") return { title: "Generate Synthetic Records", subtitle: "Configure & run batch educational record generation jobs" };
    if (pathname.startsWith("/records/")) return { title: "Synthetic Prescription Record", subtitle: "Detailed view, inventory impact, and audit history" };
    if (pathname === "/records") return { title: "Generated Records History", subtitle: "Filter, search, view, and print synthetic training prescriptions" };
    if (pathname === "/settings") return { title: "System Settings", subtitle: "Gemini API status, default rules, and demo data management" };
    return { title: "MedSim AI", subtitle: "Medical Education Simulator" };
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <SyntheticDisclaimerBanner />
      <div className="flex flex-1">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header
            title={meta.title}
            subtitle={meta.subtitle}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
