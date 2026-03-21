const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
const app = require('../server');
const User = require('../models/User');
const Meeting = require('../models/Meeting');

jest.mock('axios');

describe('Meeting reschedule/cancel endpoints', () => {
  let mongoServer;
  let api;
  let token;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongoServer.getUri();

    await mongoose.connect(process.env.MONGO_URI);

    api = request(app);

    const email = `testuser_${Date.now()}@example.com`;
    await api.post('/api/auth/register').send({
      name: 'Test User',
      email,
      password: 'password123',
      timezone: 'UTC'
    });

    const login = await api.post('/api/auth/login').send({
      email,
      password: 'password123'
    });
    token = login.body.token;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    axios.post.mockReset();
    await Meeting.deleteMany({});
  });

  test('should create, reschedule, and cancel meeting correctly', async () => {
    axios.post.mockResolvedValueOnce({ data: {
      extracted_data: {
        intent: 'schedule',
        date: '2026-03-22',
        time: '15:00',
        duration: '15',
        participants: ['john']
      }
    }});

    const scheduleResponse = await api
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Schedule meeting with john tomorrow at 3pm' });

    expect(scheduleResponse.status).toBe(200);
    expect(scheduleResponse.body.meetingDetails).toBeDefined();

    const meetingId = scheduleResponse.body.meetingDetails._id;

    const rescheduleResponse = await api
      .post(`/api/meetings/${meetingId}/reschedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-03-23', time: '16:00', duration: 30 });

    expect(rescheduleResponse.status).toBe(200);
    expect(rescheduleResponse.body.meeting.startTime).toBe('16:00');
    expect(rescheduleResponse.body.meeting.duration).toBe(30);
    expect(rescheduleResponse.body.meeting.status).toBe('rescheduled');

    const cancelResponse = await api
      .post(`/api/meetings/${meetingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(cancelResponse.status).toBe(200);
    expect(cancelResponse.body.meeting.status).toBe('cancelled');
  });

  test('should reject conflict for duplicate reschedule', async () => {
    axios.post.mockResolvedValue({ data: {
      extracted_data: {
        intent: 'schedule',
        date: '2026-03-22',
        time: '10:00',
        duration: '30',
        participants: ['john']
      }
    }});

    const schedule1 = await api
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Schedule 30 minute meeting with john tomorrow at 10am' });

    expect(schedule1.status).toBe(200);

    const schedule2 = await api
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Schedule another 30 min meeting with john tomorrow at 10am' });

    // second should return conflict from createMeetingRecord
    expect(schedule2.status).toBe(200);
    expect(schedule2.body.reply).toMatch(/already have a meeting scheduled/i);
  });
});
