import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'MSC Event Team';

// Nodemailer transport creation
const transporter = nodemailer.createTransport({
  host: process.env.GMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.GMAIL_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Modern Tech Event Email Template Wrapper with Schema.org JSON-LD for Gmail RSVP Cards
 */
function wrapEmailTemplate(
  title: string,
  bodyContent: string,
  eventSchema?: {
    eventName: string;
    eventDate: string;
    venue: string;
    studentName: string;
    token?: string;
  }
): string {
  const jsonLdSchema = eventSchema
    ? `
    <script type="application/ld+json">
    {
      "@context": "http://schema.org",
      "@type": "EventReservation",
      "reservationNumber": "${eventSchema.token || 'MSC-2026'}",
      "reservationStatus": "http://schema.org/ReservationConfirmed",
      "underName": {
        "@type": "Person",
        "name": "${eventSchema.studentName}"
      },
      "reservationFor": {
        "@type": "Event",
        "name": "${eventSchema.eventName}",
        "startDate": "${new Date().toISOString()}",
        "location": {
          "@type": "Place",
          "name": "${eventSchema.venue}",
          "address": {
            "@type": "PostalAddress",
            "name": "${eventSchema.venue}"
          }
        }
      }
    }
    </script>
    `
    : '';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${jsonLdSchema}
    <style>
      body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 20px; color: #e2e8f0; }
      .container { max-width: 620px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5); border: 1px solid #334155; }
      .hero-header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0078D4 100%); padding: 32px 28px; text-align: left; border-bottom: 2px solid #00e5ff; }
      .hero-header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; line-height: 1.3; }
      .hero-header .subtitle { font-size: 13px; color: #38bdf8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; display: block; }
      .content { padding: 32px 28px; line-height: 1.6; color: #f1f5f9; }
      .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); margin-bottom: 20px; }
      .badge-success { background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
      .badge-warning { background: rgba(234, 179, 8, 0.15); color: #fde047; border-color: rgba(234, 179, 8, 0.3); }
      .badge-danger { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border-color: rgba(239, 68, 68, 0.3); }
      .btn-container { text-align: center; margin: 32px 0; }
      .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 700; text-decoration: none; margin: 6px 8px; transition: all 0.2s ease; letter-spacing: 0.5px; }
      .btn-yes { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.4); border: 1px solid #22c55e; }
      .btn-no { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff !important; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); border: 1px solid #ef4444; }
      .details-box { background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; }
      .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
      .details-row:last-child { border-bottom: none; }
      .label { font-weight: 600; color: #94a3b8; }
      .val { color: #f8fafc; font-weight: 600; text-align: right; }
      .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #334155; }
      .qr-card { background: #0f172a; border: 2px solid #0078D4; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="hero-header">
        <span class="subtitle">Marwadi University • Tech Event</span>
        <h1>MSC Annual Technology Symposium 2026</h1>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #94a3b8;">Microsoft Student Chapter • Marwadi University</p>
        <p style="margin: 0;">Automated Event & Attendance Verification System &copy; 2026</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

/**
 * Send Initial Seat Allocated — Confirmation Required Email
 */
export async function sendRegistrationSuccessfulConfirmationRequired(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  token: string;
  deadlineFormatted: string;
}) {
  const yesLink = `${APP_URL}/confirm/${data.token}/yes`;
  const noLink = `${APP_URL}/confirm/${data.token}/no`;

  const html = wrapEmailTemplate(
    'Action Required: Confirm Your Event RSVP',
    `
    <span class="badge badge-warning">Action Required — Seat Allocated</span>
    <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #cbd5e1;">A seat has been allocated for you at <strong>${data.eventName}</strong>! Please RSVP below to confirm your attendance before the deadline.</p>

    <div class="details-box">
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
      <div class="details-row"><span class="label">RSVP Deadline:</span><span class="val" style="color: #ef4444; font-weight:700;">${data.deadlineFormatted}</span></div>
    </div>

    <p style="color: #cbd5e1;">Click <strong>YES</strong> to claim your seat and generate your official QR Code ticket pass. If you cannot make it, please click <strong>NO</strong> so your seat can be released to students in the queue.</p>

    <div class="btn-container">
      <a href="${yesLink}" class="btn btn-yes">YES — I WILL ATTEND</a>
      <a href="${noLink}" class="btn btn-no">NO — CANCEL SEAT</a>
    </div>

    <p style="font-size: 12px; color: #64748b; text-align: center;">Single-use RSVP secure token. Valid until ${data.deadlineFormatted}.</p>
    `,
    {
      eventName: data.eventName,
      eventDate: data.eventDate,
      venue: data.venue,
      studentName: data.studentName,
      token: data.token,
    }
  );

  return sendEmail(data.recipientEmail, `[RSVP Required] Confirm Registration for ${data.eventName}`, html);
}

/**
 * Send Queue Position Email
 */
export async function sendQueueEmail(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  queuePosition: number;
}) {
  const html = wrapEmailTemplate(
    'Registration Queue Status',
    `
    <span class="badge badge-warning">Queue Status</span>
    <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #cbd5e1;">Thank you for registering for <strong>${data.eventName}</strong>. Maximum initial seat capacity has been reached, so your registration is queued.</p>

    <div class="details-box" style="text-align: center; padding: 24px;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Your Queue Position</p>
      <h1 style="font-size: 52px; margin: 8px 0; color: #38bdf8; font-weight: 800;">#${data.queuePosition}</h1>
      <p style="margin: 0; font-size: 12px; color: #64748b;">Updates automatically as seats open up</p>
    </div>

    <p style="color: #cbd5e1;">As students confirm or decline their allocations, seats open up automatically. You will receive an instant RSVP email as soon as a seat becomes available for you.</p>
    `
  );

  return sendEmail(data.recipientEmail, `Queue Status: #${data.queuePosition} for ${data.eventName}`, html);
}

/**
 * Send Queue Promotion Email
 */
export async function sendQueuePromotionEmail(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  token: string;
  deadlineFormatted: string;
}) {
  const yesLink = `${APP_URL}/confirm/${data.token}/yes`;
  const noLink = `${APP_URL}/confirm/${data.token}/no`;

  const html = wrapEmailTemplate(
    'Seat Available: Queue Promotion!',
    `
    <span class="badge badge-success">Urgent — Seat Available!</span>
    <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Great News ${data.studentName}!</h2>
    <p style="color: #cbd5e1;">A seat has just opened up for you at <strong>${data.eventName}</strong>!</p>

    <div class="details-box">
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
      <div class="details-row"><span class="label">Urgent RSVP Deadline:</span><span class="val" style="color: #ef4444; font-weight: 700;">${data.deadlineFormatted}</span></div>
    </div>

    <p style="color: #cbd5e1;">You have a limited window to claim this seat. Please RSVP below immediately:</p>

    <div class="btn-container">
      <a href="${yesLink}" class="btn btn-yes">YES — I WILL ATTEND</a>
      <a href="${noLink}" class="btn btn-no">NO — DECLINE SEAT</a>
    </div>
    `,
    {
      eventName: data.eventName,
      eventDate: data.eventDate,
      venue: data.venue,
      studentName: data.studentName,
      token: data.token,
    }
  );

  return sendEmail(data.recipientEmail, `[Urgent RSVP] Seat Available! Confirm Registration for ${data.eventName}`, html);
}

/**
 * Send Final Confirmation with Unique ID & Dynamic QR Code Email (CID Attachment + Web URL Backup)
 */
export async function sendFinalConfirmationWithQR(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  uniqueId: string;
  qrToken: string;
}) {
  // 1. Generate PNG Buffer for Nodemailer CID Inline Attachment (Works 100% in Gmail)
  const qrBuffer = await QRCode.toBuffer(data.qrToken, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#0078D4',
      light: '#FFFFFF',
    },
  });

  // 2. HTTPS Web Fallback URL (if CID attachment is blocked by security client)
  const qrFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.qrToken)}`;

  const html = wrapEmailTemplate(
    'Registration Confirmed — Entry Ticket Pass',
    `
    <span class="badge badge-success">Official Entry Pass</span>
    <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Congratulations ${data.studentName}!</h2>
    <p style="color: #cbd5e1;">Your attendance at <strong>${data.eventName}</strong> is officially confirmed. Below is your official ticket pass with your Unique Ticket ID and Entrance QR Code.</p>

    <div class="qr-card">
      <img src="cid:ticketqrcode" alt="Event Ticket QR Code" style="width: 220px; height: 220px; display: block; margin: 0 auto; border-radius: 12px; background: #ffffff; padding: 12px;" />
      <p style="font-weight: 800; font-size: 24px; letter-spacing: 2px; color: #38bdf8; margin: 16px 0 4px 0;">${data.uniqueId}</p>
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">Present this QR code or Unique ID at the auditorium entrance</p>
    </div>

    <div class="details-box">
      <div class="details-row"><span class="label">Student Name:</span><span class="val">${data.studentName}</span></div>
      <div class="details-row"><span class="label">Ticket ID:</span><span class="val" style="color:#38bdf8; font-weight:700;">${data.uniqueId}</span></div>
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
    </div>

    <p style="font-size: 13px; color: #94a3b8; text-align: center;">Please arrive 15 minutes prior to start time. Keep this email saved on your phone for scanner check-in.</p>
    `,
    {
      eventName: data.eventName,
      eventDate: data.eventDate,
      venue: data.venue,
      studentName: data.studentName,
    }
  );

  return sendEmail(
    data.recipientEmail,
    `Confirmed Ticket Pass [${data.uniqueId}] for ${data.eventName}`,
    html,
    [
      {
        filename: `ticket-qr-${data.uniqueId}.png`,
        content: qrBuffer,
        cid: 'ticketqrcode', // Referenced as src="cid:ticketqrcode" in html template
      },
    ]
  );
}

/**
 * Send Cancellation / Seat Released Email
 */
export async function sendCancellationNoticeEmail(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  reason: string;
}) {
  const html = wrapEmailTemplate(
    'Registration Update',
    `
    <span class="badge badge-danger">Seat Released</span>
    <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #cbd5e1;">Your seat allocation for <strong>${data.eventName}</strong> has been cancelled (${data.reason}).</p>
    <p style="color: #94a3b8; font-size: 13px;">Thank you for your response. Your seat has been automatically released to the next queued student.</p>
    `
  );

  return sendEmail(data.recipientEmail, `Registration Update for ${data.eventName}`, html);
}

/**
 * Send Registration Not Accepted Email
 */
export async function sendRegistrationNotAcceptedEmail(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
}) {
  const html = wrapEmailTemplate(
    'Registration Status Notice',
    `
    <span class="badge">Registration Concluded</span>
    <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #cbd5e1;">Thank you for your interest in <strong>${data.eventName}</strong>.</p>
    <p style="color: #cbd5e1;">All available event seats have now been confirmed, and queue processing has concluded. Unfortunately, we are unable to allocate a seat for you at this time.</p>
    `
  );

  return sendEmail(data.recipientEmail, `Registration Status for ${data.eventName}`, html);
}

/**
 * Core SMTP Mail Sender with CID Attachments & Fallback Logging
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: Array<{ filename: string; content: Buffer; cid?: string }>
): Promise<boolean> {
  // If SMTP is not configured or in development without creds, log gracefully
  if (!GMAIL_USER || GMAIL_USER === 'your_email@gmail.com' || !GMAIL_APP_PASSWORD) {
    console.log(`\n======================================================`);
    console.log(`[SMTP DEV LOG] (Gmail credentials not set in .env)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Status: Simulated successful delivery`);
    console.log(`======================================================\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${GMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      attachments,
    });
    console.log(`[SMTP SUCCESS] Sent email to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[SMTP ERROR] Failed sending to ${to}:`, error);
    throw error;
  }
}
