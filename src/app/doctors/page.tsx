"use client";

import React, { useState, useEffect } from "react";
import { getDoctors } from "@/lib/storage";
import { Doctor } from "@/lib/types";
import { Stethoscope, Search, Building2, MapPin, Award } from "lucide-react";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setDoctors(getDoctors());
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const term = searchTerm.toLowerCase();
    return (
      doc.doctorName.toLowerCase().includes(term) ||
      doc.specializationQualification.toLowerCase().includes(term) ||
      doc.clinicHospital.toLowerCase().includes(term) ||
      doc.areaLocality.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info & Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Doctors Directory ({filteredDoctors.length} / {doctors.length})</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            20 synthetic dummy medical practitioners used as prescribing context for AI simulation.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search doctors, specializations..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none transition-all"
          />
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Doctor ID</th>
                <th className="py-3.5 px-6">Doctor Name</th>
                <th className="py-3.5 px-6">Specialization / Qualification</th>
                <th className="py-3.5 px-6">Clinic / Hospital</th>
                <th className="py-3.5 px-6">Area / Locality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No doctors found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-500 font-semibold">{doc.id}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 block">{doc.doctorName}</span>
                      <span className="text-[10px] text-blue-600 font-mono">Educational Dummy Doctor</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{doc.specializationQualification}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.clinicHospital}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.areaLocality}</span>
                      </div>
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
