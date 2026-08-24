import cron from 'node-cron';
import { RegistrationStatus, TokenResponseStatus } from '../types';
import { prisma } from '../prisma';
import { promoteNextInQueue } from './queueService';
import { enqueueEmail, processEmailQueueAsync } from './emailQueue';

let isExpirationWorkerRunning = false;

/**
 * Checks for expired pending confirmations and releases seats.
 */
export async function runExpirationCheck() {
  if (isExpirationWorkerRunning) return;
  isExpirationWorkerRunning = true;

  try {
    const now = new Date();

    // Find registrations whose deadline has passed and are still pending confirmation
    const expiredRegistrations = await prisma.registration.findMany({
      where: {
        status: {
          in: [RegistrationStatus.CONFIRMATION_PENDING, RegistrationStatus.PROMOTED],
        },
        confirmationDeadline: {
          lt: now,
        },
      },
    });

    if (expiredRegistrations.length === 0) {
      return;
    }

    console.log(`[EXPIRATION WORKER] Found ${expiredRegistrations.length} expired confirmation deadline(s).`);

    const config = await prisma.eventConfig.findFirst();
    const eventName = config?.name || 'MSC Tech Event';

    for (const reg of expiredRegistrations) {
      let emailToEnqueue: any = null;

      await prisma.$transaction(async (tx) => {
        // Mark tokens expired
        await tx.confirmationToken.updateMany({
          where: {
            registrationId: reg.id,
            responseStatus: TokenResponseStatus.PENDING,
          },
          data: {
            responseStatus: TokenResponseStatus.EXPIRED,
          },
        });

        // Mark registration expired
        await tx.registration.update({
          where: { id: reg.id },
          data: {
            status: RegistrationStatus.EXPIRED,
            confirmationDeadline: null,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            action: 'CONFIRMATION_EXPIRED',
            registrationId: reg.id,
            metadata: JSON.stringify({ expiredAt: now }),
          },
        });

        emailToEnqueue = {
          type: 'CANCELLATION',
          to: reg.email,
          subject: `Confirmation Deadline Expired for ${eventName}`,
          payload: {
            recipientEmail: reg.email,
            studentName: reg.fullName,
            eventName,
            reason: 'Confirmation deadline passed without response',
          },
          key: `expire_${reg.id}_${now.getTime()}`,
          regId: reg.id,
        };
      });

      if (emailToEnqueue) {
        await enqueueEmail(
          emailToEnqueue.type,
          emailToEnqueue.to,
          emailToEnqueue.subject,
          emailToEnqueue.payload,
          emailToEnqueue.key,
          emailToEnqueue.regId
        );
      }

      // Promote next queue student for released seat
      try {
        await promoteNextInQueue();
      } catch (promoErr) {
        console.error(`[EXPIRATION WORKER] Error promoting queue student after expiry of ${reg.id}:`, promoErr);
      }
    }
  } catch (err) {
    console.error('[EXPIRATION WORKER] Error running expiration check:', err);
  } finally {
    isExpirationWorkerRunning = false;
  }
}

/**
 * Initializes Cron schedule (runs every minute).
 */
export function startExpirationCron() {
  console.log('[EXPIRATION CRON] Scheduled expiration worker & email queue worker to run every minute.');
  // Run immediately on boot
  runExpirationCheck().catch((err) => console.error('[EXPIRATION WORKER] Boot run error:', err));
  processEmailQueueAsync().catch((err) => console.error('[EMAIL QUEUE] Boot processing error:', err));

  // Cron schedule: every minute (* * * * *)
  cron.schedule('* * * * *', () => {
    runExpirationCheck().catch((err) =>
      console.error('[EXPIRATION CRON] Periodic execution error:', err)
    );
    processEmailQueueAsync().catch((err) =>
      console.error('[EMAIL QUEUE CRON] Periodic queue processing error:', err)
    );
  });
}
