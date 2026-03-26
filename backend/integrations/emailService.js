const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const Meeting = require('../models/Meeting');

let resend = null;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
} else {
    console.warn('RESEND_API_KEY is not configured; email delivery via Resend SDK will be disabled.');
}

// Resend SMTP config
const useResendSmtp = process.env.RESEND_USE_SMTP === 'true' || Boolean(process.env.RESEND_SMTP_PASS);
let smtpTransporter = null;
if (useResendSmtp) {
    const smtpPass = process.env.RESEND_SMTP_PASS;
    if (!smtpPass) {
        console.warn('RESEND_SMTP_PASS is not configured; Resend SMTP delivery will be disabled.');
    } else {
        smtpTransporter = nodemailer.createTransport({
            host: process.env.RESEND_SMTP_HOST || 'smtp.resend.com',
            port: Number(process.env.RESEND_SMTP_PORT || 587),
            secure: process.env.RESEND_SMTP_SECURE === 'true',
            auth: {
                user: process.env.RESEND_SMTP_USER || 'apikey',
                pass: smtpPass,
            },
        });
    }
}

// fallback sender default
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'no-reply@chronosai.example.com';

const meetingTemplateSource = `
<div style="font-family: Arial, sans-serif; padding: 20px; line-height:1.5;">
  <h2 style="color: #1e3a8a;">{{actionText}}</h2>
  <p>{{message}}</p>
  <table style="border-collapse: collapse; width: 100%; margin-top: 8px;">
    <tr><td style="padding: 4px 8px;"><strong>Topic:</strong></td><td style="padding: 4px 8px;">{{title}}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Date:</strong></td><td style="padding: 4px 8px;">{{date}}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Time:</strong></td><td style="padding: 4px 8px;">{{startTime}}</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Duration:</strong></td><td style="padding: 4px 8px;">{{duration}} minutes</td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Meeting Link:</strong></td><td style="padding: 4px 8px;"><a href="{{meetingLink}}">Join Meeting</a></td></tr>
    <tr><td style="padding: 4px 8px;"><strong>Attendees:</strong></td><td style="padding: 4px 8px;">{{participants}}</td></tr>
  </table>
  <p style="margin-top: 16px;"><a href="{{meetingLink}}" style="background-color:#2563eb;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;">Open meeting details</a></p>
  <p style="margin-top:20px;color:#6b7280;">Sent by ChronosAI scheduler</p>
</div>
`;
const meetingTemplate = Handlebars.compile(meetingTemplateSource);

const customTemplateSource = `
<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.5; color:#111; background: #f7fafc;">
  <div style="max-width: 700px; margin:auto; background:#fff; border: 1px solid #e2e8f0; border-radius:8px; overflow:hidden; box-shadow:0 0 20px rgba(0,0,0,.05);">
    <div style="background: linear-gradient(90deg, #2563eb, #1d4ed8); color: #fff; padding: 16px;">
      <h1 style="margin:0;font-size:20px;">{{heading}}</h1>
    </div>
    <div style="padding: 20px;">
      <p style="margin-top:0; margin-bottom:16px;">{{message}}</p>
      {{#if actionUrl}}
        <a href="{{actionUrl}}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">{{actionText}}</a>
      {{/if}}

      {{#if details}}
        <div style="margin-top:20px;padding:16px;background:#f1f5f9;border-radius:6px;">
          {{{details}}}
        </div>
      {{/if}}

      <p style="border-top:1px solid #e2e8f0; padding-top:14px; color:#64748b; font-size:13px;">{{footer}}</p>
    </div>
  </div>
</div>
`;
const customTemplate = Handlebars.compile(customTemplateSource);

const logEmailAudit = async ({ meetingId, eventType, to, cc = [], status, message }) => {
    if (!meetingId) return;
    try {
        await Meeting.findByIdAndUpdate(meetingId, {
            $push: {
                emailAudit: {
                    eventType,
                    to: Array.isArray(to) ? to : [to],
                    cc: Array.isArray(cc) ? cc : [cc],
                    status,
                    message,
                    createdAt: new Date()
                }
            }
        });
    } catch (error) {
        console.error('Failed to record email audit log:', error.message);
    }
};

const sendResendEmail = async ({ meetingId, to, cc = [], subject, html, eventType }) => {
    const recipients = Array.isArray(to) ? to : [to];
    const ccRecipients = Array.isArray(cc) ? cc : [cc];

    if (useResendSmtp && smtpTransporter) {
        try {
            const info = await smtpTransporter.sendMail({
                from: SENDER_EMAIL,
                to: recipients.join(', '),
                cc: ccRecipients.filter(Boolean).join(', '),
                subject,
                html,
            });
            const successMessage = `Resend SMTP email sent successfully (messageId: ${info.messageId})`;
            console.log(`✉️ ${successMessage}`);
            await logEmailAudit({ meetingId, eventType, to: recipients, cc: ccRecipients, status: 'success', message: successMessage });
            return true;
        } catch (smtpError) {
            const smtpErrorMsg = smtpError.message || String(smtpError);
            console.error(`❌ Resend SMTP failed: ${smtpErrorMsg}`);
            await logEmailAudit({ meetingId, eventType, to: recipients, cc: ccRecipients, status: 'failed', message: smtpErrorMsg });
            // fallback to Resend SDK if available
        }
    }

    if (!resend) {
        const msg = 'No Resend provider is configured (SDK/API key or SMTP).';
        console.warn(msg);
        await logEmailAudit({ meetingId, eventType, to: recipients, cc: ccRecipients, status: 'failed', message: msg });
        return false;
    }

    try {
        const response = await resend.emails.send({
            from: SENDER_EMAIL,
            to: recipients,
            cc: ccRecipients.filter(Boolean),
            subject,
            html
        });
        const successMessage = `Resend API email sent successfully (id: ${response.id})`;
        console.log(`✉️ ${successMessage}`);
        await logEmailAudit({ meetingId, eventType, to: recipients, cc: ccRecipients, status: 'success', message: successMessage });
        return true;
    } catch (error) {
        const errorMsg = error.message || String(error);
        console.error(`❌ Resend API failed: ${errorMsg}`);
        await logEmailAudit({ meetingId, eventType, to: recipients, cc: ccRecipients, status: 'failed', message: errorMsg });
        return false;
    }
};

const composeCustomEmailHtml = (options) => {
    return customTemplate({
        heading: options.heading || 'Hello from ChronosAI',
        message: options.message || 'This is a rich custom notification email from ChronosAI.',
        actionUrl: options.actionUrl || null,
        actionText: options.actionText || 'View details',
        details: options.details || null,
        footer: options.footer || 'You are receiving this email because you are part of an important update.'
    });
};

const sendCustomEmail = async ({ meetingId = null, to, cc = [], subject, customHtml, customData, eventType = 'custom' }) => {
    const payloadHtml = customHtml || composeCustomEmailHtml(customData || {});
    return sendResendEmail({ meetingId, to, cc, subject, html: payloadHtml, eventType });
};

const sendMeetingEmail = async (meetingDetails, type) => {
    if (!meetingDetails || !meetingDetails.participants || meetingDetails.participants.length === 0) return false;

    const organizerEmail = meetingDetails.organizerEmail && meetingDetails.participants.indexOf(meetingDetails.organizerEmail) === -1
        ? meetingDetails.organizerEmail
        : null;

    const recipients = Array.from(new Set([...meetingDetails.participants, organizerEmail].filter(Boolean)));
    const actionText = type === 'invite' ? 'You are invited to a new meeting' : type === 'reschedule' ? 'Your meeting has been rescheduled' : 'The following meeting has been cancelled';
    const message = type === 'invite' ? 'A new meeting has been scheduled via ChronosAI.' : type === 'reschedule' ? 'The meeting has been updated with new date/time.' : 'The following meeting has been cancelled and will no longer take place.';

    const html = meetingTemplate({
        actionText,
        message,
        title: meetingDetails.title,
        date: meetingDetails.date,
        startTime: meetingDetails.startTime,
        duration: meetingDetails.duration,
        participants: meetingDetails.participants.join(', '),
        meetingLink: meetingDetails.meetingLink || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/meetings/${meetingDetails._id}`
    });

    return await sendResendEmail({
        meetingId: meetingDetails._id,
        to: recipients,
        cc: organizerEmail && !recipients.includes(organizerEmail) ? [organizerEmail] : [],
        subject: `${type === 'invite' ? 'Meeting Invitation' : type === 'reschedule' ? 'Meeting Rescheduled' : 'Meeting Cancelled'}: ${meetingDetails.title}`,
        html,
        eventType: type
    });
};

const sendMeetingInvite = async (meetingDetails) => sendMeetingEmail(meetingDetails, 'invite');
const sendMeetingReschedule = async (meetingDetails) => sendMeetingEmail(meetingDetails, 'reschedule');
const sendMeetingCancellation = async (meetingDetails) => sendMeetingEmail(meetingDetails, 'cancel');

module.exports = {
    sendMeetingInvite,
    sendMeetingReschedule,
    sendMeetingCancellation,
    sendCustomEmail
};