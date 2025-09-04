// controllers/expenseController.js
import asyncHandler from 'express-async-handler';
import Expense from '../models/Expense.js';
import Category from '../models/Category.js'; // <- needed to accept category code

// Helpers -------------------------------------------------------------
const isYMD = /^\d{4}-\d{2}-\d{2}$/;
const isObjectId = /^[0-9a-fA-F]{24}$/;
const startOfUtcDay = (ymd) => new Date(`${ymd}T00:00:00.000Z`);
const endOfUtcDay = (ymd) => new Date(`${ymd}T23:59:59.999Z`);

// @desc    Fetch all expenses (with keyword/category/date-range/pagination)
// @route   GET /api/expenses
// @access  Private
export const getExpenses = asyncHandler(async (req, res) => {
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 200);
  const page = Math.max(Number(req.query.pageNumber) || 1, 1);

  // Keyword on description (case-insensitive)
  const keyword = req.query.keyword
    ? { description: { $regex: req.query.keyword, $options: 'i' } }
    : {};

  // Category: accept ObjectId or 5-char code (case-sensitive by default)
  let categoryFilter = {};
  if (req.query.category) {
    const cat = String(req.query.category);
    if (isObjectId.test(cat)) {
      categoryFilter = { category: cat };
    } else {
      const catDoc = await Category.findOne({ code: cat }).select('_id');
      if (!catDoc) {
        return res.status(400).json({ message: 'Unknown category' });
      }
      categoryFilter = { category: catDoc._id };
    }
  }

  // Date range on the transaction `date` field (if provided on docs)
  const hasStart = !!req.query.startDate;
  const hasEnd = !!req.query.endDate;
  const date = {};
  if (hasStart) {
    const s = String(req.query.startDate);
    date.$gte = isYMD.test(s) ? startOfUtcDay(s) : new Date(s);
  }
  if (hasEnd) {
    const e = String(req.query.endDate);
    date.$lte = isYMD.test(e) ? endOfUtcDay(e) : new Date(e);
  }
  // If both exist and are inverted, swap for safety
  if (date.$gte && date.$lte && date.$gte > date.$lte) {
    const tmp = date.$gte; date.$gte = date.$lte; date.$lte = tmp;
  }
  const dateFilter = hasStart || hasEnd ? { date } : {};

  // Sort
  const allowedSort = new Set(['createdAt', 'amount', 'date']);
  const sortBy = allowedSort.has(req.query.sortBy) ? req.query.sortBy : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder, createdAt: -1 }; // tie-breaker

  const baseQuery = { user: req.user._id, ...keyword, ...categoryFilter, ...dateFilter };

  const count = await Expense.countDocuments(baseQuery);
  const expenses = await Expense.find(baseQuery)
    .populate('category', 'name code')
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    expenses,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    pageSize,
  });
});

// @desc    Fetch single expense (owner-only)
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('category', 'name code');
  if (expense && expense.user.toString() === req.user._id.toString()) {
    return res.json(expense);
  }
  res.status(404);
  throw new Error('Expense not found');
});

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = asyncHandler(async (req, res) => {
  const { description, amount, category, date } = req.body;

  const expense = new Expense({
    user: req.user._id,
    description,
    amount,
    category,
    ...(date ? { date } : {}),
  });

  const createdExpense = await expense.save();
  res.status(201).json(createdExpense);
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = asyncHandler(async (req, res) => {
  const { description, amount, category, date } = req.body;
  const expense = await Expense.findById(req.params.id);

  if (!expense || expense.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Expense not found');
  }

  if (description !== undefined) expense.description = description;
  if (amount !== undefined) expense.amount = amount;
  if (category !== undefined) expense.category = category;
  if (date !== undefined) expense.date = date;

  const updatedExpense = await expense.save();
  res.json(updatedExpense);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense || expense.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Expense not found');
  }
  await expense.deleteOne();
  res.json({ message: 'Expense removed' });
});

// @desc    Export expenses as CSV (uses transaction `date` if present)
// @route   GET /api/expenses/export/csv
// @access  Private
export const exportExpensesCsv = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ user: req.user._id }).populate('category', 'name');
  let csv = 'Description,Amount,Category,Date\n';
  for (const expense of expenses) {
    const categoryName = expense.category ? expense.category.name : 'N/A';
    const when = expense.date ? new Date(expense.date) : new Date(expense.createdAt);
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    csv += `${esc(expense.description)},${expense.amount},${esc(categoryName)},${when.toISOString().slice(0,10)}\n`;
  }
  res.header('Content-Type', 'text/csv');
  res.attachment('expenses.csv');
  res.send(csv);
});

export const exportExpensesPdf = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'PDF export not yet implemented' });
});

export const exportExpensesExcel = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'Excel export not yet implemented' });
});

// ------------------------------------------------------------------
// NEW: Get expenses by date/date range
// ------------------------------------------------------------------
// @route   GET /api/expenses/by-date?date=YYYY-MM-DD
// @route   GET /api/expenses/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private
export const getExpensesByDate = asyncHandler(async (req, res) => {
  const { date, from, to } = req.query;

  if (!date && !from && !to) {
    return res.status(400).json({
      message: 'Provide ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD',
    });
  }

  let startDate, endDate;
  if (date) {
    if (!isYMD.test(date)) return res.status(400).json({ message: 'Invalid date format' });
    startDate = startOfUtcDay(date);
    endDate = endOfUtcDay(date);
  } else {
    if (from && !isYMD.test(from)) return res.status(400).json({ message: 'Invalid from date' });
    if (to && !isYMD.test(to)) return res.status(400).json({ message: 'Invalid to date' });
    startDate = from ? startOfUtcDay(from) : new Date(0);
    endDate = to ? endOfUtcDay(to) : new Date(8640000000000000);
  }

  if (startDate > endDate) [startDate, endDate] = [endDate, startDate];

  const expenses = await Expense.find({
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  })
    .populate('category', 'name code')
    .sort({ date: 1 });

  return res.json({
    expenses,
    range: { from: startDate.toISOString(), to: endDate.toISOString() },
  });
});