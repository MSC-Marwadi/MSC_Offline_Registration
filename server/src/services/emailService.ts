import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

// Dynamic App URL getter
function getAppUrl(): string {
  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}

// Dynamic Nodemailer Transport getter
function getTransporter() {
  const user = (process.env.GMAIL_USER || 'msc.marwadisupport@gmail.com').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || 'wnpviqzyhwnqftpt').trim();
  const host = (process.env.GMAIL_HOST || 'smtp.gmail.com').trim();

  // Render & cloud hosts block outbound port 587 STARTTLS.
  // Force SSL port 465 for Gmail to guarantee email delivery regardless of env GMAIL_PORT setting.
  const isGmail = host === 'smtp.gmail.com' || user.toLowerCase().endsWith('@gmail.com');

  const transportOptions: any = isGmail
    ? {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      }
    : {
        host,
        port: parseInt(process.env.GMAIL_PORT || '465', 10),
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      };

  return {
    transporter: nodemailer.createTransport(transportOptions),
    user,
    pass,
    fromName: process.env.EMAIL_FROM_NAME || 'Department of Computer Engineering • MSC Team',
  };
}

/**
 * Helper component rendering event perks for Code To Cloud (Light Fluent Theme)
 */
function getEventPerksHTML(): string {
  return `
  <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 18px; margin: 20px 0;">
    <div style="margin-bottom: 10px;">
      <span style="font-size: 13px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.8px;">🎁 Department of Computer Engineering Presents Code To Cloud</span>
    </div>
    <div style="font-size: 14px; color: #0f172a; line-height: 1.8;">
      <div style="margin-bottom: 6px;">💰 <strong style="color: #15803d;">$100 Azure Credit</strong> — Free cloud credit for hands-on deployment</div>
      <div style="margin-bottom: 6px;">🌐 <strong style="color: #0369a1;">Build & Deploy Live Site</strong> — Build & deploy your own website on Microsoft Azure</div>
      <div style="margin-bottom: 6px;">🏆 <strong style="color: #b45309;">Prizes & Awards</strong> — Top scorers win exclusive prizes & swag</div>
      <div style="margin-bottom: 6px;">📜 <strong style="color: #6b21a8;">Official Certificate</strong> — Certificate for all participants</div>
      <div>📢 <strong style="color: #be185d;">Official Spotlight</strong> — Opportunity to be featured on official MSC channels</div>
    </div>
    <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #e0f2fe; font-size: 12px; color: #475569; font-style: italic;">
      💻 <strong>Prerequisites:</strong> No prior cloud experience required! Just bring your curiosity and a charged laptop with VS Code installed.
    </div>
  </div>
  `;
}

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
      body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1e293b; }
      .container { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
      .hero-header { background: #ffffff; padding: 28px 28px 24px 28px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      .hero-header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.3; }
      .hero-header .subtitle { font-size: 12px; color: #0078D4; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px; display: block; }
      .content { padding: 28px; line-height: 1.6; color: #334155; }
      .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #eff6ff; color: #0078D4; border: 1px solid #bfdbfe; margin-bottom: 18px; }
      .badge-success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
      .badge-warning { background: #fffbeb; color: #d97706; border-color: #fde68a; }
      .badge-danger { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
      .btn-container { text-align: center; margin: 28px 0; }
      .btn { display: inline-block; padding: 13px 30px; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none; margin: 6px 8px; transition: all 0.2s ease; letter-spacing: 0.3px; }
      .btn-yes { background: #0078D4; color: #ffffff !important; box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3); }
      .btn-no { background: #ffffff; color: #dc2626 !important; border: 1px solid #fca5a5; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.1); }
      .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
      .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
      .details-row:last-child { border-bottom: none; }
      .label { font-weight: 600; color: #64748b; }
      .val { color: #0f172a; font-weight: 600; text-align: right; }
      .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      .qr-card { background: #f8fafc; border: 2px solid #0078D4; border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="hero-header">
        <!-- Microsoft 4-tile branding accent line -->
        <div style="margin-bottom: 12px; font-size: 0;">
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #F25022; margin-right: 2px;"></span>
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #7FBA00; margin-right: 2px;"></span>
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #0078D4; margin-right: 2px;"></span>
          <span style="display: inline-block; width: 12px; height: 12px; background-color: #FFB900;"></span>
        </div>
        <span class="subtitle">Department of Computer Engineering • Microsoft Student Community</span>
        <h1>Code to Cloud: Build & Deploy Your First Website on Azure</h1>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0; font-weight: 700; color: #334155;">Department of Computer Engineering • Microsoft Student Community</p>
        <p style="margin: 0; color: #64748b;">Marwadi University, Rajkot • Code To Cloud Workshop &copy; 2026</p>
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
  const yesLink = `${getAppUrl()}/confirm/${data.token}/yes`;
  const noLink = `${getAppUrl()}/confirm/${data.token}/no`;

  const html = wrapEmailTemplate(
    'Action Required: Confirm Your Event RSVP',
    `
    <span class="badge badge-warning">Action Required — Seat Allocated</span>
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #334155;">A seat has been allocated for you at <strong>${data.eventName}</strong>! Please RSVP below to confirm your attendance before the deadline.</p>

    <div class="details-box">
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
      <div class="details-row"><span class="label">RSVP Deadline:</span><span class="val" style="color: #dc2626; font-weight:700;">${data.deadlineFormatted}</span></div>
    </div>

    <p style="color: #334155;">Click <strong>YES</strong> to claim your seat and generate your official QR Code ticket pass. If you cannot make it, please click <strong>NO</strong> so your seat can be released to students in the queue.</p>

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
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #334155;">Thank you for registering for <strong>${data.eventName}</strong>. Maximum initial seat capacity has been reached, so your registration is queued.</p>

    <div class="details-box" style="text-align: center; padding: 24px; background: #eff6ff; border-color: #bfdbfe;">
      <p style="margin: 0; font-size: 12px; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Your Queue Position</p>
      <h1 style="font-size: 52px; margin: 8px 0; color: #0078D4; font-weight: 800;">#${data.queuePosition}</h1>
      <p style="margin: 0; font-size: 12px; color: #64748b;">Updates automatically as seats open up</p>
    </div>

    <p style="color: #334155;">As students confirm or decline their allocations, seats open up automatically. You will receive an instant RSVP email as soon as a seat becomes available for you.</p>
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
  const yesLink = `${getAppUrl()}/confirm/${data.token}/yes`;
  const noLink = `${getAppUrl()}/confirm/${data.token}/no`;

  const html = wrapEmailTemplate(
    'Seat Available: Queue Promotion!',
    `
    <span class="badge badge-success">Urgent — Seat Available!</span>
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Great News ${data.studentName}!</h2>
    <p style="color: #334155;">A seat has just opened up for you at <strong>${data.eventName}</strong>!</p>

    <div class="details-box">
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
      <div class="details-row"><span class="label">Urgent RSVP Deadline:</span><span class="val" style="color: #dc2626; font-weight: 700;">${data.deadlineFormatted}</span></div>
    </div>

    <p style="color: #334155;">You have a limited window to claim this seat. Please RSVP below immediately:</p>

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
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Congratulations ${data.studentName}!</h2>
    <p style="color: #334155;">Your attendance at <strong>${data.eventName}</strong> is officially confirmed. Below is your official ticket pass with your Unique Ticket ID and Entrance QR Code.</p>

    <div class="qr-card">
      <img src="cid:ticketqrcode" alt="Event Ticket QR Code" style="width: 220px; height: 220px; display: block; margin: 0 auto; border-radius: 12px; background: #ffffff; padding: 12px; border: 1px solid #e2e8f0;" />
      <p style="font-weight: 800; font-size: 24px; letter-spacing: 2px; color: #0078D4; margin: 16px 0 4px 0;">${data.uniqueId}</p>
      <p style="font-size: 12px; color: #64748b; margin: 0;">Present this QR code or Unique ID at the auditorium entrance</p>
    </div>

    ${getEventPerksHTML()}

    <div class="details-box">
      <div class="details-row"><span class="label">Student Name:</span><span class="val">${data.studentName}</span></div>
      <div class="details-row"><span class="label">Ticket ID:</span><span class="val" style="color:#0078D4; font-weight:700;">${data.uniqueId}</span></div>
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center;">Please arrive 15 minutes prior to start time. Keep this email saved on your phone for scanner check-in.</p>
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
 * Send Registration Details Updated Email
 */
export async function sendRegistrationUpdatedEmail(data: {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  enrollmentNumber: string;
  grNumber: string;
  department: string;
  status: string;
  uniqueId?: string | null;
}) {
  const html = wrapEmailTemplate(
    'Registration Details Updated',
    `
    <span class="badge badge-warning">Record Updated</span>
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Hello ${data.studentName},</h2>
    <p style="color: #334155;">Your registration details for <strong>${data.eventName}</strong> have been updated by the event administrator.</p>

    <div class="details-box">
      <div class="details-row"><span class="label">Full Name:</span><span class="val">${data.studentName}</span></div>
      <div class="details-row"><span class="label">Enrollment Number:</span><span class="val font-mono">${data.enrollmentNumber}</span></div>
      <div class="details-row"><span class="label">GR Number:</span><span class="val font-mono">${data.grNumber}</span></div>
      <div class="details-row"><span class="label">Department:</span><span class="val">${data.department}</span></div>
      <div class="details-row"><span class="label">Status:</span><span class="val" style="color: #0078D4; font-weight: 700;">${data.status}</span></div>
      ${data.uniqueId ? `<div class="details-row"><span class="label">Ticket ID:</span><span class="val" style="color:#0078D4; font-weight:700;">${data.uniqueId}</span></div>` : ''}
      <div class="details-row"><span class="label">Event:</span><span class="val">${data.eventName}</span></div>
      <div class="details-row"><span class="label">Date & Time:</span><span class="val">${data.eventDate}</span></div>
      <div class="details-row"><span class="label">Venue:</span><span class="val">${data.venue}</span></div>
    </div>

    <p style="font-size: 13px; color: #64748b; text-align: center;">If you have any questions regarding your registration update, please contact the Microsoft Student Chapter admin team.</p>
    `
  );

  return sendEmail(data.recipientEmail, `[Updated] Registration Details for ${data.eventName}`, html);
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
 * Core Mail Sender supporting HTTP REST APIs (Resend / Brevo) & Nodemailer SMTP Fallback
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: Array<{ filename: string; content: Buffer; cid?: string }>
): Promise<boolean> {
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const fromEmail = (process.env.GMAIL_USER || 'msc.marwadisupport@gmail.com').trim();
  const fromName = process.env.EMAIL_FROM_NAME || 'Department of Computer Engineering • MSC Team';

  // 1. HTTP API - Resend (Free 3,000 emails/month over HTTPS Port 443)
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `${fromName} <onboarding@resend.dev>`,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });
      const resData: any = await response.json();
      if (response.ok) {
        console.log(`[HTTP EMAIL SUCCESS - RESEND] Sent email to ${to}. Id: ${resData.id}`);
        return true;
      }
      console.error(`[HTTP EMAIL ERROR - RESEND]`, resData);
    } catch (err: any) {
      console.error(`[HTTP EMAIL FETCH ERROR - RESEND]`, err);
    }
  }

  // 2. HTTP API - Brevo / Sendinblue (Free 300 emails/day over HTTPS Port 443)
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
      });
      const resData: any = await response.json();
      if (response.ok) {
        console.log(`[HTTP EMAIL SUCCESS - BREVO] Sent email to ${to}. MessageId: ${resData.messageId}`);
        return true;
      }
      console.error(`[HTTP EMAIL ERROR - BREVO]`, resData);
    } catch (err: any) {
      console.error(`[HTTP EMAIL FETCH ERROR - BREVO]`, err);
    }
  }

  // 3. Nodemailer SMTP Fallback (for local development or paid instances)
  const { transporter, user, pass } = getTransporter();

  if (!user || user === 'your_email@gmail.com' || !pass) {
    console.log(`\n======================================================`);
    console.log(`[SMTP DEV LOG] (Gmail credentials not set)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Status: Simulated successful delivery`);
    console.log(`======================================================\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
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
