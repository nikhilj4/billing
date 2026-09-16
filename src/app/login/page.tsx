"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { Activity, ShieldCheck, KeyRound, UserCheck, AlertCircle } from "lucide-react";
import { SyntheticDisclaimerBanner } from "@/components/SyntheticDisclaimerBanner";

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = login(employeeId, password);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Invalid Employee ID or Password. Use demo / demo123");
    }
  };

  const autofillDemo = () => {
    setEmployeeId("demo");
    setPassword("demo123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <SyntheticDisclaimerBanner />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Card Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/20 mb-4">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MedSim AI</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Medical Prescription Learning Simulator
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mt-3 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Demo / Educational Environment
            </span>
          </div>

          {/* Login Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {error && (
              <div className="mb-6 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter employee ID (e.g. demo)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (e.g. demo123)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-xs mt-2"
              >
                Sign In
              </button>
            </form>

            {/* Quick Demo Autofill Helper */}
            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 mb-2">Need quick credentials for testing?</p>
              <button
                type="button"
                onClick={autofillDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-fill Demo Credentials (demo / demo123)</span>
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Educational Simulation System • All records produced are synthetic.
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        MedSim AI — Designed for Medical Student Education & Inventory Training
      </footer>
    </div>
  );
}
