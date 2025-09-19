import express from 'express';
const router = express.Router();
import { getDashboardDataAsJson, downloadDashboardPdf } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getDashboardDataAsJson);
router.route('/download').get(protect, downloadDashboardPdf);

export default router;