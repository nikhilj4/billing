import { z } from "zod";

export const DoctorSchema = z.object({
  id: z.string(),
  doctorName: z.string().min(1, "Doctor name required"),
  specializationQualification: z.string().min(1, "Specialization required"),
  clinicHospital: z.string().min(1, "Clinic/Hospital required"),
  areaLocality: z.string().min(1, "Area required")
});

export const PatientSchema = z.object({
  patientId: z.string(),
  patientName: z.string().min(1, "Patient name required"),
  gender: z.enum(["Male", "Female"])
});

export const InventoryItemSchema = z.object({
  id: z.string(),
  itemName: z.string().min(1, "Item name required"),
  initialQty: z.number().int().min(0),
  currentQty: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const PrescriptionMedicineSchema = z.object({
  itemName: z.string().min(1, "Medicine name required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  frequency: z.string().min(1, "Frequency required"),
  duration: z.string().min(1, "Duration required")
});

export const GeminiResponseSchema = z.object({
  medicines: z.array(PrescriptionMedicineSchema).min(1, "At least one medicine required")
});

export const GenerateSingleRecordRequestSchema = z.object({
  doctorId: z.string(),
  doctorName: z.string(),
  specialization: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  date: z.string(),
  availableInventory: z.array(z.object({
    id: z.string(),
    itemCode: z.string().optional(),
    itemName: z.string(),
    manufacturer: z.string().optional(),
    mrp: z.number().optional(),
    batchNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    currentQty: z.number()
  })).min(1, "At least one inventory item required"),
  minMedicines: z.number().int().min(1).default(1),
  maxMedicines: z.number().int().max(4).default(4)
});

export type GeminiResponse = z.infer<typeof GeminiResponseSchema>;
export type GenerateSingleRecordRequest = z.infer<typeof GenerateSingleRecordRequestSchema>;
