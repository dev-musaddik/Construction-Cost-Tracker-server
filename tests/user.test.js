import request from 'supertest';
import app from '../server.js'; // Assuming your express app is exported from server.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to a test database before all tests
beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI; // Use your test MongoDB URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in .env');
  }
  await mongoose.connect(mongoUri);
});

// Close the database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Registration', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('token');
  });

  it('should not register a user with existing email', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });
});