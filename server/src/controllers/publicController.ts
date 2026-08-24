import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { getEventConfig, registerStudentService, processConfirmationToken } from '../services/queueService';
import { RegistrationStatus } from '../types';

/**
 * GET /api/public/event-info
 * Returns event details & REAL database statistics (capacity, confirmed count, queue count, remaining seats)
 */
export async function getEventInfo(req: Request, res: Response): Promise<void> {
  try {
    const config = await getEventConfig();

    const confirmedCount = await prisma.registration.count({
      where: {
        status: {
          in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PRESENT],
        },
      },
    });

    const pendingConfirmationCount = await prisma.registration.count({
      where: {
        status: {
          in: [RegistrationStatus.CONFIRMATION_PENDING, RegistrationStatus.PROMOTED],
        },
      },
    });

    const queueCount = await prisma.registration.count({
      where: {
        status: RegistrationStatus.QUEUED,
      },
    });

    const totalAllocated = confirmedCount + pendingConfirmationCount;
    const availableSeats = Math.max(0, config.totalCapacity - totalAllocated);

    res.json({
      success: true,
      event: {
        name: config.name,
        description: config.description,
        eventDate: config.eventDate,
        venue: config.venue,
        totalCapacity: config.totalCapacity,
        confirmedCount,
        pendingConfirmationCount,
        queueCount,
        availableSeats,
        registrationOpen: config.registrationOpen,
      },
    });
  } catch (error: any) {
    console.error('[PUBLIC CONTROLLER] getEventInfo error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve event information.' });
  }
}

/**
 * POST /api/public/register
 * Handles student registration submission
 */
export async function registerStudent(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, enrollmentNumber, grNumber, department, additionalInfo } = req.body;

    // Field Validation
    if (!fullName || !email || !enrollmentNumber || !grNumber || !department) {
      res.status(400).json({ success: false, message: 'Full Name, Email, Enrollment Number, GR Number, and Department are required.' });
      return;
    }

    // Enrollment Number validation (exactly 11 digits)
    const enrollmentRegex = /^\d{11}$/;
    if (!enrollmentRegex.test(enrollmentNumber.trim())) {
      res.status(400).json({ success: false, message: 'Enrollment Number must be exactly 11 digits.' });
      return;
    }

    // GR Number validation (exactly 6 digits)
    const grRegex = /^\d{6}$/;
    if (!grRegex.test(grNumber.trim())) {
      res.status(400).json({ success: false, message: 'GR Number must be exactly 6 digits.' });
      return;
    }

    // Email domain validation (@marwadiuniversity.ac.in)
    const marwadiEmailRegex = /^[a-zA-Z0-9._%+-]+@marwadiuniversity\.ac\.in$/i;
    if (!marwadiEmailRegex.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Email address must end with @marwadiuniversity.ac.in' });
      return;
    }

    // Department validation
    const validDepartments = ['CE', 'AI', 'ICT', 'IT', 'MCA', 'BCA'];
    if (!validDepartments.includes(department.trim())) {
      res.status(400).json({ success: false, message: 'Please select a valid department (CE, AI, ICT, IT, MCA, BCA).' });
      return;
    }

    const reg = await registerStudentService({
      fullName,
      email,
      enrollmentNumber,
      grNumber,
      department,
      additionalInfo,
    });

    res.status(201).json({
      success: true,
      message:
        reg.status === RegistrationStatus.CONFIRMATION_PENDING
          ? 'Registration submitted! Please check your email to confirm your seat.'
          : `Registration submitted! You are #${reg.queuePosition} in the queue.`,
      registration: {
        id: reg.id,
        fullName: reg.fullName,
        email: reg.email,
        status: reg.status,
        queuePosition: reg.queuePosition,
        confirmationDeadline: reg.confirmationDeadline,
      },
    });
  } catch (error: any) {
    console.error('[PUBLIC CONTROLLER] registerStudent error:', error.message);
    res.status(400).json({ success: false, message: error.message || 'Registration failed.' });
  }
}

export async function handleConfirmToken(req: Request, res: Response): Promise<void> {
  try {
    const { token, response } = req.params;

    if (!token || (response !== 'yes' && response !== 'no')) {
      res.status(400).json({ success: false, message: 'Invalid confirmation request parameters.' });
      return;
    }

    const tokenStr = typeof token === 'string' ? token : String(token);
    const result = await processConfirmationToken(tokenStr, response as 'yes' | 'no');

    res.json({
      success: true,
      status: result.status,
      studentName: result.registration.fullName,
      uniqueId: result.registration.uniqueId,
      message:
        result.status === 'YES_CONFIRMED'
          ? 'Thank you! Your attendance has been confirmed. Entry ticket & QR code sent to your email.'
          : 'Your seat allocation has been cancelled. Thank you for letting us know.',
    });
  } catch (error: any) {
    console.error('[PUBLIC CONTROLLER] handleConfirmToken error:', error.message);

    if (error.message === 'INVALID_TOKEN') {
      res.status(404).json({ success: false, message: 'Invalid or non-existent confirmation link.' });
    } else if (error.message === 'TOKEN_ALREADY_USED') {
      res.status(400).json({ success: false, message: 'This confirmation link has already been used.' });
    } else if (error.message === 'TOKEN_EXPIRED') {
      res.status(400).json({ success: false, message: 'This confirmation link has expired.' });
    } else {
      res.status(500).json({ success: false, message: 'Error processing confirmation response.' });
    }
  }
}

/**
 * GET /api/public/check-status?query=...
 * Check registration status by email or enrollment number
 */
export async function checkRegistrationStatus(req: Request, res: Response): Promise<void> {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'Please provide an email or enrollment number.' });
      return;
    }

    const searchStr = (query as string).trim().toLowerCase();

    const reg = await prisma.registration.findFirst({
      where: {
        OR: [
          { email: searchStr },
          { enrollmentNumber: searchStr },
          { uniqueId: searchStr.toUpperCase() },
        ],
      },
      select: {
        fullName: true,
        email: true,
        enrollmentNumber: true,
        status: true,
        queuePosition: true,
        confirmationDeadline: true,
        uniqueId: true,
        createdAt: true,
        attendance: {
          select: {
            scannedAt: true,
          },
        },
      },
    });

    if (!reg) {
      res.status(404).json({ success: false, message: 'No registration record found.' });
      return;
    }

    res.json({
      success: true,
      registration: reg,
    });
  } catch (error: any) {
    console.error('[PUBLIC CONTROLLER] checkRegistrationStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to query registration status.' });
  }
}
