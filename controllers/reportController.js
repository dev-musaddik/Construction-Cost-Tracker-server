import asyncHandler from 'express-async-handler';
import { emailQueue } from '../jobs/queue.js';
import Expense from '../models/Expense.js';

// @desc    Schedule daily expense report email
// @route   POST /api/reports/schedule
// @access  Private
const scheduleDailyReport = asyncHandler(async (req, res) => {
  const { email } = req.user;

  // Get today's expenses for the user
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const expenses = await Expense.find({
    user: req.user._id,
    createdAt: { $gte: today, $lt: tomorrow },
  }).populate('category', 'name');

  let reportContent = '<h2>Daily Expense Report</h2>';
  if (expenses.length === 0) {
    reportContent += '<p>No expenses recorded today.</p>';
  } else {
    reportContent += '<table border="1" style="width:100%; border-collapse: collapse;">';
    reportContent += '<thead><tr><th>Description</th><th>Amount</th><th>Category</th><th>Date</th></tr></thead>';
    reportContent += '<tbody>';
    expenses.forEach(expense => {
      reportContent += `<tr>
        <td>${expense.description}</td>
        <td>${expense.amount.toFixed(2)}</td>
        <td>${expense.category ? expense.category.name : 'N/A'}</td>
        <td>${new Date(expense.createdAt).toLocaleDateString()}</td>
      </tr>`;
    });
    reportContent += '</tbody></table>';
  }

  // Add job to queue
  await emailQueue.add(
    'dailyReport',
    {
      email,
      subject: 'Daily Expense Report',
      message: reportContent,
    },
    {
      repeat: { cron: '0 0 * * *' }, // Run daily at midnight
      jobId: `daily-report-${req.user._id}`,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  res.status(200).json({ message: 'Daily report scheduled successfully' });
});

export { scheduleDailyReport };