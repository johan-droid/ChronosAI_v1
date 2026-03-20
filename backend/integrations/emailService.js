const nodemailer = require('nodemailer');

// Create a transporter object using standard SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Nodemailer has built-in support for Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// @desc    Send meeting invitation emails to participants
const sendMeetingInvite = async (meetingDetails) => {
    try {
        const { title, date, startTime, duration, participants } = meetingDetails;

        // Ensure we actually have participants to email
        if (!participants || participants.length === 0) return;

        // Construct the email payload
        const mailOptions = {
            from: `"ChronosAI Scheduler" <${process.env.EMAIL_USER}>`,
            to: participants.join(', '), // Nodemailer accepts a comma-separated list of emails
            subject: `Meeting Invitation: ${title}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #0056b3;">You're Invited!</h2>
                    <p>A new meeting has been scheduled via ChronosAI.</p>
                    <hr>
                    <p><strong>Topic:</strong> ${title}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${startTime}</p>
                    <p><strong>Duration:</strong> ${duration} minutes</p>
                    <p><strong>Attendees:</strong> ${participants.join(', ')}</p>
                    <br>
                    <p>Best regards,<br>Your ChronosAI Assistant</p>
                </div>
            `
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent successfully: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error(`❌ Error sending email: ${error.message}`);
        return false;
    }
};

module.exports = { sendMeetingInvite };