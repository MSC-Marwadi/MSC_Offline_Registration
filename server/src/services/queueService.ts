import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { RegistrationStatus, TokenResponseStatus } from '../types';
import { prisma } from '../prisma';
import { generateNextUniqueId } from './uidService';
import { enqueueEmail } from './emailQueue';

/**
 * Gets or initializes default event configuration
 */
export async function getEventConfig() {
  let config = await prisma.eventConfig.findFirst();
  if (!config) {
    config = await prisma.eventConfig.create({
      data: {
        name: 'MSC Annual Tech Symposium 2026',
        description: 'The flagship annual technology and innovation symposium featuring industry leaders, hands-on workshops, and tech showcases.',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
        venue: 'Main University Auditorium & Online Stream',
        totalCapacity: 100,
        confirmationWindowHours: 24,
        queueConfirmationWindowHours: 1,
        registrationOpen: true,
      },
    });
  }
  return config;
}

/**
 * Core registration handler inside a database transaction to prevent race conditions.
 */
export async function registerStudentService(data: {
  fullName: string;
  email: string;
  enrollmentNumber: string;
  grNumber: string;
  department: string;
  additionalInfo?: string;
  phone?: string;
  college?: string;
  course?: string;
  semester?: string;
  division?: string;
}) {
  let emailToEnqueue: any = null;

  const reg = await prisma.$transaction(async (tx) => {
    // 1. Check duplicate email, enrollment number, or GR number
    const existing = await tx.registration.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase().trim() },
          { enrollmentNumber: data.enrollmentNumber.trim() },
          { grNumber: data.grNumber.trim() },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === data.email.toLowerCase().trim()) {
        throw new Error('A student with this email address has already registered.');
      } else if (existing.enrollmentNumber === data.enrollmentNumber.trim()) {
        throw new Error('A student with this enrollment number has already registered.');
      } else {
        throw new Error('A student with this GR number has already registered.');
      }
    }

    const config = await tx.eventConfig.findFirst();
    const capacity = config ? config.totalCapacity : 100;
    const initialHours = config ? config.confirmationWindowHours : 24;

    // 2. Count currently occupied/allocated seats
    const occupiedSeatsCount = await tx.registration.count({
      where: {
        status: {
          in: [
            RegistrationStatus.CONFIRMATION_PENDING,
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.PROMOTED,
            RegistrationStatus.PRESENT,
          ],
        },
      },
    });

    let newStatus: RegistrationStatus;
    let queuePosition: number | null = null;
    let confirmationDeadline: Date | null = null;
    let tokenString: string | null = null;

    if (occupiedSeatsCount < capacity) {
      // Seat allocated!
      newStatus = RegistrationStatus.CONFIRMATION_PENDING;
      confirmationDeadline = new Date(Date.now() + initialHours * 60 * 60 * 1000);
      tokenString = crypto.randomBytes(32).toString('hex');
    } else {
      // Placed in queue
      newStatus = RegistrationStatus.QUEUED;
      const currentQueueCount = await tx.registration.count({
        where: { status: RegistrationStatus.QUEUED },
      });
      queuePosition = currentQueueCount + 1;
    }

    // 3. Create Registration Record
    const createdReg = await tx.registration.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.toLowerCase().trim(),
        enrollmentNumber: data.enrollmentNumber.trim(),
        grNumber: data.grNumber.trim(),
        department: data.department.trim(),
        additionalInfo: data.additionalInfo ? data.additionalInfo.trim() : null,
        phone: data.phone ? data.phone.trim() : 'N/A',
        college: data.college ? data.college.trim() : 'Marwadi University',
        course: data.course ? data.course.trim() : 'Computer Science / IT',
        semester: data.semester ? data.semester.trim() : 'N/A',
        division: data.division ? data.division.trim() : 'N/A',
        status: newStatus,
        queuePosition: queuePosition,
        confirmationDeadline: confirmationDeadline,
      },
    });

    const eventName = config?.name || 'MSC Tech Event';

    // 4. Create token or audit log
    if (newStatus === RegistrationStatus.CONFIRMATION_PENDING && tokenString && confirmationDeadline) {
      await tx.confirmationToken.create({
        data: {
          registrationId: createdReg.id,
          token: tokenString,
          expiresAt: confirmationDeadline,
          responseStatus: TokenResponseStatus.PENDING,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'REGISTRATION_CREATED_SEAT_ALLOCATED',
          registrationId: createdReg.id,
          metadata: JSON.stringify({ status: newStatus, deadline: confirmationDeadline }),
        },
      });

      const eventDateStr = config?.eventDate ? new Date(config.eventDate).toLocaleString('en-US') : 'TBD';
      const venueStr = config?.venue || 'Main Auditorium';
      const deadlineStr = confirmationDeadline.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

      emailToEnqueue = {
        type: 'CONFIRMATION_REQUIRED',
        to: createdReg.email,
        subject: `[Action Required] Confirm Registration for ${eventName}`,
        payload: {
          recipientEmail: createdReg.email,
          studentName: createdReg.fullName,
          eventName,
          eventDate: eventDateStr,
          venue: venueStr,
          token: tokenString,
          deadlineFormatted: deadlineStr,
        },
        key: `reg_confirm_${createdReg.id}`,
        regId: createdReg.id,
      };
    } else {
      // Queued
      await tx.auditLog.create({
        data: {
          action: 'REGISTRATION_CREATED_QUEUED',
          registrationId: createdReg.id,
          metadata: JSON.stringify({ status: newStatus, queuePosition }),
        },
      });

      emailToEnqueue = {
        type: 'QUEUE_NOTICE',
        to: createdReg.email,
        subject: `Queue Status: #${queuePosition} for ${eventName}`,
        payload: {
          recipientEmail: createdReg.email,
          studentName: createdReg.fullName,
          eventName,
          queuePosition: queuePosition!,
        },
        key: `reg_queue_${createdReg.id}`,
        regId: createdReg.id,
      };
    }

    return createdReg;
  });

  // Enqueue email after transaction completion
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

  return reg;
}

/**
 * Atomic Queue Promotion Logic.
 * Promotes the next student in queue if seats are available.
 */
export async function promoteNextInQueue(): Promise<any> {
  let emailToEnqueue: any = null;

  const promotedReg = await prisma.$transaction(async (tx) => {
    const config = await tx.eventConfig.findFirst();
    const capacity = config ? config.totalCapacity : 100;
    const queueHours = config ? config.queueConfirmationWindowHours : 1;

    // Check available seats
    const occupied = await tx.registration.count({
      where: {
        status: {
          in: [
            RegistrationStatus.CONFIRMATION_PENDING,
            RegistrationStatus.CONFIRMED,
            RegistrationStatus.PROMOTED,
            RegistrationStatus.PRESENT,
          ],
        },
      },
    });

    if (occupied >= capacity) {
      console.log(`[QUEUE PROMOTION] No available seats (occupied ${occupied}/${capacity}).`);
      return null;
    }

    // Find first queued student (smallest queue position)
    const nextQueued = await tx.registration.findFirst({
      where: { status: RegistrationStatus.QUEUED },
      orderBy: [{ queuePosition: 'asc' }, { createdAt: 'asc' }],
    });

    if (!nextQueued) {
      console.log(`[QUEUE PROMOTION] Queue is empty. No student to promote.`);
      return null;
    }

    const deadline = new Date(Date.now() + queueHours * 60 * 60 * 1000);
    const tokenString = crypto.randomBytes(32).toString('hex');

    // Update promoted registration
    const updated = await tx.registration.update({
      where: { id: nextQueued.id },
      data: {
        status: RegistrationStatus.PROMOTED,
        queuePosition: null,
        confirmationDeadline: deadline,
      },
    });

    // Create confirmation token
    await tx.confirmationToken.create({
      data: {
        registrationId: updated.id,
        token: tokenString,
        expiresAt: deadline,
        responseStatus: TokenResponseStatus.PENDING,
      },
    });

    // Shift queue positions of remaining queued students by -1
    const remainingQueue = await tx.registration.findMany({
      where: { status: RegistrationStatus.QUEUED },
      orderBy: { queuePosition: 'asc' },
    });

    for (let i = 0; i < remainingQueue.length; i++) {
      await tx.registration.update({
        where: { id: remainingQueue[i].id },
        data: { queuePosition: i + 1 },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'QUEUE_PROMOTED',
        registrationId: updated.id,
        metadata: JSON.stringify({ deadline, newQueueLength: remainingQueue.length }),
      },
    });

    const eventName = config?.name || 'MSC Tech Event';
    const eventDateStr = config?.eventDate ? new Date(config.eventDate).toLocaleString('en-US') : 'TBD';
    const venueStr = config?.venue || 'Main Auditorium';
    const deadlineStr = deadline.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    emailToEnqueue = {
      type: 'QUEUE_PROMOTION',
      to: updated.email,
      subject: `[Urgent] Seat Available! Confirm Registration for ${eventName}`,
      payload: {
        recipientEmail: updated.email,
        studentName: updated.fullName,
        eventName,
        eventDate: eventDateStr,
        venue: venueStr,
        token: tokenString,
        deadlineFormatted: deadlineStr,
      },
      key: `promo_${updated.id}_${tokenString.substring(0, 8)}`,
      regId: updated.id,
    };

    return updated;
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

  return promotedReg;
}

/**
 * Handles Token Confirmation (YES or NO) safely.
 */
export async function processConfirmationToken(tokenString: string, response: 'yes' | 'no') {
  if (!tokenString) {
    throw new Error('INVALID_TOKEN');
  }

  let emailToEnqueue: any = null;
  let shouldTriggerPromotion = false;

  const result = await prisma.$transaction(async (tx) => {
    const tokenRecord = await tx.confirmationToken.findUnique({
      where: { token: tokenString },
      include: { registration: true },
    });

    if (!tokenRecord) {
      throw new Error('INVALID_TOKEN');
    }

    if (tokenRecord.responseStatus !== TokenResponseStatus.PENDING) {
      throw new Error('TOKEN_ALREADY_USED');
    }

    if (new Date() > tokenRecord.expiresAt) {
      await tx.confirmationToken.update({
        where: { id: tokenRecord.id },
        data: { responseStatus: TokenResponseStatus.EXPIRED },
      });
      throw new Error('TOKEN_EXPIRED');
    }

    const reg = tokenRecord.registration;
    const config = await tx.eventConfig.findFirst();
    const eventName = config?.name || 'MSC Tech Event';

    if (response === 'yes') {
      const uniqueId = await generateNextUniqueId(tx);
      const qrCodeToken = `QR-${uniqueId}-${crypto.randomBytes(16).toString('hex')}`;

      await tx.confirmationToken.update({
        where: { id: tokenRecord.id },
        data: {
          responseStatus: TokenResponseStatus.YES,
          respondedAt: new Date(),
        },
      });

      const updatedReg = await tx.registration.update({
        where: { id: reg.id },
        data: {
          status: RegistrationStatus.CONFIRMED,
          uniqueId: uniqueId,
          qrCodeToken: qrCodeToken,
          confirmationDeadline: null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CONFIRMATION_YES',
          registrationId: reg.id,
          metadata: JSON.stringify({ uniqueId, qrCodeToken }),
        },
      });

      const eventDateStr = config?.eventDate ? new Date(config.eventDate).toLocaleString('en-US') : 'TBD';
      const venueStr = config?.venue || 'Main Auditorium';

      emailToEnqueue = {
        type: 'FINAL_CONFIRMATION',
        to: reg.email,
        subject: `Confirmed Ticket [${uniqueId}] for ${eventName}`,
        payload: {
          recipientEmail: reg.email,
          studentName: reg.fullName,
          eventName,
          eventDate: eventDateStr,
          venue: venueStr,
          uniqueId,
          qrToken: qrCodeToken,
        },
        key: `final_${reg.id}_${uniqueId}`,
        regId: reg.id,
      };

      return { status: 'YES_CONFIRMED', registration: updatedReg };
    } else {
      await tx.confirmationToken.update({
        where: { id: tokenRecord.id },
        data: {
          responseStatus: TokenResponseStatus.NO,
          respondedAt: new Date(),
        },
      });

      const updatedReg = await tx.registration.update({
        where: { id: reg.id },
        data: {
          status: RegistrationStatus.CANCELLED,
          confirmationDeadline: null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CONFIRMATION_NO_CANCELLED',
          registrationId: reg.id,
        },
      });

      emailToEnqueue = {
        type: 'CANCELLATION',
        to: reg.email,
        subject: `Registration Cancelled for ${eventName}`,
        payload: {
          recipientEmail: reg.email,
          studentName: reg.fullName,
          eventName,
          reason: 'User declined seat allocation',
        },
        key: `cancel_${reg.id}`,
        regId: reg.id,
      };

      shouldTriggerPromotion = true;

      return { status: 'NO_CANCELLED', registration: updatedReg };
    }
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

  if (shouldTriggerPromotion) {
    promoteNextInQueue().catch((err) =>
      console.error('[QUEUE SERVICE] Error during auto-promotion:', err)
    );
  }

  return result;
}
