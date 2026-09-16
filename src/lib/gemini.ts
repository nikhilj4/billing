import { GoogleGenAI } from "@google/genai";
import { GeminiResponseSchema, GeminiResponse } from "./validation";

export async function generateSyntheticPrescriptionWithGemini(params: {
  doctorName: string;
  specialization: string;
  patientName: string;
  availableInventory: { id: string; itemName: string; currentQty: number }[];
  minMedicines: number;
  maxMedicines: number;
}): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  const validItems = params.availableInventory.filter(item => item.currentQty > 0);
  if (validItems.length === 0) {
    throw new Error("No medicines with available stock in inventory.");
  }

  const inventoryNamesList = validItems.map(i => `"${i.itemName}" (In Stock: ${i.currentQty})`).join(", ");

  const systemInstruction = `You are an educational medical simulation assistant for MedSim AI.
Your task is to generate a SYNTHETIC training prescription record for medical students.
This record is NOT a real prescription.

RULES:
1. Select between ${params.minMedicines} and ${params.maxMedicines} medicine items ONLY from the supplied inventory list below.
2. DO NOT invent medicine names or strengths not listed in the inventory.
3. DO NOT request quantity higher than the listed available stock. Maximum single prescription quantity for any item is 30 units (or available stock if less).
4. Return ONLY valid JSON adhering strictly to the requested schema.
5. Do not include signatures, seals, registration numbers, or real patient diagnoses.
6. The output is strictly synthetic for education.`;

  const userPrompt = `Patient Name: ${params.patientName}
Doctor Name: ${params.doctorName}
Doctor Specialization: ${params.specialization}

Available Inventory:
[ ${inventoryNamesList} ]

Respond ONLY with a JSON object in this format:
{
  "medicines": [
    {
      "itemName": "EXACT_ITEM_NAME_FROM_INVENTORY",
      "quantity": 10,
      "frequency": "1-0-1 after food",
      "duration": "5 days"
    }
  ]
}`;

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models;
      const response = await model.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (text) {
        const parsedJson = JSON.parse(text);
        const validated = GeminiResponseSchema.safeParse(parsedJson);
        if (validated.success) {
          // Filter to strictly matching inventory items
          const cleanedMeds = validated.data.medicines.filter(m => 
            validItems.some(inv => inv.itemName.toLowerCase() === m.itemName.toLowerCase())
          );

          if (cleanedMeds.length > 0) {
            return { medicines: cleanedMeds };
          }
        }
      }
    } catch (error) {
      console.warn("Gemini API call failed or rate limited, falling back to deterministic educational generator:", error);
    }
  }

  // --- DETERMINISTIC EDUCATIONAL FALLBACK GENERATOR ---
  // If API key is missing or API fails, select 1 to maxMedicines from available inventory deterministically
  return generateDeterministicPrescription(params);
}

export function generateDeterministicPrescription(params: {
  doctorName: string;
  specialization: string;
  patientName: string;
  availableInventory: { id: string; itemName: string; currentQty: number }[];
  minMedicines: number;
  maxMedicines: number;
}): GeminiResponse {
  const validItems = params.availableInventory.filter(item => item.currentQty > 0);
  if (validItems.length === 0) {
    throw new Error("No medicines available in stock.");
  }

  // Frequency options
  const frequencies = [
    "1-0-1 after food",
    "1-0-0 before food",
    "0-0-1 at bedtime",
    "1-1-1 after food",
    "Once daily as needed"
  ];

  // Duration options
  const durations = ["3 days", "5 days", "7 days", "10 days", "14 days"];

  // Shuffle items deterministically using doctor + patient + time seed
  const count = Math.min(
    validItems.length,
    Math.floor(Math.random() * (params.maxMedicines - params.minMedicines + 1)) + params.minMedicines
  );

  const shuffled = [...validItems].sort(() => 0.5 - Math.random());
  const selectedItems = shuffled.slice(0, count);

  const medicines = selectedItems.map(item => {
    // Quantity between 5 and 30, capped by available stock
    const rawQty = Math.floor(Math.random() * 25) + 5;
    const quantity = Math.min(rawQty, item.currentQty);
    const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
    const duration = durations[Math.floor(Math.random() * durations.length)];

    return {
      itemName: item.itemName,
      quantity,
      frequency,
      duration
    };
  });

  return { medicines };
}
