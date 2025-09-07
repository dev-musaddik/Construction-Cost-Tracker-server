import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import { validate, createExpenseSchema, updateExpenseSchema } from '../middleware/validationMiddleware.js';
import {
  getExpenses,
  getContractExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCsv,
  exportExpensesPdf,
  exportExpensesExcel,
  getExpensesByDate,
} from '../controllers/expenseController.js';

// --- Exports ---
router.get('/export/csv', protect, exportExpensesCsv);
router.get('/export/pdf', protect, exportExpensesPdf);
router.get('/export/excel', protect, exportExpensesExcel);

// --- Filter by date ---
router.get('/by-date', protect, getExpensesByDate);

// --- Collection routes ---
router.get('/', protect, getExpenses);
router.get('/contract', protect, getContractExpenses);
router.post('/', protect, validate(createExpenseSchema), createExpense);

// --- Item routes ---
router
  .route('/:id')
  .get(protect, getExpenseById)
  .put(protect, validate(updateExpenseSchema), updateExpense)
  .delete(protect, deleteExpense);

export default router;
