export type Doctor = {
  id: string;
  doctorName: string;
  specializationQualification: string;
  clinicHospital: string;
  areaLocality: string;
};

export type Patient = {
  patientId: string;
  patientName: string;
  gender: "Male" | "Female";
};

export type InventoryItem = {
  id: string;
  itemCode?: string;
  itemName: string;
  manufacturer?: string;
  category?: string;
  unit?: string;
  dosageType?: string;
  hsnCode?: string;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
  initialQty: number;
  currentQty: number;
  createdAt: string;
  updatedAt: string;
};

export type InventoryTransaction = {
  id: string;
  itemId: string;
  recordId: string;
  type: "OUT" | "RESTOCK";
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  timestamp: string;
};

export type PrescriptionMedicine = {
  itemId: string;
  itemCode: string;
  itemName: string;
  manufacturer?: string;
  batchNumber: string;
  expiryDate: string;
  mrp: number;
  quantity: number;
  frequency: string;
  duration: string;
};

export type GeneratedRecord = {
  id: string;
  billNumber: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  medicines: PrescriptionMedicine[];
  status: "GENERATED" | "CONFIRMED" | "CANCELLED";
  learningCompleted?: boolean;
  createdAt: string;
};

export type GenerationSettings = {
  startDate: string;
  endDate: string;
  minRecordsPerDay: number;
  maxRecordsPerDay: number;
  minMedicinesPerRecord: number;
  maxMedicinesPerRecord: number;
  selectedModel: string;
};

export type UserSession = {
  employeeId: string;
  role: string;
  isLoggedIn: boolean;
  name: string;
};
