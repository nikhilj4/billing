"use client";

import React from "react";
import { GeneratedRecord } from "@/lib/types";
import { AlertOctagon, FileCheck2, ShieldAlert } from "lucide-react";
import Barcode from "react-barcode";

interface SyntheticRecordTemplateProps {
  record: GeneratedRecord;
}

export const SyntheticRecordTemplate: React.FC<SyntheticRecordTemplateProps> = ({ record }) => {
  return (
    <div
      id="printable-record"
      className="relative bg-white border border-slate-300 rounded-xl p-8 shadow-sm max-w-3xl mx-auto font-sans text-slate-900 overflow-hidden"
    >
      {/* Large Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04] rotate-[-25deg]">
        <span className="text-7xl sm:text-8xl font-black tracking-widest text-slate-900 uppercase text-center leading-tight">
          SYNTHETIC<br />EDUCATION ONLY
        </span>
      </div>

      {/* Top Banner Notice */}
      <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-3 mb-6 text-center">
        <div className="flex items-center justify-center gap-2 text-amber-900 font-extrabold text-xs sm:text-sm tracking-wide uppercase">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>SYNTHETIC — FOR MEDICAL EDUCATION ONLY — NOT A REAL PRESCRIPTION</span>
        </div>
      </div>

      {/* Record Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-900 text-white font-bold px-2.5 py-1 rounded text-xs tracking-wider">
              MEDSIM AI
            </span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Medical Education Simulation
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Synthetic Prescription Record
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Record No: <strong className="text-slate-900 font-bold">{record.billNumber}</strong>
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Invoice Verification Barcode */}
          <div className="text-center p-1.5 bg-white border border-slate-200 rounded-lg">
            <Barcode
              value={record.billNumber}
              height={36}
              width={1.2}
              fontSize={10}
              margin={2}
              background="transparent"
            />
            <span className="block text-[9px] font-mono text-slate-500 font-bold">INVOICE BARCODE</span>
          </div>

          <div className="text-right">
            <div className="inline-block bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700">
              <span className="text-slate-500 font-medium">Record Date: </span>
              <span className="font-bold text-slate-900 font-mono">{record.date}</span>
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                record.status === "CONFIRMED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : record.status === "CANCELLED"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : "bg-blue-100 text-blue-800 border border-blue-300"
              }`}>
                Status: {record.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor & Patient Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Doctor Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Simulated Prescribing Practitioner
          </p>
          <h3 className="text-sm font-bold text-slate-900">{record.doctorName}</h3>
          <p className="text-xs text-blue-700 font-medium mt-0.5">{record.specialization}</p>
          <p className="text-xs text-slate-600 mt-2 font-mono text-[11px]">
            [Educational Dummy Doctor Data]
          </p>
        </div>

        {/* Patient Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Simulated Patient Profile
          </p>
          <h3 className="text-sm font-bold text-slate-900">{record.patientName}</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Patient ID: <span className="font-mono font-medium">{record.patientId}</span>
          </p>
          <p className="text-xs text-slate-600 mt-2 font-mono text-[11px]">
            [Educational Synthetic Patient]
          </p>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="mb-8">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-blue-600" />
          <span>Prescribed Educational Items</span>
        </h4>

        <div className="border border-slate-300 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Details</th>
                <th className="py-2.5 px-3">Batch & Expiry</th>
                <th className="py-2.5 px-3 text-center">Item Barcode</th>
                <th className="py-2.5 px-3 text-right">MRP</th>
                <th className="py-2.5 px-3 text-right">Qty</th>
                <th className="py-2.5 px-3">Dosage / Freq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {record.medicines.map((med, index) => {
                const itemCodeVal = med.itemCode || med.itemId || `MED-${(index + 1).toString().padStart(4, "0")}`;
                const batchVal = med.batchNumber || "BATCH-101";
                const expVal = med.expiryDate || "12/2028";
                const mrpVal = med.mrp ? `₹${med.mrp.toFixed(2)}` : "N/A";

                return (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono text-slate-500">{index + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{med.itemName}</div>
                      {med.manufacturer && (
                        <div className="text-[10px] text-slate-500">{med.manufacturer}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div className="text-slate-700">Batch: <span className="font-bold">{batchVal}</span></div>
                      <div className="text-slate-500 text-[10px]">Exp: {expVal}</div>
                    </td>
                    <td className="py-1 px-3 text-center">
                      <div className="inline-block p-1 bg-white border border-slate-200 rounded">
                        <Barcode
                          value={med.itemName}
                          height={22}
                          width={0.95}
                          fontSize={8}
                          margin={1}
                          background="transparent"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">{mrpVal}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">{med.quantity}</td>
                    <td className="py-3 px-3 text-slate-700 text-[11px]">
                      <div className="font-semibold text-slate-900">{med.frequency}</div>
                      <div className="text-slate-500 text-[10px]">{med.duration}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="border-t-2 border-slate-200 pt-4 mt-6 text-center">
        <div className="flex items-center justify-center gap-1.5 text-slate-600 text-[11px] font-medium">
          <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            This document is synthetic training data and is not valid for medical treatment, dispensing, billing, insurance, or legal use.
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono mt-1">
          Generated via MedSim AI Engine • No signatures, registration numbers, or medical seals present.
        </p>
      </div>
    </div>
  );
};
