import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function extractBillData(base64, mimeType) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const prompt = `
You are an expert at reading Indian MSEDCL Maharashtra electricity bills 
written in Marathi and English mixed language.

Extract ALL fields below and return ONLY a valid JSON object.
No explanation, no markdown, no backticks, just raw JSON.

{
  "consumer_name": "",
  "consumer_number": "",
  "sanctioned_load_kw": "",
  "connection_type": "",
  "fixed_charges": "",
  "latest_bill_amount": "",
  "latest_bill_month": "",
  "units_feb2025": "",
  "units_mar2025": "",
  "units_apr2025": "",
  "units_may2025": "",
  "units_jun2025": "",
  "units_jul2025": "",
  "units_aug2025": "",
  "units_sep2025": "",
  "units_oct2025": "",
  "units_nov2025": "",
  "units_dec2025": "",
  "units_jan2026": ""
}

Important rules:
- Bill is in Marathi. Month name translations:
  जानेवारी=January, फेब्रुवारी=February, मार्च=March,
  एप्रिल=April, मे=May, जून=June, जुलै=July,
  ऑगस्ट=August, सप्टेंबर=September, ऑक्टोबर=October,
  नोव्हेंबर=November, डिसेंबर=December
- Monthly units are shown in the bar chart on the right side of the bill
- Return numbers as strings, no units (e.g. "3.30" not "3.30 KW")
- If a field is not visible, return null
- Do NOT wrap response in markdown or code blocks
`

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64,
        mimeType: mimeType
      }
    },
    { text: prompt }
  ])

  const text = result.response.text()
  
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (fallbackError) {
        throw new Error(`Failed to parse extracted JSON even with regex fallback. Raw text: ${text}`)
      }
    }
    throw new Error(`Failed to parse extracted JSON. Raw text: ${text}`)
  }
}
