const axios = require('axios');
const BASE = 'http://localhost:5000/api';
(async () => {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    console.log('registering', email);
    const reg = await axios.post(`${BASE}/auth/register`, {name:'Test User', email, password:'password123', timezone:'UTC'});
    console.log('register result', reg.data);

    const login = await axios.post(`${BASE}/auth/login`, {email, password:'password123'});
    const token = login.data.token;
    console.log('login token', token.slice(0,10)+ '...');

    const api = axios.create({baseURL:BASE, headers:{Authorization:`Bearer ${token}`}});

    // send schedule command
    const scheduleText = 'Please schedule a 15 minute meeting with john tomorrow at 3pm';
    const chat1 = await api.post('/chat', {message: scheduleText});
    console.log('chat1', chat1.data);

    const chat2 = await api.post('/chat', {message: 'add maria to meeting'});
    console.log('chat2', chat2.data);

    // fetch meetings
    const meetings0 = await api.get('/meetings');
    console.log('meetings after scheduling', meetings0.data);
    const meetingId = meetings0.data?.[0]?._id;
    if (!meetingId) {
      console.log('No meeting created'); process.exit(1);
    }

    // reschedule using route
    const reschedule = await api.post(`/meetings/${meetingId}/reschedule`, {date: new Date(Date.now()+86400000).toISOString().split('T')[0], time:'16:00', duration:30});
    console.log('reschedule', reschedule.data);

    const meetings1 = await api.get('/meetings');
    console.log('meetings after reschedule', meetings1.data);

    const cancel = await api.post(`/meetings/${meetingId}/cancel`);
    console.log('cancel', cancel.data);

    const meetings2 = await api.get('/meetings');
    console.log('meetings after cancel', meetings2.data);

    // AI reschedule/cancel conversation flow
    // Recreate meeting for this path
    await api.post('/chat', {message:'Schedule 20 minute meeting with alex tomorrow at 10am'});
    const meeting2 = (await api.get('/meetings')).data[0];
    console.log('meeting2', meeting2);
    const chatResched = await api.post('/chat', {message:'Reschedule my next meeting to tomorrow at 11am'});
    console.log('chat reschedule path', chatResched.data);
    const chatCancel = await api.post('/chat', {message:'Cancel my next meeting'});
    console.log('chat cancel path', chatCancel.data);

    process.exit(0);
  } catch (e) {
    console.error('error', e.response ? e.response.data : e.message);
    process.exit(1);
  }
})();