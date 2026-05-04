import express from 'express';
import multer from 'multer';
import { extractBillData } from '../utils/extractBill.js';
import { buildExcel } from '../utils/generateExcel.js';
import { validateConsumer } from '../utils/validateBill.js';
import { log } from '../utils/logger.js';

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
    const { warnings } = validateConsumer(extractedJSON);
    res.json({ success: true, data: extractedJSON, warnings });
  } catch (error) {
    log.error('extract.failed', { message: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-excel', async (req, res) => {
  try {
    const { consumer1 } = req.body;
    if (!consumer1) {
      return res.status(400).json({ success: false, error: 'Missing consumer1 in request body' });
    }

    const { ok, errors } = validateConsumer(consumer1);
    if (!ok) {
      return res.status(400).json({ success: false, error: errors.join(' '), errors });
    }

    const buffer = await buildExcel(consumer1);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="EnergyBae_Solar_Report.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (error) {
    log.error('excel.failed', { message: error.message, code: error.code });
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        success: false,
        error: 'Solar template missing. Place the Energybae template at server/templates/solar_load_template.xlsx',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
