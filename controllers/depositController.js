// controllers/depositController.js (updated)
import asyncHandler from 'express-async-handler';
import Deposit from '../models/Deposit.js';

// @desc    Create a new deposit
// @route   POST /api/deposits
// @access  Private
export const addDeposit = asyncHandler(async (req, res) => {
  const { amount, description, date } = req.body;

  const deposit = new Deposit({
    user: req.user._id,
    amount,
    description,
    date, // model will default if omitted
  });

  const createdDeposit = await deposit.save();
  res.status(201).json(createdDeposit);
});

// @desc    Get all deposits for a user
// @route   GET /api/deposits
// @access  Private
export const getDeposits = asyncHandler(async (req, res) => {
  const deposits = await Deposit.find({ user: req.user._id });
  res.json(deposits);
});

// @desc    Get a single deposit by ID
// @route   GET /api/deposits/:id
// @access  Private
export const getDepositById = asyncHandler(async (req, res) => {
  const deposit = await Deposit.findById(req.params.id);

  if (deposit && deposit.user.toString() === req.user._id.toString()) {
    res.json(deposit);
  } else {
    res.status(404);
    throw new Error('Deposit not found');
  }
});

// @desc    Update a deposit
// @route   PUT /api/deposits/:id
// @access  Private
export const updateDeposit = asyncHandler(async (req, res) => {
  const { amount, description, date } = req.body;

  const deposit = await Deposit.findById(req.params.id);

  if (deposit && deposit.user.toString() === req.user._id.toString()) {
    if (amount !== undefined) deposit.amount = amount;
    if (description !== undefined) deposit.description = description;
    if (date !== undefined) deposit.date = date; // allow changing transaction date

    const updatedDeposit = await deposit.save();
    res.json(updatedDeposit);
  } else {
    res.status(404);
    throw new Error('Deposit not found');
  }
});

// @desc    Delete a deposit
// @route   DELETE /api/deposits/:id
// @access  Private
export const deleteDeposit = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: 'Invalid deposit id' });
  }

  const deleted = await Deposit.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!deleted) {
    return res.status(404).json({ message: 'Deposit not found' });
  }

  return res.status(200).json({ message: 'Deposit removed' });
});

// ------------------------------------------------------------
// NEW: Get deposits by date/date range
// ------------------------------------------------------------
// @desc    Get deposits filtered by a single day or an inclusive date range
// @route   GET /api/deposits/by-date?date=YYYY-MM-DD
// @route   GET /api/deposits/by-date?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private
export const getDepositsByDate = asyncHandler(async (req, res) => {
  const { date, from, to } = req.query;

  if (!date && !from && !to) {
    return res.status(400).json({
      message: 'Provide ?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD',
    });
  }

  const isYMD = /^\d{4}-\d{2}-\d{2}$/;
  const mkStart = (d) => new Date(`${d}T00:00:00.000Z`);
  const mkEnd = (d) => new Date(`${d}T23:59:59.999Z`);

  let startDate;
  let endDate;

  if (date) {
    if (!isYMD.test(date)) return res.status(400).json({ message: 'Invalid date format' });
    startDate = mkStart(date);
    endDate = mkEnd(date);
  } else {
    if (from && !isYMD.test(from)) return res.status(400).json({ message: 'Invalid from date' });
    if (to && !isYMD.test(to)) return res.status(400).json({ message: 'Invalid to date' });
    startDate = from ? mkStart(from) : new Date(0);
    endDate = to ? mkEnd(to) : new Date(8640000000000000); // far future
  }

  const deposits = await Deposit.find({
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });

  return res.json({
    deposits,
    range: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    },
  });
});

/*
USAGE EXAMPLES
--------------
GET /api/deposits/by-date?date=2025-08-25
GET /api/deposits/by-date?from=2025-08-01&to=2025-08-31

Notes
- Dates are treated as UTC days using 00:00:00.000Z to 23:59:59.999Z bounds.
- If only `from` is given, results are from that day to the far future; if only `to` is given, results are from the epoch to that day.
- Keep your model with an explicit `date` field (transaction date) separate from `createdAt`.
*/
