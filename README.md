## Setup
### Backend
```bash
cd server
npm install
```
Create `.env` with `GEMINI_API_KEY=your_key`
```bash
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## How it works
1. Upload 1 or 2 MSEDCL electricity bill images
2. Gemini AI reads and extracts data from each bill
3. Review and edit extracted data
4. Download filled Excel with solar recommendations

## Tech Stack
- React + Vite (frontend)
- Node.js + Express (backend)
- Google Gemini 2.0 Flash API (AI extraction)
- SheetJS (Excel generation)
