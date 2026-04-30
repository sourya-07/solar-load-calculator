import express from 'express';
import multer from 'multer';
import { extractBillData } from '../utils/extractBill.js';
import { buildExcel } from '../utils/generateExcel.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/extract', upload.single('bill'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    const extractedJSON = await extractBillData(base64, mimeType);
    res.json({ success: true, data: extractedJSON });
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-excel', async (req, res) => {
  try {
    const { consumer1, consumer2 } = req.body;
    const buffer = buildExcel(consumer1, consumer2);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="EnergyBae_Solar_Report.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Excel generation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
