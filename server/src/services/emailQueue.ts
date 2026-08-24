import { EmailJobStatus } from '../types';
import { prisma } from '../prisma';
import * as emailService from './emailService';

interface EmailJobPayload {
  recipientEmail: string;
  studentName: string;
  eventName: string;
  eventDate?: string;
  venue?: string;
  token?: string;
  deadlineFormatted?: string;
  queuePosition?: number;
  uniqueId?: string;
  qrToken?: string;
  reason?: string;
}

/**
 * Enqueues an email job into the database safely with an idempotency key.
 */
export async function enqueueEmail(
  emailType: string,
  recipient: string,
  subject: string,
  payload: EmailJobPayload,
  idempotencyKey: string,
  registrationId?: string
) {
  try {
    const existing = await prisma.emailJob.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      console.log(`[EMAIL QUEUE] Job with key ${idempotencyKey} already exists. Skipping duplicate.`);
      return existing;
    }

    const job = await prisma.emailJob.create({
      data: {
        registrationId,
        emailType,
        recipient,
        subject,
        payload: JSON.stringify(payload),
        idempotencyKey,
        status: EmailJobStatus.PENDING,
      },
    });

    // Trigger immediate async processing without blocking
    processEmailQueueAsync().catch((err) =>
      console.error('[EMAIL QUEUE] Async process error:', err)
    );

    return job;
  } catch (err) {
    console.error('[EMAIL QUEUE] Failed to enqueue email job:', err);
  }
}

let isWorkerRunning = false;

/**
 * Worker process that picks up PENDING/FAILED email jobs and delivers them.
 */
export async function processEmailQueueAsync() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;

  try {
    const pendingJobs = await prisma.emailJob.findMany({
      where: {
        status: {
          in: [EmailJobStatus.PENDING, EmailJobStatus.FAILED],
        },
        retries: {
          lt: 3, // retry limit of 3
        },
      },
      take: 10, // process in small batches
      orderBy: {
        createdAt: 'asc',
      },
    });

    for (const job of pendingJobs) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: EmailJobStatus.PROCESSING },
      });

      try {
        const payload: EmailJobPayload = JSON.parse(job.payload);
        let success = false;

        switch (job.emailType) {
          case 'CONFIRMATION_REQUIRED':
            success = await emailService.sendRegistrationSuccessfulConfirmationRequired({
              recipientEmail: payload.recipientEmail,
              studentName: payload.studentName,
              eventName: payload.eventName,
              eventDate: payload.eventDate!,
              venue: payload.venue!,
              token: payload.token!,
              deadlineFormatted: payload.deadlineFormatted!,
            });
            break;

          case 'QUEUE_NOTICE':
            success = await emailService.sendQueueEmail({
              recipientEmail: payload.recipientEmail,
              studentName: payload.studentName,
              eventName: payload.eventName,
              queuePosition: payload.queuePosition!,
            });
            break;

          case 'QUEUE_PROMOTION':
            success = await emailService.sendQueuePromotionEmail({
              recipientEmail: payload.recipientEmail,
              studentName: payload.studentName,
              eventName: payload.eventName,
              eventDate: payload.eventDate!,
              venue: payload.venue!,
              token: payload.token!,
              deadlineFormatted: payload.deadlineFormatted!,
            });
            break;

          case 'FINAL_CONFIRMATION':
            success = await emailService.sendFinalConfirmationWithQR({
              recipientEmail: payload.recipientEmail,
              studentName: payload.studentName,
              eventName: payload.eventName,
              eventDate: payload.eventDate!,
              venue: payload.venue!,
              uniqueId: payload.uniqueId!,
              qrToken: payload.qrToken!,
            });
            break;

          case 'CANCELLATION':
            success = await emailService.sendCancellationNoticeEmail({
              recipientEmail: payload.recipientEmail,
              studentName: payload.studentName,
              eventName: payload.eventName,
              reason: payload.reason || 'User action or expired deadline',
            });
            break;

          case 'NOT_ACCEPTED':
            success = await emailService.sendRegistrationNotAcceptedEmail({
              recipientEmail: payload.recipientEmail,
              studentName: payload.studentName,
              eventName: payload.eventName,
            });
            break;

          default:
            console.warn(`[EMAIL QUEUE] Unknown email type: ${job.emailType}`);
            success = true;
        }

        if (success) {
          await prisma.emailJob.update({
            where: { id: job.id },
            data: {
              status: EmailJobStatus.SENT,
              sentAt: new Date(),
              errorMessage: null,
            },
          });
        }
      } catch (jobError: any) {
        console.error(`[EMAIL QUEUE] Error delivering job ${job.id}:`, jobError);
        await prisma.emailJob.update({
          where: { id: job.id },
          data: {
            status: EmailJobStatus.FAILED,
            retries: job.retries + 1,
            errorMessage: jobError.message || String(jobError),
          },
        });
      }

      // Small delay between sends to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } finally {
    isWorkerRunning = false;
  }
}
