"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Users,
  Pill,
  FileText,
  TrendingDown,
  Wand2,
  Calendar,
  Eye,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Clock
} from "lucide-react";
import { getDoctors, getPatients, getInventory, getRecords } from "@/lib/storage";
import { GeneratedRecord, InventoryItem } from "@/lib/types";

export default function DashboardPage() {
  const [doctorCount, setDoctorCount] = useState(20);
  const [patientCount, setPatientCount] = useState(60);
  const [inventoryCount, setInventoryCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [totalMedsUsed, setTotalMedsUsed] = useState(0);
  const [recentRecords, setRecentRecords] = useState<GeneratedRecord[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const docs = getDoctors();
    const pats = getPatients();
    const inv = getInventory();
    const recs = getRecords();

    setDoctorCount(docs.length);
    setPatientCount(pats.length);
    setInventoryCount(inv.length);
    setRecordsCount(recs.length);

    // Calculate total medicines used across non-cancelled records
    let usedCount = 0;
    recs.forEach((r) => {
      if (r.status !== "CANCELLED") {
        r.medicines.forEach((m) => {
          usedCount += m.quantity;
        });
      }
    });
    setTotalMedsUsed(usedCount);

    setRecentRecords(recs.slice(0, 5));

    // Low stock items (< 50)
    setLowStockItems(inv.filter((i) => i.currentQty < 50));
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* Educational Environment Info Callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-blue-950">MedSim AI Simulation Workspace Active</h2>
            <p className="text-xs text-blue-800 mt-0.5">
              All generated records are synthetic training artifacts for medical students. Real-world inventory subtraction is simulated deterministically.
            </p>
          </div>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          <span>Launch Generator</span>
        </Link>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Doctors Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doctors</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{doctorCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">Specialized dummy practitioners</p>
          </div>
        </div>

        {/* Patients Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{patientCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">30 Male / 30 Female dummy profiles</p>
          </div>
        </div>

        {/* Medicine Items Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine Items</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{inventoryCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">Active inventory SKUs</p>
          </div>
        </div>

        {/* Generated Records Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Records</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{recordsCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">Total synthetic records</p>
          </div>
        </div>

        {/* Total Medicines Used Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicines Used</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalMedsUsed}</span>
            <p className="text-[11px] text-slate-500 mt-1">Total units deducted</p>
          </div>
        </div>
      </div>

      {/* Main Generation Quick Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-semibold text-[10px] px-2 py-0.5 rounded uppercase">
                Core Engine
              </span>
              <h2 className="text-lg font-bold text-slate-900">Generate Synthetic Records</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Create AI-reasoned synthetic prescriptions for dates between May 1, 2026 and Sep 9, 2026.
            </p>
          </div>

          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate Records</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Start Date</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold font-mono">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>01/05/2026</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">End Date</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold font-mono">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>09/09/2026</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Records Per Day</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold font-mono">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>3 – 4 records</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medicine Items</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold font-mono">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>1 – 4 items / record</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Generated Records Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Generated Records</h3>
            <p className="text-xs text-slate-500">Latest synthetic training prescriptions created in the system</p>
          </div>
          <Link
            href="/records"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Records ({recordsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Generated Records Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You have not generated any educational prescription records. Launch the batch generator to create synthetic training data.
            </p>
            <Link
              href="/generate"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate Records Now</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-6">Bill / Record ID</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Patient</th>
                  <th className="py-3 px-6">Doctor</th>
                  <th className="py-3 px-6 text-center">Medicine Count</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {recentRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-700">{rec.billNumber}</td>
                    <td className="py-3.5 px-6 text-slate-700 font-mono">{rec.date}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{rec.patientName}</td>
                    <td className="py-3.5 px-6 text-slate-700">{rec.doctorName}</td>
                    <td className="py-3.5 px-6 text-center font-mono font-bold text-slate-800">
                      {rec.medicines.length}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rec.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : rec.status === "CANCELLED"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        href={`/records/${rec.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
