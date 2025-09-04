import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
  await redisClient.connect();
};

export { redisClient, connectRedis };