"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export const SyntheticDisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs py-2 px-4 flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong className="font-semibold uppercase tracking-wider">SYNTHETIC — FOR MEDICAL EDUCATION ONLY — NOT A REAL PRESCRIPTION</strong>
        </span>
      </div>
      <div className="flex items-center gap-2 text-amber-700 font-mono text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Demo Environment • Educational Data Only</span>
      </div>
    </div>
  );
};
