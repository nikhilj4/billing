import { NextRequest, NextResponse } from "next/server";
import { GenerateSingleRecordRequestSchema } from "@/lib/validation";
import { generateSyntheticPrescriptionWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = GenerateSingleRecordRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Filter available items with > 0 stock
    const inStockItems = data.availableInventory.filter(item => item.currentQty > 0);
    if (inStockItems.length === 0) {
      return NextResponse.json(
        { error: "Insufficient inventory. All available items are out of stock." },
        { status: 400 }
      );
    }

    // Call Gemini (or fallback generator)
    const result = await generateSyntheticPrescriptionWithGemini({
      doctorName: data.doctorName,
      specialization: data.specialization,
      patientName: data.patientName,
      availableInventory: inStockItems,
      minMedicines: data.minMedicines,
      maxMedicines: data.maxMedicines
    });

    // SERVER-SIDE DETERMINISTIC VALIDATION & INVENTORY DEDUCTION CALCULATION
    const validatedMedicines = [];
    const stockDeductions = [];

    for (const med of result.medicines) {
      const invItem = inStockItems.find(
        item => item.itemName.toLowerCase() === med.itemName.toLowerCase()
      );

      if (invItem && invItem.currentQty > 0) {
        // Enforce quantity strictly <= available stock
        const actualQty = Math.min(med.quantity, invItem.currentQty);
        if (actualQty > 0) {
          validatedMedicines.push({
            itemId: invItem.id,
            itemCode: invItem.itemCode || invItem.id,
            itemName: invItem.itemName,
            manufacturer: invItem.manufacturer || "Generic",
            batchNumber: invItem.batchNumber || "BATCH-101",
            expiryDate: invItem.expiryDate || "12/2028",
            mrp: invItem.mrp || 0,
            quantity: actualQty,
            frequency: med.frequency || "1-0-1 after food",
            duration: med.duration || "5 days"
          });

          stockDeductions.push({
            itemId: invItem.id,
            itemName: invItem.itemName,
            quantityBefore: invItem.currentQty,
            quantityDeducted: actualQty,
            quantityAfter: invItem.currentQty - actualQty
          });
        }
      }
    }

    if (validatedMedicines.length === 0) {
      return NextResponse.json(
        { error: "Could not match any AI-generated medicines with available in-stock inventory." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      syntheticDisclaimer: "SYNTHETIC — FOR MEDICAL EDUCATION ONLY — NOT A REAL PRESCRIPTION",
      recordData: {
        date: data.date,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        specialization: data.specialization,
        patientId: data.patientId,
        patientName: data.patientName,
        medicines: validatedMedicines,
        stockDeductions
      }
    });

  } catch (error: any) {
    console.error("API /api/generate Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate synthetic prescription record" },
      { status: 500 }
    );
  }
}
