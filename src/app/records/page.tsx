"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getRecords, cancelRecord, toggleRecordLearningCompleted } from "@/lib/storage";
import { GeneratedRecord } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  FileText,
  Search,
  Filter,
  Eye,
  Printer,
  Ban,
  Calendar,
  XCircle,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  FileSpreadsheet
} from "lucide-react";

export default function RecordsPage() {
  const [records, setRecords] = useState<GeneratedRecord[]>([]);
  const { showToast } = useToast();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("ALL");
  const [patientFilter, setPatientFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [medicineFilter, setMedicineFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("OLDEST");

  // Cancel dialog
  const [cancelCandidate, setCancelCandidate] = useState<GeneratedRecord | null>(null);

  const loadData = () => {
    setRecords(getRecords());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter records logic
  const filteredRecords = records
    .filter((rec) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        rec.billNumber.toLowerCase().includes(search) ||
        rec.patientName.toLowerCase().includes(search) ||
        rec.doctorName.toLowerCase().includes(search);

      const matchesDoctor = doctorFilter === "ALL" || rec.doctorId === doctorFilter;
      const matchesPatient = patientFilter === "ALL" || rec.patientId === patientFilter;
      const matchesStatus = statusFilter === "ALL" || rec.status === statusFilter;

      const matchesMedicine =
        !medicineFilter.trim() ||
        rec.medicines.some((m) => m.itemName.toLowerCase().includes(medicineFilter.toLowerCase()));

      return matchesSearch && matchesDoctor && matchesPatient && matchesStatus && matchesMedicine;
    })
    .sort((a, b) => {
      if (sortOrder === "OLDEST") {
        return a.billNumber.localeCompare(b.billNumber, undefined, { numeric: true });
      }
      return b.billNumber.localeCompare(a.billNumber, undefined, { numeric: true });
    });

  // Cancel record handler
  const handleConfirmCancel = () => {
    if (!cancelCandidate) return;

    const result = cancelRecord(cancelCandidate.id);
    if (result) {
      showToast(
        "info",
        "Record Cancelled",
        `Record ${cancelCandidate.billNumber} cancelled. Inventory stock reversed (${result.reversedTransactions.length} items restocked).`
      );
      setCancelCandidate(null);
      loadData();
    }
  };

  // Print single record handler
  const handlePrintRecord = (id: string) => {
    window.open(`/records/${id}?print=true`, "_blank");
  };

  // Export all bills to CSV/Excel handler
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast("info", "No Records", "There are no records to export.");
      return;
    }

    const headers = [
      "Bill Number",
      "Date",
      "Patient ID",
      "Patient Name",
      "Doctor Name",
      "Specialization",
      "Item #",
      "Item Code",
      "Medicine Name",
      "Manufacturer",
      "Batch Number",
      "Expiry Date",
      "MRP (INR)",
      "Quantity",
      "Frequency",
      "Duration",
      "Learning Completed Status",
      "Record Status"
    ];

    const csvRows: string[][] = [headers];

    filteredRecords.forEach((rec) => {
      const learningStatus = rec.learningCompleted ? "COMPLETED [X]" : "PENDING [ ]";
      rec.medicines.forEach((med, idx) => {
        csvRows.push([
          `"${rec.billNumber}"`,
          `"${rec.date}"`,
          `"${rec.patientId}"`,
          `"${rec.patientName}"`,
          `"${rec.doctorName}"`,
          `"${rec.specialization}"`,
          `"${idx + 1}"`,
          `"${med.itemCode || med.itemId}"`,
          `"${med.itemName.replace(/"/g, '""')}"`,
          `"${(med.manufacturer || 'Generic').replace(/"/g, '""')}"`,
          `"${med.batchNumber || 'N/A'}"`,
          `"${med.expiryDate || 'N/A'}"`,
          `"${med.mrp ? med.mrp.toFixed(2) : '0.00'}"`,
          `"${med.quantity}"`,
          `"${med.frequency}"`,
          `"${med.duration}"`,
          `"${learningStatus}"`,
          `"${rec.status}"`
        ]);
      });
    });

    const csvString = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `medsim_all_bills_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "Export Successful", `Exported ${filteredRecords.length} prescription bills to CSV/Excel.`);
  };

  // Unique list of doctors & patients for select filters
  const uniqueDoctors = Array.from(new Set(records.map((r) => r.doctorId))).map((id) => {
    const rec = records.find((r) => r.doctorId === id);
    return { id, name: rec?.doctorName || id };
  });

  const uniquePatients = Array.from(new Set(records.map((r) => r.patientId))).map((id) => {
    const rec = records.find((r) => r.patientId === id);
    return { id, name: rec?.patientName || id };
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Synthetic Records ({filteredRecords.length} / {records.length})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              title="Export all bills to Excel/CSV sheet with Learning Checkbox Status"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export All Bills (Excel/CSV)</span>
            </button>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Bill ID, Patient, Doctor..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Doctor Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Doctor
            </label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white outline-none"
            >
              <option value="ALL">All Doctors ({uniqueDoctors.length})</option>
              {uniqueDoctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Patient Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Patient
            </label>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white outline-none"
            >
              <option value="ALL">All Patients ({uniquePatients.length})</option>
              {uniquePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Sort Order Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sort Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "OLDEST" | "NEWEST")}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white font-medium outline-none"
            >
              <option value="OLDEST">Oldest to Newest (SIM-000001 → SIM-000459)</option>
              <option value="NEWEST">Newest to Oldest (SIM-000459 → SIM-000001)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Record / Bill ID</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Doctor</th>
                <th className="py-3.5 px-6 text-center">Medicines</th>
                <th className="py-3.5 px-6 text-center">Learning Status</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No synthetic records found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className={`hover:bg-slate-50/80 transition-colors ${rec.learningCompleted ? "bg-emerald-50/30" : ""}`}>
                    <td className="py-4 px-6 font-mono font-bold text-blue-700">{rec.billNumber}</td>
                    <td className="py-4 px-6 font-mono text-slate-700">{rec.date}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{rec.patientName}</td>
                    <td className="py-4 px-6 text-slate-700">
                      <div>{rec.doctorName}</div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">{rec.specialization}</span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-slate-800">
                      {rec.medicines.length}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!rec.learningCompleted}
                          onChange={() => {
                            const isNowCompleted = toggleRecordLearningCompleted(rec.id);
                            showToast(
                              isNowCompleted ? "success" : "info",
                              isNowCompleted ? "Learning Completed" : "Marked Uncompleted",
                              `Bill ${rec.billNumber} learning progress updated.`
                            );
                            loadData();
                          }}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                        <span className={`text-[11px] font-bold ${rec.learningCompleted ? "text-emerald-700" : "text-slate-500"}`}>
                          {rec.learningCompleted ? "Completed" : "Pending"}
                        </span>
                      </label>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-semibold ${
                          rec.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : rec.status === "CANCELLED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        href={`/records/${rec.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>

                      <button
                        onClick={() => handlePrintRecord(rec.id)}
                        className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
                        title="Print record"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {rec.status !== "CANCELLED" && (
                        <button
                          onClick={() => setCancelCandidate(rec)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Cancel record & restock inventory"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={!!cancelCandidate}
        title="Cancel Record & Reverse Inventory?"
        description={`Are you sure you want to cancel record ${cancelCandidate?.billNumber}? This will automatically RESTOCK all ${cancelCandidate?.medicines.length} prescribed items back into medicine inventory.`}
        confirmText="Cancel Record & Restock"
        isDestructive
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelCandidate(null)}
      />
    </div>
  );
}
