import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return NextResponse.json({
      connected: false,
      message: "GEMINI_API_KEY is not set or using placeholder value in .env.local. (Deterministic fallback engine will be used)",
      hasKey: false
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Return the exact word 'READY'"
    });

    if (response.text) {
      return NextResponse.json({
        connected: true,
        message: "Gemini API key is configured and responsive.",
        hasKey: true,
        model: "gemini-2.5-flash"
      });
    }

    return NextResponse.json({
      connected: false,
      message: "Gemini API returned an empty response.",
      hasKey: true
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      message: `Gemini API connection error: ${error.message || "Unknown error"}. (Fallback simulation will be used)`,
      hasKey: true
    });
  }
}
