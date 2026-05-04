import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
dotenv.config()

const PROVIDER = (process.env.LLM_PROVIDER || "gemini").toLowerCase()

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5vl:3b"
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434"

const PROMPT = `
You are an expert at reading Indian MSEDCL (Maharashtra State Electricity Distribution Co. Ltd) electricity bills.
These bills are written in a mix of Marathi and English.

Extract the following fields from the bill and return them as a JSON object.
Use the EXACT keys provided below. If a field is not visible or cannot be determined confidently, return null for that field.

Keys to extract and hints on where to find them:
- "consumer_name": Customer's name. Usually found near the top left, labeled as "ग्राहकचे नाव" (Grahakache Nav) or "Consumer Name".
- "consumer_number": A unique 12-digit number. Usually labeled as "ग्राहक क्रमांक" (Grahak Kramank) or "Consumer No".
- "sanctioned_load_kw": The sanctioned load or connected load, usually in kW. Look for "मंजूर भार" (Manjur Bhar) or "Sanctioned Load". Return just the number as a string (e.g. "3" or "3.30"), do NOT include the unit "KW".
- "connection_type": Tariff category or supply type. Look for "वर्ग/प्रवर्ग" (Tariff Category/Class) or "पुरवठा प्रकार" (Supply Type). Examples: "LT-1", "LT-2", "LT-I(B)", "LT-II".
- "fixed_charges": Fixed charges for the billing cycle. Look for "स्थिर आकार" (Sthir Akar) or "Fixed Charges" in the billing breakdown section. Return just the number as a string.
- "latest_bill_amount": The total payable amount for the current month. Look for "देय रक्कम" (Payable Amount), "Net Bill Amount", or "Current Bill". Return just the number as a string.
- "latest_bill_month": The billing month and year. Look for "बिल महिना" (Bill Month) or "Billing Period". Format: "MMM YYYY" (e.g. "Feb 2025").

Monthly units history (usually found in a bar chart or table on the right/middle side of the bill, labeled "मागील १२ महिन्यांचा तपशील" or similar):
Extract the consumed units for the following specific months if available in the history chart. Return just the number as a string.
- "units_feb2025"
- "units_mar2025"
- "units_apr2025"
- "units_may2025"
- "units_jun2025"
- "units_jul2025"
- "units_aug2025"
- "units_sep2025"
- "units_oct2025"
- "units_nov2025"
- "units_dec2025"
- "units_jan2026"

Important translation rules for months in Marathi:
जानेवारी=January, फेब्रुवारी=February, मार्च=March, एप्रिल=April, मे=May, जून=June, जुलै=July, ऑगस्ट=August, सप्टेंबर=September, ऑक्टोबर=October, नोव्हेंबर=November, डिसेंबर=December.

Return ONLY a single JSON object, no markdown fences, no commentary.
`

export async function extractBillData(base64, mimeType) {
  if (PROVIDER === "ollama") {
    return extractWithOllama(base64, mimeType)
  }
  return extractWithGemini(base64, mimeType)
}

async function extractWithGemini(base64, mimeType) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  })

  const text = result.response.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Failed to parse extracted JSON. Raw text: ${text}`)
  }
}

// Ollama vision path. Uses /api/generate with images[] (raw base64, no data URI).
// PDFs aren't supported by vision models — caller should send images locally.
async function extractWithOllama(base64, mimeType) {
  if (mimeType === "application/pdf") {
    throw new Error(
      "Ollama vision models accept images only. Convert the PDF to PNG/JPEG before uploading, or set LLM_PROVIDER=gemini."
    )
  }

  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: PROMPT,
      images: [base64],
      format: "json",
      stream: false,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Ollama request failed (${res.status}): ${body}`)
  }

  const { response } = await res.json()
  try {
    return JSON.parse(response)
  } catch {
    throw new Error(`Failed to parse extracted JSON. Raw text: ${response}`)
  }
}
