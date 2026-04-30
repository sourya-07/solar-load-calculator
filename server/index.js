import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import billRoutes from './routes/bills.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', billRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
