"use client";

import React, { useState, useEffect } from "react";
import { getPatients } from "@/lib/storage";
import { Patient } from "@/lib/types";
import { Users, Search, User, ShieldCheck } from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "Male" | "Female">("ALL");

  useEffect(() => {
    setPatients(getPatients());
  }, []);

  const filteredPatients = patients.filter((pat) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      pat.patientName.toLowerCase().includes(term) ||
      pat.patientId.toLowerCase().includes(term);
    const matchesGender = genderFilter === "ALL" || pat.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const maleCount = patients.filter((p) => p.gender === "Male").length;
  const femaleCount = patients.filter((p) => p.gender === "Female").length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Patients Directory ({filteredPatients.length} / {patients.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            60 synthetic educational patient names ({maleCount} Male / {femaleCount} Female). No personal identifiable information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Gender Filter Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => setGenderFilter("ALL")}
              className={`px-3 py-1 rounded-md transition-colors ${
                genderFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All (60)
            </button>
            <button
              onClick={() => setGenderFilter("Male")}
              className={`px-3 py-1 rounded-md transition-colors ${
                genderFilter === "Male" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Male (30)
            </button>
            <button
              onClick={() => setGenderFilter("Female")}
              className={`px-3 py-1 rounded-md transition-colors ${
                genderFilter === "Female" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Female (30)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patient name or ID..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Patient ID</th>
                <th className="py-3.5 px-6">Patient Name</th>
                <th className="py-3.5 px-6">Gender</th>
                <th className="py-3.5 px-6">Data Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    No patients found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredPatients.map((pat) => (
                  <tr key={pat.patientId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-500 font-semibold">{pat.patientId}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 border border-slate-200">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{pat.patientName}</span>
                          <span className="text-[10px] text-slate-400">Synthetic Profile</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                        pat.gender === "Male"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}>
                        {pat.gender}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 font-mono">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Synthetic Educational Data</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
