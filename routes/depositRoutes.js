// IMPORTANT: Fix 500 "Cast to ObjectId failed for value 'by-date'" by
// registering the /by-date route BEFORE the param route '/:id'.
// Express matches in order; otherwise '/by-date' is captured as ':id',
// then your controller does findById('by-date') and Mongoose throws.

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  addDeposit,
  getDeposits,
  getDepositById,
  updateDeposit,
  deleteDeposit,
  getDepositsByDate,
} from '../controllers/depositController.js';

const router = express.Router();

// 1) Static/specific routes FIRST
router.get('/by-date', protect, getDepositsByDate);

// 2) Collection
router.route('/')
  .post(protect, addDeposit)
  .get(protect, getDeposits);

// 3) Param route LAST
router.route('/:id')
  .get(protect, getDepositById)
  .put(protect, updateDeposit)
  .delete(protect, deleteDeposit);

export default router;
