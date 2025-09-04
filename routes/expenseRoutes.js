import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import { validate, createExpenseSchema, updateExpenseSchema } from '../middleware/validationMiddleware.js';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCsv,
  exportExpensesPdf,
  exportExpensesExcel,
  getExpensesByDate, // NEW
} from '../controllers/expenseController.js';

// --- Exports (placed before dynamic :id for clarity) ---
router.get('/export/csv', protect, exportExpensesCsv);
router.get('/export/pdf', protect, exportExpensesPdf);
router.get('/export/excel', protect, exportExpensesExcel);

// --- NEW: filter by a single day or date range ---
// GET /api/expenses/by-date?date=YYYY-MM-DD
// GET /api/expenses/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/by-date', protect, getExpensesByDate);

// --- Collection routes ---
router
  .route('/')
  .get(protect, getExpenses)
  .post(protect, validate(createExpenseSchema), createExpense);

// --- Item routes ---
router
  .route('/:id')
  .get(protect, getExpenseById)
  .put(protect, validate(updateExpenseSchema), updateExpense)
  .delete(protect, deleteExpense);

export default router;
