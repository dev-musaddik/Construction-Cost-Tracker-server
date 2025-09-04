import express from 'express';
const router = express.Router();
import { scheduleDailyReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/schedule').post(protect, scheduleDailyReport);

export default router;