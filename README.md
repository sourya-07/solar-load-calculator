# EnergyBae Solar Load Calculator

Upload an MSEDCL electricity bill (PDF or image) → Gemini extracts the consumer data → the official Energybae Excel template is filled (formulas preserved) → user downloads the report.

## Quick start

From the repo root:

```bash
npm install        # installs root, server, and client deps
npm run dev        # starts server (5001) and client (5173) together
```

Open http://localhost:5173

### Other scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run server + client concurrently |
| `npm run build` | Build client (`client/dist/`) |
| `npm test` | Run server unit tests (Vitest) |
| `npm run vercel-build` | Used by Vercel during deployment |

### Environment variables

Create `server/.env`:

```
# gemini (prod) | ollama (local)
LLM_PROVIDER=ollama

GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-pro

OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=moondream

PORT=5001
```

`LLM_PROVIDER` defaults to `gemini` when unset, so Vercel deploys keep using Gemini without any extra config.

Client picks up `client/.env` if present:

```
VITE_BACKEND_URL=http://localhost:5001/api
```

### Local LLM (Ollama)

For offline / no-cost local development, the same `extractBillData()` function can be served by [Ollama](https://ollama.com) instead of Gemini. On an 8 GB Apple Silicon Mac the only vision model that loads reliably is `moondream` (1.8B params, ~1.7 GB on disk, fits in ~2.5 GB RAM). OCR is weaker than Gemini on dense Marathi/English bills — fall back to `LLM_PROVIDER=gemini` for anything moondream can't extract cleanly.

```bash
brew install ollama
ollama serve &              # starts the local API on :11434
ollama pull moondream       # ~1.7 GB download
```

Then set `LLM_PROVIDER=ollama` in `server/.env` and run `npm run dev` as usual. Note: Ollama vision models accept images only, not PDFs — convert PDFs to PNG/JPEG before upload, or use Gemini for PDF bills.

### Solar template

Place the Energybae XLSX template at `server/templates/solar_load_template.xlsx`. The fill logic is label-driven — it finds input cells by matching the labels in column A (e.g. "Consumer Name:", "Sanctioned Load (kW):") and writes only into non-formula cells, so any formulas in the template are preserved.

## Deploy to Vercel

The repo ships with a `vercel.json` that builds the client as static assets and the server as a serverless function. Set up:

```bash
vercel link    # one-time, links the local repo to a Vercel project
vercel --prod  # deploy
```

Or push to GitHub and import the repo via the Vercel dashboard.

**Required env var on Vercel** (Project → Settings → Environment Variables):

- `GEMINI_API_KEY` — your Google Generative AI key

The serverless function bundles `server/templates/**` (configured via `vercel.json` `includeFiles`) so the template ships with the deployed function.

## How it works

1. **Upload** — React drop zone POSTs the bill to `/api/extract`.
2. **Extract** — `server/utils/extractBill.js` runs a Marathi/English-aware prompt with strict JSON output. `LLM_PROVIDER` selects the backend: `gemini` (default — Gemini 2.5 Pro) for prod, or `ollama` (qwen2.5vl:3b) for local. Same prompt, same JSON contract on both paths.
3. **Validate** — `server/utils/validateBill.js` returns `errors` (hard fails: missing consumer no., negative units, all-zero history) and `warnings` (≥3 missing months, outliers, sanctioned-load cap).
4. **Review** — User sees the extracted data in an editable table with a yellow warning banner for any flagged fields.
5. **Generate** — `server/utils/generateExcel.js` opens the template via `exceljs`, writes only into non-formula cells (label-matched), and streams the buffer back. The Excel file's own formulas compute the recommended capacity / load ratio.

## Tech stack

- React 18 + Vite + Tailwind (client)
- Node.js + Express (server, ES modules)
- Google Gemini 2.5 Pro (`@google/generative-ai`)
- ExcelJS (template-preserving XLSX read/write)
- Vitest (unit tests)
