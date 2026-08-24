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
        name: 'Code To Cloud',
        description: `Join the Microsoft Student Community at Marwadi University for a hands-on workshop where you’ll learn how to build and deploy your first website using Microsoft Azure.

No prior cloud experience is required—just bring your curiosity and a charged laptop with VS Code installed.

What you’ll get:
💰 $100 Azure credit
🌐 Build and deploy your own live website
🏆 Prizes for top scorers
📜 Certificate for everyone
📢 Opportunity to be featured on official channels`,
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
        venue: 'Main University Auditorium',
        totalCapacity: 100,
        confirmationWindowHours: 24,
        queueConfirmationWindowHours: 1,
        registrationOpen: true,
      },
    });
  } else if (config.name !== 'Code To Cloud') {
    // Automatically update existing config to Code To Cloud
    config = await prisma.eventConfig.update({
      where: { id: config.id },
      data: {
        name: 'Code To Cloud',
        description: `Join the Microsoft Student Community at Marwadi University for a hands-on workshop where you’ll learn how to build and deploy your first website using Microsoft Azure.

No prior cloud experience is required—just bring your curiosity and a charged laptop with VS Code installed.

What you’ll get:
💰 $100 Azure credit
🌐 Build and deploy your own live website
🏆 Prizes for top scorers
📜 Certificate for everyone
📢 Opportunity to be featured on official channels`,
      },
    });
  }
  return config;
}

/**
 * Atomically re-indexes all QUEUED students by creation timestamp (1, 2, 3...)
 * to guarantee zero duplicate queue positions and zero gaps.
 */
export async function reindexQueuePositions(tx: Prisma.TransactionClient): Promise<void> {
  const queuedStudents = await tx.registration.findMany({
    where: { status: RegistrationStatus.QUEUED },
    orderBy: { createdAt: 'asc' },
  });

  for (let i = 0; i < queuedStudents.length; i++) {
    const student = queuedStudents[i];
    const correctPos = i + 1;
    if (student.queuePosition !== correctPos) {
      await tx.registration.update({
        where: { id: student.id },
        data: { queuePosition: correctPos },
      });
    }
  }
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
        queuePosition: null,
        confirmationDeadline: confirmationDeadline,
      },
    });

    if (newStatus === RegistrationStatus.QUEUED) {
      await reindexQueuePositions(tx);
      const reindexed = await tx.registration.findUnique({ where: { id: createdReg.id } });
      queuePosition = reindexed?.queuePosition || 1;
    }

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

    // Generate Unique ID & QR Token for Direct Confirmation
    const uniqueId = await generateNextUniqueId(tx);
    const qrCodeToken = `QR-${uniqueId}-${crypto.randomBytes(16).toString('hex')}`;

    // Update promoted registration directly to CONFIRMED
    const updated = await tx.registration.update({
      where: { id: nextQueued.id },
      data: {
        status: RegistrationStatus.CONFIRMED,
        uniqueId: uniqueId,
        qrCodeToken: qrCodeToken,
        queuePosition: null,
        confirmationDeadline: null,
      },
    });

    // Re-index remaining queued students atomically
    await reindexQueuePositions(tx);

    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'QUEUE_PROMOTED_CONFIRMED',
        registrationId: updated.id,
        metadata: JSON.stringify({ uniqueId, action: 'PROMOTED_DIRECTLY' }),
      },
    });

    const eventName = config?.name || 'MSC Tech Event';
    const eventDateStr = config?.eventDate ? new Date(config.eventDate).toLocaleString('en-US') : 'TBD';
    const venueStr = config?.venue || 'Main Auditorium';

    emailToEnqueue = {
      type: 'FINAL_CONFIRMATION',
      to: updated.email,
      subject: `Confirmed Ticket [${uniqueId}] for ${eventName}`,
      payload: {
        recipientEmail: updated.email,
        studentName: updated.fullName,
        eventName,
        eventDate: eventDateStr,
        venue: venueStr,
        uniqueId,
        qrToken: qrCodeToken,
      },
      key: `promo_final_${updated.id}_${uniqueId}`,
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

/**
 * Updates a registration's details and triggers all status transition side-effects 
 * (email notifications, unique ID generation, ticket passes, queue promotions).
 */
export async function updateRegistrationWithStatusLogic(
  id: string,
  updateFields: {
    fullName?: string;
    email?: string;
    enrollmentNumber?: string;
    grNumber?: string;
    department?: string;
    status?: RegistrationStatus;
    additionalInfo?: string;
  },
  adminId?: string
) {
  let emailToEnqueue: any = null;
  let triggerQueuePromotion = false;

  const updatedReg = await prisma.$transaction(async (tx) => {
    const existing = await tx.registration.findUnique({ where: { id } });
    if (!existing) throw new Error('Registration not found.');

    const oldStatus = existing.status;
    const newStatus = updateFields.status || oldStatus;
    const config = await tx.eventConfig.findFirst();
    const eventName = config?.name || 'MSC Tech Event';
    const eventDateStr = config?.eventDate ? new Date(config.eventDate).toLocaleString('en-US') : 'TBD';
    const venueStr = config?.venue || 'Main Auditorium';

    let uniqueId = existing.uniqueId;
    let qrCodeToken = existing.qrCodeToken;
    let queuePosition = existing.queuePosition;
    let confirmationDeadline = existing.confirmationDeadline;

    // Check if status has changed
    if (newStatus !== oldStatus) {
      const hadSeat = [
        RegistrationStatus.CONFIRMED,
        RegistrationStatus.CONFIRMATION_PENDING,
        RegistrationStatus.PRESENT,
        RegistrationStatus.PROMOTED,
      ].includes(oldStatus as any);

      if (newStatus === RegistrationStatus.CONFIRMED) {
        if (!uniqueId) {
          uniqueId = await generateNextUniqueId(tx);
        }
        if (!qrCodeToken) {
          qrCodeToken = `QR-${uniqueId}-${crypto.randomBytes(16).toString('hex')}`;
        }
        queuePosition = null;
        confirmationDeadline = null;

        emailToEnqueue = {
          type: 'FINAL_CONFIRMATION',
          to: updateFields.email || existing.email,
          subject: `Confirmed Ticket Pass [${uniqueId}] for ${eventName}`,
          payload: {
            recipientEmail: updateFields.email || existing.email,
            studentName: updateFields.fullName || existing.fullName,
            eventName,
            eventDate: eventDateStr,
            venue: venueStr,
            uniqueId,
            qrToken: qrCodeToken,
          },
          key: `status_confirm_${id}_${uniqueId}`,
          regId: id,
        };
      } else if (newStatus === RegistrationStatus.CANCELLED || newStatus === RegistrationStatus.EXPIRED) {
        queuePosition = null;
        confirmationDeadline = null;

        emailToEnqueue = {
          type: 'CANCELLATION',
          to: updateFields.email || existing.email,
          subject: `Registration Status Update for ${eventName}`,
          payload: {
            recipientEmail: updateFields.email || existing.email,
            studentName: updateFields.fullName || existing.fullName,
            eventName,
            reason: `Status updated to ${newStatus}`,
          },
          key: `status_cancel_${id}`,
          regId: id,
        };

        if (hadSeat) {
          triggerQueuePromotion = true;
        }
      } else if (newStatus === RegistrationStatus.QUEUED) {
        uniqueId = null;
        qrCodeToken = null;
        confirmationDeadline = null;

        emailToEnqueue = {
          type: 'QUEUE_NOTICE',
          to: updateFields.email || existing.email,
          subject: `Queue Status Notice for ${eventName}`,
          payload: {
            recipientEmail: updateFields.email || existing.email,
            studentName: updateFields.fullName || existing.fullName,
            eventName,
            queuePosition: 1,
          },
          key: `status_queue_${id}_${Date.now()}`,
          regId: id,
        };

        if (hadSeat) {
          triggerQueuePromotion = true;
        }
      } else if (newStatus === RegistrationStatus.CONFIRMATION_PENDING || newStatus === RegistrationStatus.PROMOTED) {
        const windowHours = config ? config.confirmationWindowHours : 24;
        confirmationDeadline = new Date(Date.now() + windowHours * 60 * 60 * 1000);
        const tokenString = crypto.randomBytes(32).toString('hex');

        await tx.confirmationToken.create({
          data: {
            registrationId: id,
            token: tokenString,
            expiresAt: confirmationDeadline,
            responseStatus: TokenResponseStatus.PENDING,
          },
        });

        const deadlineStr = confirmationDeadline.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

        emailToEnqueue = {
          type: 'CONFIRMATION_REQUIRED',
          to: updateFields.email || existing.email,
          subject: `[Action Required] Confirm Registration for ${eventName}`,
          payload: {
            recipientEmail: updateFields.email || existing.email,
            studentName: updateFields.fullName || existing.fullName,
            eventName,
            eventDate: eventDateStr,
            venue: venueStr,
            token: tokenString,
            deadlineFormatted: deadlineStr,
          },
          key: `status_pending_${id}`,
          regId: id,
        };
      }
    }

    const updated = await tx.registration.update({
      where: { id },
      data: {
        ...(updateFields.fullName && { fullName: updateFields.fullName.trim() }),
        ...(updateFields.email && { email: updateFields.email.toLowerCase().trim() }),
        ...(updateFields.enrollmentNumber && { enrollmentNumber: updateFields.enrollmentNumber.trim() }),
        ...(updateFields.grNumber && { grNumber: updateFields.grNumber.trim() }),
        ...(updateFields.department && { department: updateFields.department.trim() }),
        status: newStatus,
        uniqueId,
        qrCodeToken,
        queuePosition,
        confirmationDeadline,
        ...(updateFields.additionalInfo !== undefined && { additionalInfo: updateFields.additionalInfo }),
      },
    });

    // Always run atomic queue re-indexing to ensure 100% accurate 1,2,3... positions
    await reindexQueuePositions(tx);

    const reindexedStudent = await tx.registration.findUnique({ where: { id } });

    if (newStatus === RegistrationStatus.QUEUED && reindexedStudent && emailToEnqueue && emailToEnqueue.type === 'QUEUE_NOTICE') {
      const qPos = reindexedStudent.queuePosition || 1;
      emailToEnqueue.payload.queuePosition = qPos;
      emailToEnqueue.subject = `Queue Status: #${qPos} for ${eventName}`;
    }

    await tx.auditLog.create({
      data: {
        action: 'ADMIN_REGISTRATION_STATUS_UPDATED',
        registrationId: id,
        adminId,
        metadata: JSON.stringify({ oldStatus, newStatus, updatedFields: Object.keys(updateFields) }),
      },
    });

    // If status didn't change but details were updated, enqueue REGISTRATION_UPDATED email
    if (!emailToEnqueue) {
      emailToEnqueue = {
        type: 'REGISTRATION_UPDATED',
        to: updated.email,
        subject: `[Updated] Registration Details for ${eventName}`,
        payload: {
          recipientEmail: updated.email,
          studentName: updated.fullName,
          eventName,
          eventDate: eventDateStr,
          venue: venueStr,
          enrollmentNumber: updated.enrollmentNumber,
          grNumber: updated.grNumber,
          department: updated.department,
          status: updated.status,
          uniqueId: updated.uniqueId,
        },
        key: `update_${id}_${Date.now()}`,
        regId: id,
      };
    }

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

  if (triggerQueuePromotion) {
    promoteNextInQueue().catch((err) =>
      console.error('[STATUS TRANSITION] Queue promotion error:', err)
    );
  }

  return updatedReg;
}
