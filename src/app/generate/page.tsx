"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wand2,
  Calendar,
  Clock,
  Pill,
  Play,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  ShieldCheck,
  Cpu,
  Loader2
} from "lucide-react";
import { getDoctors, getPatients, getInventory, saveRecord, saveTransaction, saveInventory } from "@/lib/storage";
import { Doctor, Patient, InventoryItem, GeneratedRecord, InventoryTransaction } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function GeneratePage() {
  const { showToast } = useToast();

  // Form Configuration
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-09-09");
  const [minRecordsPerDay, setMinRecordsPerDay] = useState(3);
  const [maxRecordsPerDay, setMaxRecordsPerDay] = useState(4);
  const [minMedsPerRecord, setMinMedsPerRecord] = useState(1);
  const [maxMedsPerRecord, setMaxMedsPerRecord] = useState(4);

  // Data cache
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Preview & Progress State
  const [previewDates, setPreviewDates] = useState<{ dateStr: string; recordCount: number }[]>([]);
  const [totalEstimatedRecords, setTotalEstimatedRecords] = useState(0);
  const [isPreviewGenerated, setIsPreviewGenerated] = useState(false);

  // Generation Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentProgress, setCurrentProgress] = useState<{
    dateIndex: number;
    totalDates: number;
    currentDate: string;
    recordIndex: number;
    totalRecordsForDay: number;
    completedRecords: number;
    totalRecordsToGenerate: number;
    currentStepText: string;
  }>({
    dateIndex: 0,
    totalDates: 0,
    currentDate: "",
    recordIndex: 0,
    totalRecordsForDay: 0,
    completedRecords: 0,
    totalRecordsToGenerate: 0,
    currentStepText: ""
  });

  const cancelRef = useRef(false);

  useEffect(() => {
    setDoctors(getDoctors());
    setPatients(getPatients());
    setInventory(getInventory());
  }, []);

  // Helper to format YYYY-MM-DD to DD/MM/YYYY
  const formatDateToDDMMYYYY = (isoDate: string) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
  };

  // Generate Date List
  const generateDateList = (startIso: string, endIso: string) => {
    const dates: string[] = [];
    let current = new Date(startIso);
    const end = new Date(endIso);

    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${day}/${month}/${year}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Step 1: Generate Preview
  const handleGeneratePreview = () => {
    if (new Date(startDate) > new Date(endDate)) {
      showToast("error", "Invalid Date Range", "Start Date must be prior to or equal to End Date.");
      return;
    }

    const dateStrings = generateDateList(startDate, endDate);
    let totalEst = 0;
    const previewList = dateStrings.map((dateStr) => {
      // Pick 3 or 4 records
      const count = Math.floor(Math.random() * (maxRecordsPerDay - minRecordsPerDay + 1)) + minRecordsPerDay;
      totalEst += count;
      return { dateStr, recordCount: count };
    });

    setPreviewDates(previewList);
    setTotalEstimatedRecords(totalEst);
    setIsPreviewGenerated(true);
    showToast("info", "Preview Generated", `Calculated ${dateStrings.length} days with ~${totalEst} total synthetic records.`);
  };

  // Step 2: Batch Generation Execution Loop
  const handleStartGeneration = async () => {
    if (previewDates.length === 0) return;

    setIsGenerating(true);
    setIsCancelled(false);
    cancelRef.current = false;

    // Fresh snapshot of inventory & storage
    let currentInventoryState = getInventory();
    const allDoctors = getDoctors();
    const allPatients = getPatients();

    let totalDone = 0;
    const existingRecordsCount = localStorage.getItem("medsim_records_v1")
      ? JSON.parse(localStorage.getItem("medsim_records_v1")!).length
      : 0;

    let globalRecordCounter = existingRecordsCount + 1;

    for (let dIdx = 0; dIdx < previewDates.length; dIdx++) {
      if (cancelRef.current) break;

      const dayObj = previewDates[dIdx];
      const recordsForThisDay = dayObj.recordCount;

      // Track patients already assigned today to avoid duplicate patient on same day
      const assignedPatientsToday = new Set<string>();

      for (let rIdx = 0; rIdx < recordsForThisDay; rIdx++) {
        if (cancelRef.current) break;

        setCurrentProgress({
          dateIndex: dIdx + 1,
          totalDates: previewDates.length,
          currentDate: dayObj.dateStr,
          recordIndex: rIdx + 1,
          totalRecordsForDay: recordsForThisDay,
          completedRecords: totalDone,
          totalRecordsToGenerate: totalEstimatedRecords,
          currentStepText: "Selecting doctor, patient & available stock..."
        });

        // 1. Filter patient (avoid duplicate on same date if possible)
        let unassignedPatients = allPatients.filter(p => !assignedPatientsToday.has(p.patientId));
        if (unassignedPatients.length === 0) unassignedPatients = allPatients;
        const selectedPatient = unassignedPatients[Math.floor(Math.random() * unassignedPatients.length)];
        assignedPatientsToday.add(selectedPatient.patientId);

        // 2. Select doctor
        const selectedDoctor = allDoctors[Math.floor(Math.random() * allDoctors.length)];

        // 3. Filter available inventory items (currentQty > 0)
        const inStockItems = currentInventoryState.filter(i => i.currentQty > 0);
        if (inStockItems.length === 0) {
          showToast("error", "Stock Depleted", "All medicine items in inventory are out of stock. Stopping generation.");
          cancelRef.current = true;
          break;
        }

        // 4. Call server API /api/generate
        setCurrentProgress(prev => ({ ...prev, currentStepText: "Requesting Gemini AI prescription combination..." }));

        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              doctorId: selectedDoctor.id,
              doctorName: selectedDoctor.doctorName,
              specialization: selectedDoctor.specializationQualification,
              patientId: selectedPatient.patientId,
              patientName: selectedPatient.patientName,
              date: dayObj.dateStr,
              availableInventory: inStockItems.map(i => ({
                id: i.id,
                itemName: i.itemName,
                currentQty: i.currentQty
              })),
              minMedicines: minMedsPerRecord,
              maxMedicines: maxMedsPerRecord
            })
          });

          const apiData = await res.json();

          if (!res.ok || !apiData.success) {
            console.warn("Generation API warning:", apiData.error);
            // Skip this record if failed
            continue;
          }

          const recordPayload = apiData.recordData;

          // 5. Deduct inventory & create transactions deterministically
          setCurrentProgress(prev => ({ ...prev, currentStepText: "Deducting inventory & creating audit transactions..." }));

          const billNumber = `SIM-${String(globalRecordCounter).padStart(6, "0")}`;
          globalRecordCounter++;
          const newRecordId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

          const newTransactions: InventoryTransaction[] = [];

          for (const deduction of recordPayload.stockDeductions) {
            const invItem = currentInventoryState.find(i => i.id === deduction.itemId);
            if (invItem) {
              const qtyBefore = invItem.currentQty;
              const qtyAfter = Math.max(0, qtyBefore - deduction.quantityDeducted);
              invItem.currentQty = qtyAfter;
              invItem.updatedAt = new Date().toISOString();

              const txn: InventoryTransaction = {
                id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                itemId: invItem.id,
                recordId: newRecordId,
                type: "OUT",
                quantity: deduction.quantityDeducted,
                quantityBefore: qtyBefore,
                quantityAfter: qtyAfter,
                timestamp: new Date().toISOString()
              };
              newTransactions.push(txn);
              saveTransaction(txn);
            }
          }

          // Save updated inventory state to localStorage
          saveInventory(currentInventoryState);

          // 6. Save Synthetic Generated Record
          const recordToSave: GeneratedRecord = {
            id: newRecordId,
            billNumber,
            date: dayObj.dateStr,
            patientId: selectedPatient.patientId,
            patientName: selectedPatient.patientName,
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.doctorName,
            specialization: selectedDoctor.specializationQualification,
            medicines: recordPayload.medicines,
            status: "CONFIRMED",
            createdAt: new Date().toISOString()
          };

          saveRecord(recordToSave);

          totalDone++;
          // Brief pause for UI smoothness
          await new Promise(r => setTimeout(r, 40));

        } catch (err) {
          console.error("Record generation iteration error:", err);
        }
      }
    }

    setIsGenerating(false);
    setInventory(getInventory());

    if (cancelRef.current) {
      showToast("info", "Generation Cancelled", `Generation stopped. ${totalDone} synthetic records were created and saved.`);
    } else {
      showToast("success", "Batch Complete", `Successfully generated ${totalDone} synthetic prescription records!`);
    }
  };

  const handleCancelGeneration = () => {
    cancelRef.current = true;
    setIsCancelled(true);
  };

  const progressPercentage = currentProgress.totalRecordsToGenerate > 0
    ? Math.min(100, Math.round((currentProgress.completedRecords / currentProgress.totalRecordsToGenerate) * 100))
    : 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Synthetic Batch Generator Settings</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select simulation parameters for bulk record creation across medical dates.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Reasoning + Deterministic Stock Engine</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 font-mono outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>End Date</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 font-mono outline-none"
            />
          </div>

          {/* Records per day */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Records Per Day</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={10}
                value={minRecordsPerDay}
                onChange={(e) => setMinRecordsPerDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-center font-bold text-slate-900"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="number"
                min={1}
                max={10}
                value={maxRecordsPerDay}
                onChange={(e) => setMaxRecordsPerDay(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-center font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Medicine Items per record */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              <span>Medicines Per Record</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={6}
                value={minMedsPerRecord}
                onChange={(e) => setMinMedsPerRecord(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-center font-bold text-slate-900"
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input
                type="number"
                min={1}
                max={6}
                value={maxMedsPerRecord}
                onChange={(e) => setMaxMedsPerRecord(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-center font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Deterministic stock safeguards are enforced automatically on every run.</span>
          </div>

          <button
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate Preview</span>
          </button>
        </div>
      </div>

      {/* Generation Preview Breakdown Card */}
      {isPreviewGenerated && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">Job Preview & Impact Estimate</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulating {previewDates.length} days from {formatDateToDDMMYYYY(startDate)} to {formatDateToDDMMYYYY(endDate)}.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Estimated Records</span>
                <span className="text-lg font-black text-blue-700 font-mono">~{totalEstimatedRecords} records</span>
              </div>

              {!isGenerating && (
                <button
                  onClick={handleStartGeneration}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Confirm & Save All Records</span>
                </button>
              )}
            </div>
          </div>

          {/* Sample date rows preview table */}
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-center">Projected Records</th>
                  <th className="py-2.5 px-4">Sample Assigned Doctors</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {previewDates.slice(0, 10).map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{d.dateStr}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-blue-700">{d.recordCount} records</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">Randomized across 20 doctors</td>
                    <td className="py-2.5 px-4 text-slate-400">Ready to execute</td>
                  </tr>
                ))}
                {previewDates.length > 10 && (
                  <tr>
                    <td colSpan={4} className="py-2 px-4 text-center text-slate-500 font-sans text-xs bg-slate-50">
                      ... plus {previewDates.length - 10} more dates
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress UI Overlay Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Generating Synthetic Records...</h3>
                  <p className="text-xs text-slate-500 font-mono">Date: {currentProgress.currentDate || "Initializing..."}</p>
                </div>
              </div>

              <button
                onClick={handleCancelGeneration}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold border border-red-200 transition-colors"
              >
                Cancel Generation
              </button>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Overall Progress</span>
                <span className="font-mono text-blue-700">{progressPercentage}% ({currentProgress.completedRecords} / {currentProgress.totalRecordsToGenerate})</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-150 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>{currentProgress.currentStepText}</span>
              </p>
            </div>

            {/* Real-time Validation Step Checks */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Doctors Registry ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Patients Directory ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Inventory In-Stock ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI Reasoned Match ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zod Server Validation ✓</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Stock Deduction ✓</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Record {currentProgress.recordIndex} of {currentProgress.totalRecordsForDay} for {currentProgress.currentDate}. If cancelled, already generated records are safely preserved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
