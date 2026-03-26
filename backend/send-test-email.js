require('dotenv').config();
const { sendCustomEmail } = require('./integrations/emailService');

(async () => {
  try {
    const res = await sendCustomEmail({
      meetingId: null,
      to: 'sahooashutosh2022@gmail.com',
      cc: [],
      subject: 'ChronosAI automated test message',
      customHtml: `
        <h2>ChronosAI test</h2>
        <p>This email was sent automatically from your local backend.</p>
      `,
      eventType: 'automated_local_test'
    });

    console.log('sendCustomEmail returned:', res);
    if (res) {
      console.log('✅ Email send request completed, check the recipient inbox now.');
    } else {
      console.log('❌ Email send request returned false, check logs and Resend API key');
    }
  } catch (err) {
    console.error('failed to send test mail', err);
  }
})();