import { Doctor, Patient, InventoryItem, InventoryTransaction, GeneratedRecord, GenerationSettings } from "../types";
import { INITIAL_DOCTORS } from "../data/doctors";
import { INITIAL_PATIENTS } from "../data/patients";
import { INITIAL_INVENTORY } from "../data/inventory";

const KEYS = {
  DOCTORS: "medsim_doctors_v1",
  PATIENTS: "medsim_patients_v1",
  INVENTORY: "medsim_inventory_v2",
  TRANSACTIONS: "medsim_transactions_v2",
  RECORDS: "medsim_records_v2",
  SETTINGS: "medsim_settings_v1",
  AUTH: "medsim_auth_v1"
};

const isClient = typeof window !== "undefined";

// --- DOCTORS ---
export function getDoctors(): Doctor[] {
  if (!isClient) return INITIAL_DOCTORS;
  const data = localStorage.getItem(KEYS.DOCTORS);
  if (!data) {
    localStorage.setItem(KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    return INITIAL_DOCTORS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_DOCTORS;
  }
}

export function saveDoctors(doctors: Doctor[]): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.DOCTORS, JSON.stringify(doctors));
}

// --- PATIENTS ---
export function getPatients(): Patient[] {
  if (!isClient) return INITIAL_PATIENTS;
  const data = localStorage.getItem(KEYS.PATIENTS);
  if (!data) {
    localStorage.setItem(KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    return INITIAL_PATIENTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PATIENTS;
  }
}

export function savePatients(patients: Patient[]): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
}

// --- INVENTORY ---
export function getInventory(): InventoryItem[] {
  if (!isClient) return INITIAL_INVENTORY;
  const data = localStorage.getItem(KEYS.INVENTORY);
  if (!data) {
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    return INITIAL_INVENTORY;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_INVENTORY;
  }
}

export function saveInventory(items: InventoryItem[]): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(items));
}

export function addInventoryItem(item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">): InventoryItem {
  const inventory = getInventory();
  const idVal = `INV-${String(inventory.length + 1).padStart(4, "0")}`;
  const newItem: InventoryItem = {
    id: idVal,
    itemCode: item.itemCode || idVal,
    itemName: item.itemName,
    manufacturer: item.manufacturer || "Generic",
    category: item.category || "drug",
    unit: item.unit || "",
    dosageType: item.dosageType || "tablet",
    hsnCode: item.hsnCode || "3004",
    mrp: item.mrp ?? 50.0,
    batchNumber: item.batchNumber || `BATCH-${Math.floor(Math.random() * 899 + 100)}`,
    expiryDate: item.expiryDate || "12/2028",
    initialQty: item.initialQty,
    currentQty: item.currentQty,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  inventory.push(newItem);
  saveInventory(inventory);
  return newItem;
}

export function updateInventoryItem(id: string, updates: Partial<InventoryItem>): InventoryItem | null {
  const inventory = getInventory();
  const index = inventory.findIndex(item => item.id === id);
  if (index === -1) return null;

  const current = inventory[index];
  const updatedItem: InventoryItem = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  // Ensure currentQty never negative
  if (updatedItem.currentQty < 0) updatedItem.currentQty = 0;

  inventory[index] = updatedItem;
  saveInventory(inventory);
  return updatedItem;
}

export function deleteInventoryItem(id: string): boolean {
  const inventory = getInventory();
  const filtered = inventory.filter(item => item.id !== id);
  if (filtered.length === inventory.length) return false;
  saveInventory(filtered);
  return true;
}

export function restockInventoryItem(id: string, qtyToAdd: number): { item: InventoryItem; transaction: InventoryTransaction } | null {
  const inventory = getInventory();
  const item = inventory.find(i => i.id === id);
  if (!item || qtyToAdd <= 0) return null;

  const quantityBefore = item.currentQty;
  const quantityAfter = quantityBefore + qtyToAdd;
  item.currentQty = quantityAfter;
  item.updatedAt = new Date().toISOString();

  saveInventory(inventory);

  const transaction: InventoryTransaction = {
    id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    itemId: item.id,
    recordId: "MANUAL-RESTOCK",
    type: "RESTOCK",
    quantity: qtyToAdd,
    quantityBefore,
    quantityAfter,
    timestamp: new Date().toISOString()
  };
  saveTransaction(transaction);

  return { item, transaction };
}

// --- TRANSACTIONS ---
export function getTransactions(): InventoryTransaction[] {
  if (!isClient) return [];
  const data = localStorage.getItem(KEYS.TRANSACTIONS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveTransaction(txn: InventoryTransaction): void {
  const txns = getTransactions();
  txns.unshift(txn);
  if (isClient) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txns));
  }
}

export function saveTransactionsBatch(newTxns: InventoryTransaction[]): void {
  const txns = getTransactions();
  const updated = [...newTxns.reverse(), ...txns];
  if (isClient) {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
  }
}

export function getTransactionsByRecordId(recordId: string): InventoryTransaction[] {
  return getTransactions().filter(t => t.recordId === recordId);
}

// --- RECORDS ---
export function getRecords(): GeneratedRecord[] {
  if (!isClient) return [];
  const data = localStorage.getItem(KEYS.RECORDS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function getRecordById(id: string): GeneratedRecord | null {
  const records = getRecords();
  return records.find(r => r.id === id || r.billNumber === id) || null;
}

export function saveRecord(record: GeneratedRecord): void {
  const records = getRecords();
  records.unshift(record);
  if (isClient) {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  }
}

export function saveRecordsBatch(newRecords: GeneratedRecord[]): void {
  const records = getRecords();
  const updated = [...newRecords, ...records];
  if (isClient) {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updated));
  }
}

export function cancelRecord(recordId: string): { record: GeneratedRecord; reversedTransactions: InventoryTransaction[] } | null {
  const records = getRecords();
  const record = records.find(r => r.id === recordId);
  if (!record || record.status === "CANCELLED") return null;

  record.status = "CANCELLED";
  saveRecordsBatch([]); // write back

  const inventory = getInventory();
  const reversedTransactions: InventoryTransaction[] = [];

  for (const med of record.medicines) {
    const item = inventory.find(i => i.id === med.itemId || i.itemName.toLowerCase() === med.itemName.toLowerCase());
    if (item) {
      const quantityBefore = item.currentQty;
      const quantityAfter = quantityBefore + med.quantity;
      item.currentQty = quantityAfter;
      item.updatedAt = new Date().toISOString();

      const txn: InventoryTransaction = {
        id: `TXN-CNCL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        itemId: item.id,
        recordId: record.id,
        type: "RESTOCK",
        quantity: med.quantity,
        quantityBefore,
        quantityAfter,
        timestamp: new Date().toISOString()
      };
      reversedTransactions.push(txn);
      saveTransaction(txn);
    }
  }

  saveInventory(inventory);
  // save updated record status
  if (isClient) {
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
  }

  return { record, reversedTransactions };
}

// --- SETTINGS ---
export const DEFAULT_SETTINGS: GenerationSettings = {
  startDate: "2026-05-01",
  endDate: "2026-09-09",
  minRecordsPerDay: 3,
  maxRecordsPerDay: 4,
  minMedicinesPerRecord: 1,
  maxMedicinesPerRecord: 4,
  selectedModel: "gemini-2.5-flash"
};

export function getSettings(): GenerationSettings {
  if (!isClient) return DEFAULT_SETTINGS;
  const data = localStorage.getItem(KEYS.SETTINGS);
  if (!data) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GenerationSettings): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// --- RESET ALL DATA ---
export function resetAllData(): void {
  if (!isClient) return;
  localStorage.setItem(KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
  localStorage.setItem(KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
  localStorage.setItem(KEYS.RECORDS, JSON.stringify([]));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
}
