import express from 'express';
const router = express.Router();
import { getDashboardData } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getDashboardData);

export default router;