import 'dotenv/config'; 
import { Worker } from 'bullmq';
import { sendEmail } from '../utils/sendEmail.js';

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { email, subject, message } = job.data;
    await sendEmail({ email, subject, message });
    console.log(`Email sent to ${email}`);
  },
  {
    connection: {
      url: process.env?.REDIS_URL,  // ✅ use full URL, no split
    },
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

export { emailWorker };
