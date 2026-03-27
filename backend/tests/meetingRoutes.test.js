const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');

jest.mock('axios');

jest.mock('../integrations/emailService', () => ({
  sendCustomEmail: jest.fn(async () => true),
  sendMeetingInvite: jest.fn(async () => true),
  sendMeetingReschedule: jest.fn(async () => true),
  sendMeetingCancellation: jest.fn(async () => true),
}));

const app = require('../server');
const User = require('../models/User');
const Meeting = require('../models/Meeting');

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

  test('should support waiting room flow with token issuance', async () => {
    axios.post.mockResolvedValue({ data: {
      extracted_data: {
        intent: 'schedule',
        date: '2026-04-01',
        time: '11:00',
        duration: '30',
        participants: ['alice@example.com']
      }
    }});

    const schedule = await api
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Schedule meeting with alice next week at 11am' });

    expect(schedule.status).toBe(200);
    const meetingId = schedule.body.meetingDetails._id;

    // Toggle waiting room in DB directly since no API update endpoint exists
    await Meeting.findByIdAndUpdate(meetingId, { waitingRoomEnabled: true });

    // create an external non-organizer user
    const otherEmail = `other_${Date.now()}@example.com`;
    await api.post('/api/auth/register').send({ name: 'Other User', email: otherEmail, password: 'password123', timezone: 'UTC' });
    const otherLogin = await api.post('/api/auth/login').send({ email: otherEmail, password: 'password123' });
    const otherToken = otherLogin.body.token;

    // non-owner requests access
    const request = await api
      .post(`/api/meetings/${meetingId}/request-access`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send();
    expect(request.status).toBe(200);

    // non-owner cannot get join token until approved
    const tokenBefore = await api
      .get(`/api/meetings/${meetingId}/join-token`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(tokenBefore.status).toBe(403);

    // organizer approves request
    const approve = await api
      .post(`/api/meetings/${meetingId}/approve-access`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: otherEmail });
    expect(approve.status).toBe(200);

    // pending request snapshot for contract
    const pendingResponse = await api
      .get(`/api/meetings/${meetingId}/pending-requests`)
      .set('Authorization', `Bearer ${token}`);
    expect(pendingResponse.status).toBe(200);
    expect(pendingResponse.body).toMatchSnapshot();

    // now non-owner can obtain join token
    const tokenResponse = await api
      .get(`/api/meetings/${meetingId}/join-token`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(tokenResponse.status).toBe(200);
    expect(tokenResponse.body.token).toBeDefined();

    // validate token should succeed
    const validate = await api
      .post(`/api/meetings/${meetingId}/validate-token`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ token: tokenResponse.body.token });
    expect(validate.status).toBe(200);
    expect(validate.body.valid).toBe(true);

    // invalid token should fail
    const badValidate = await api
      .post(`/api/meetings/${meetingId}/validate-token`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ token: 'invalidtoken123' });
    expect(badValidate.status).toBe(403);
  });

  test('should send custom formatted email via /api/meetings/custom-email', async () => {
    const response = await api
      .post('/api/meetings/custom-email')
      .set('Authorization', `Bearer ${token}`)
      .send({
        to: 'recipient@example.com',
        subject: 'Custom Template Test',
        html: '<p>This is a custom HTML body.</p>'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Custom email sent.');
  });
});
