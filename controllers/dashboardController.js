import asyncHandler from "express-async-handler";
import Expense from "../models/Expense.js";
import Deposit from "../models/Deposit.js";
import Category from "../models/Category.js"; // Import Category model
/**
 * GET /api/dashboard
 * Private
 *
 * Query params supported:
 *  - filter=today|weekly|monthly  (server-computed windows)
 *  - date=YYYY-MM-DD               (single day)
 *  - from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive range)
 *  - weekStart=sun|mon             (default mon, used when filter=weekly)
 *
 * Notes:
 *  - If `date` is provided, `from/to` are ignored.
 *  - If none are provided, returns all-time stats for the user.
 */
export const getDashboardData = asyncHandler(async (req, res) => {
  const { filter, date, from, to, weekStart = "mon" } = req.query;

  // --- helpers -------------------------------------------------------------
  const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const startOfLocalDay = (ymd) => new Date(`${ymd}T00:00:00`);
  const endOfLocalDay = (ymd) => new Date(`${ymd}T23:59:59.999`);

  function rangeFromFilter() {
    const now = new Date();
    let startDate, endDate;

    if (filter === "today") {
      const ymd = now.toISOString().slice(0, 10); // yyyy-mm-dd in UTC; acceptable for local-ish cutoff if server TZ ~ local
      startDate = new Date(new Date().setHours(0, 0, 0, 0));
      endDate = new Date(new Date().setHours(23, 59, 59, 999));
      return { startDate, endDate };
    }

    if (filter === "weekly") {
      // Determine week start (Mon vs Sun)
      const day = now.getDay(); // 0=Sun..6=Sat
      const offset = weekStart === "sun" ? day : day === 0 ? 6 : day - 1; // Mon=0
      const start = new Date(now);
      start.setDate(now.getDate() - offset);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }

    if (filter === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }

    return {};
  }

  function rangeFromQuery() {
    if (date) {
      if (!isYMD(date))
        throw new Error("Invalid `date` format. Use YYYY-MM-DD.");
      return { startDate: startOfLocalDay(date), endDate: endOfLocalDay(date) };
    }
    const r = {};
    if (from) {
      if (!isYMD(from))
        throw new Error("Invalid `from` format. Use YYYY-MM-DD.");
      r.startDate = startOfLocalDay(from);
    }
    if (to) {
      if (!isYMD(to)) throw new Error("Invalid `to` format. Use YYYY-MM-DD.");
      r.endDate = endOfLocalDay(to);
    }
    return r;
  }

  // Priority: explicit date/from/to > filter preset
  const explicitRange = rangeFromQuery();
  const presetRange = Object.keys(explicitRange).length
    ? {}
    : rangeFromFilter();

  const startDate = explicitRange.startDate || presetRange.startDate;
  const endDate = explicitRange.endDate || presetRange.endDate;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.$gte = startDate;
    if (endDate) dateFilter.date.$lte = endDate;
  }

  // Base match for user + optional date bounds
  const match = { user: req.user._id, ...dateFilter };

  // Issue parallel queries where it helps
  const [expenses, deposits, expensesByCategory, expensesOverTime, categories] =
    await Promise.all([
      Expense.find(match).lean(),
      Deposit.find(match).lean(),
      Expense.aggregate([
        { $match: match },
        { $group: { _id: "$category", total: { $sum: "$amount" } } },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },
        { $project: { _id: 0, category: "$categoryDetails.name", total: 1 } },
      ]),
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Category.find({ user: req.user._id }).lean(), // Fetch categories for the user
    ]);
  const totalExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalDeposits = deposits.reduce((acc, d) => acc + (d.amount || 0), 0);
  const balance = totalDeposits - totalExpenses;

  res.json({
    totalExpenses,
    totalDeposits,
    balance,
    expensesByCategory,
    expensesOverTime,
    deposits,
    expenses,
    categories, // Add categories to the response
    meta: {
      startDate: startDate || null,
      endDate: endDate || null,
      applied: {
        filter: filter || null,
        date: date || null,
        from: from || null,
        to: to || null,
        weekStart,
      },
    },
  });
});

export default getDashboardData;
