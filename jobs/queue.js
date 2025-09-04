import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const emailQueue = new Queue('emailQueue', {
  connection: {
    host: process.env.REDIS_URL?.split('://')[1].split(':')[0],
    port: parseInt(process.env.REDIS_URL?.split(':')[2]),
  },
});

export { emailQueue };