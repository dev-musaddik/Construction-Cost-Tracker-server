import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';
import { emailWorker } from './jobs/worker.js';
import './jobs/dailyPdfReport.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration  } from '@sentry/profiling-node';

// Load env vars
dotenv.config();

// // Initialize Sentry
// if (process.env.SENTRY_DSN) {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     integrations: [
//       // Add integrations to enable automatic tracing and error capturing
//       new Sentry.Integrations.Http({ tracing: true }),
//       new Sentry.Integrations.Express({ app }),
//       new nodeProfilingIntegration (),
//     ],
//     // Performance Monitoring
//     tracesSampleRate: 1.0, // Capture 100% of the transactions
//     // Set sampling rate for profiling - this is relative to tracesSampleRate
//     profilesSampleRate: 1.0,
//   });
// }


// Connect to database
connectDB();
// connectRedis();

const app = express();

// The request handler must be the first middleware on the app
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Body parser
app.use(express.json());

// Enable CORS

const allowedOrigins = [
    "http://localhost:3000", // Development
    "https://construction-cost-tracker-i6b1.vercel.app" // Production
  ];
  
  app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin"));
      }
    },
    credentials: true,
  }));

app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/todos', todoRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

// The error handler must be before any other error middleware and after all controllers
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.Handlers.errorHandler());
// }

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));

export default app;