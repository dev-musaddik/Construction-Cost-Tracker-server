
import cron from 'node-cron';
import User from '../models/User.js';
import { getDashboardData } from '../controllers/dashboardController.js';
import { generateDashboardPdf } from '../utils/pdfGenerator.js';
import { sendEmail } from '../utils/sendEmail.js';

// Schedule a cron job to run every day at 1 AM
 cron.schedule('0 1 * * *', async () => {
  try {
    // Fetch all users who have enabled daily reports
    const users = await User.find({ dailyReports: true });

    for (const user of users) {
      const req = { user: user, query: { filter: 'today' } };
      const dashboardData = await getDashboardData(req);
      const pdf = generateDashboardPdf(dashboardData);

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Your Daily Dashboard Report',
        text: 'Please find your daily dashboard report attached.',
        attachments: [
          {
            filename: 'dashboard.pdf',
            content: pdf,
            contentType: 'application/pdf',
          },
        ],
      };

      await sendEmail(mailOptions);
    }
  } catch (error) {
    console.error('Error generating daily reports:', error);
  }
});
