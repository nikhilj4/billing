"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecordById, getTransactionsByRecordId, cancelRecord, toggleRecordLearningCompleted } from "@/lib/storage";
import { GeneratedRecord, InventoryTransaction } from "@/lib/types";
import { SyntheticRecordTemplate } from "@/components/SyntheticRecordTemplate";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft,
  Printer,
  Ban,
  TrendingDown,
  History,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck
} from "lucide-react";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [record, setRecord] = useState<GeneratedRecord | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const loadRecord = () => {
    const rec = getRecordById(resolvedParams.id);
    if (rec) {
      setRecord(rec);
      setTransactions(getTransactionsByRecordId(rec.id));
    }
  };

  useEffect(() => {
    loadRecord();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (searchParams.get("print") === "true" && record) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }, [record, searchParams]);

  if (!record) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          No synthetic prescription record exists with ID "{resolvedParams.id}".
        </p>
        <Link
          href="/records"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCancelRecord = () => {
    const result = cancelRecord(record.id);
    if (result) {
      showToast(
        "info",
        "Record Cancelled",
        `Stock restocked for ${result.reversedTransactions.length} items.`
      );
      loadRecord();
      setIsCancelModalOpen(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/records"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Synthetic Record {record.billNumber}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                record.status === "CONFIRMED"
                  ? "bg-emerald-100 text-emerald-800"
                  : record.status === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
                {record.status}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Created on {record.createdAt.split("T")[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!record.learningCompleted}
              onChange={() => {
                const isCompleted = toggleRecordLearningCompleted(record.id);
                showToast(
                  isCompleted ? "success" : "info",
                  isCompleted ? "Learning Completed" : "Marked Uncompleted",
                  `Bill ${record.billNumber} learning progress updated.`
                );
                loadRecord();
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
            <span>{record.learningCompleted ? "✓ Learning Completed" : "Mark Learning Completed"}</span>
          </label>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>

          {record.status !== "CANCELLED" && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors"
            >
              <Ban className="w-4 h-4" />
              <span>Cancel Record</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Record Printable Document */}
      <SyntheticRecordTemplate record={record} />

      {/* Inventory Impact Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs print:hidden space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Inventory Impact Summary</h3>
        </div>

        <p className="text-xs text-slate-500">
          Stock deduction calculated deterministically for this record.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {record.medicines.map((med, idx) => {
            const relatedTxn = transactions.find((t) => t.itemId === med.itemId && t.type === "OUT");
            const before = relatedTxn ? relatedTxn.quantityBefore : "—";
            const after = relatedTxn ? relatedTxn.quantityAfter : "—";

            return (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{med.itemName}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Used: {med.quantity}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 text-xs font-mono">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[9px] text-slate-400 font-sans block uppercase">Before</span>
                    <span className="font-bold text-slate-700">{before}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded border border-amber-200">
                    <span className="text-[9px] text-amber-700 font-sans block uppercase">Deducted</span>
                    <span className="font-bold text-amber-800">-{med.quantity}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                    <span className="text-[9px] text-emerald-700 font-sans block uppercase">After</span>
                    <span className="font-bold text-emerald-800">{after}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Audit Trail */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs print:hidden space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <History className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900">Inventory Transaction Audit Trail</h3>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500">No transaction logs recorded for this record.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Txn ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Item ID</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4 text-center">Before → After</th>
                  <th className="py-2.5 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-700">{t.id}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.type === "OUT"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{t.itemId}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">{t.quantity}</td>
                    <td className="py-2.5 px-4 text-center text-slate-700">
                      {t.quantityBefore} → <strong className="text-blue-700">{t.quantityAfter}</strong>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">{t.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={isCancelModalOpen}
        title="Cancel Record & Reverse Inventory?"
        description={`Cancelling record ${record.billNumber} will RESTOCK all prescribed items back into medicine inventory.`}
        confirmText="Confirm Cancel & Restock"
        isDestructive
        onConfirm={handleCancelRecord}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
}
