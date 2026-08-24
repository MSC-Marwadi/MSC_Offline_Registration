import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { RegistrationStatus, TokenResponseStatus } from '../types';
import { promoteNextInQueue, getEventConfig, registerStudentService, updateRegistrationWithStatusLogic } from '../services/queueService';
import { enqueueEmail } from '../services/emailQueue';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-msc-event-key-change-in-production';

/**
 * POST /api/admin/login
 */
export async function loginAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    let admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Default admin creation if none exists in DB
    if (!admin && email.toLowerCase().trim() === 'admin@msc.edu') {
      const defaultHash = await bcrypt.hash('Admin@MSC2026', 10);
      admin = await prisma.admin.create({
        data: {
          email: 'admin@msc.edu',
          passwordHash: defaultHash,
          name: 'MSC System Admin',
          role: 'ADMIN',
        },
      });
    }

    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      return;
    }

    const payload = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] login error:', error);
    res.status(500).json({ success: false, message: 'Admin login failed.' });
  }
}

/**
 * GET /api/admin/me
 */
export async function getAdminMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    admin: req.admin,
  });
}

/**
 * POST /api/admin/logout
 */
export async function logoutAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.clearCookie('adminToken');
  res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * GET /api/admin/stats
 * Real database statistics only — NO fake or mock data!
 */
export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const config = await getEventConfig();

    const [totalRegistrations, confirmed, pending, queue, cancelled, expired, present] =
      await Promise.all([
        prisma.registration.count(),
        prisma.registration.count({ where: { status: RegistrationStatus.CONFIRMED } }),
        prisma.registration.count({
          where: {
            status: { in: [RegistrationStatus.CONFIRMATION_PENDING, RegistrationStatus.PROMOTED] },
          },
        }),
        prisma.registration.count({ where: { status: RegistrationStatus.QUEUED } }),
        prisma.registration.count({ where: { status: RegistrationStatus.CANCELLED } }),
        prisma.registration.count({ where: { status: RegistrationStatus.EXPIRED } }),
        prisma.registration.count({ where: { status: RegistrationStatus.PRESENT } }),
      ]);

    const totalAllocated = confirmed + pending + present;
    const remainingSeats = Math.max(0, config.totalCapacity - totalAllocated);

    res.json({
      success: true,
      stats: {
        totalCapacity: config.totalCapacity,
        totalRegistrations,
        confirmed,
        pending,
        queue,
        cancelled,
        expired,
        present,
        remainingSeats,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] getDashboardStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard statistics.' });
  }
}

/**
 * GET /api/admin/registrations
 * Searchable, filterable list of registrations
 */
export async function getRegistrations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, status, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      whereClause.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { enrollmentNumber: { contains: q, mode: 'insensitive' } },
        { uniqueId: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where: whereClause }),
      prisma.registration.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          attendance: true,
          confirmationTokens: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      registrations,
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] getRegistrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
  }
}

/**
 * GET /api/admin/queue
 */
export async function getQueueList(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const queueList = await prisma.registration.findMany({
      where: { status: RegistrationStatus.QUEUED },
      orderBy: [{ queuePosition: 'asc' }, { createdAt: 'asc' }],
    });

    res.json({
      success: true,
      count: queueList.length,
      queue: queueList,
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] getQueueList error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch queue list.' });
  }
}

/**
 * POST /api/admin/attendance/scan
 * Scans QR token or Unique ID and updates attendance status safely
 */
export async function scanAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, message: 'QR Code or Unique ID is required.' });
      return;
    }

    const trimmed = code.trim();

    // Look up registration by QR token OR Unique ID
    const reg = await prisma.registration.findFirst({
      where: {
        OR: [
          { qrCodeToken: trimmed },
          { uniqueId: trimmed.toUpperCase() },
          { id: trimmed },
        ],
      },
      include: {
        attendance: true,
      },
    });

    if (!reg) {
      res.status(404).json({ success: false, message: 'Invalid QR Code or Unique ID. Registration not found.' });
      return;
    }

    // Check duplicate scan protection first
    if (reg.attendance || reg.status === RegistrationStatus.PRESENT) {
      const firstScanTime = reg.attendance?.scannedAt || reg.updatedAt;

      res.status(200).json({
        success: true,
        alreadyScanned: true,
        message: 'Already Marked Present',
        student: {
          fullName: reg.fullName,
          email: reg.email,
          enrollmentNumber: reg.enrollmentNumber,
          uniqueId: reg.uniqueId,
          firstScannedAt: firstScanTime,
          scannedBy: reg.attendance?.scannedBy || 'Admin System',
        },
      });
      return;
    }

    // Check if status is CONFIRMED
    if (reg.status !== RegistrationStatus.CONFIRMED) {
      res.status(400).json({
        success: false,
        message: `Cannot mark attendance. Registration status is currently: ${reg.status}`,
      });
      return;
    }

    // Process attendance inside transaction
    const now = new Date();
    const adminName = req.admin?.name || req.admin?.email || 'Admin';

    await prisma.$transaction(async (tx) => {
      await tx.attendance.create({
        data: {
          registrationId: reg.id,
          scannedAt: now,
          scannedBy: adminName,
          method: 'QR_SCAN',
        },
      });

      await tx.registration.update({
        where: { id: reg.id },
        data: { status: RegistrationStatus.PRESENT },
      });

      await tx.auditLog.create({
        data: {
          action: 'ATTENDANCE_MARKED',
          registrationId: reg.id,
          adminId: req.admin?.adminId,
          metadata: JSON.stringify({ scannedBy: adminName, method: 'QR_SCAN', time: now }),
        },
      });
    });

    res.json({
      success: true,
      alreadyScanned: false,
      message: 'Attendance Marked Successfully',
      student: {
        fullName: reg.fullName,
        email: reg.email,
        enrollmentNumber: reg.enrollmentNumber,
        uniqueId: reg.uniqueId,
        scannedAt: now,
        scannedBy: adminName,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] scanAttendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to process attendance scan.' });
  }
}

/**
 * GET /api/admin/attendance
 */
export async function getAttendanceList(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const list = await prisma.attendance.findMany({
      orderBy: { scannedAt: 'desc' },
      include: {
        registration: true,
      },
    });

    res.json({
      success: true,
      count: list.length,
      attendance: list,
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] getAttendanceList error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendance list.' });
  }
}

/**
 * POST /api/admin/attendance/undo
 */
export async function undoAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      res.status(400).json({ success: false, message: 'Registration ID is required.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({
        where: { registrationId },
      });

      await tx.registration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CONFIRMED },
      });

      await tx.auditLog.create({
        data: {
          action: 'ATTENDANCE_UNDO',
          registrationId,
          adminId: req.admin?.adminId,
        },
      });
    });

    res.json({ success: true, message: 'Attendance record reverted to CONFIRMED status.' });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] undoAttendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to undo attendance.' });
  }
}

/**
 * POST /api/admin/registration/cancel
 */
export async function adminCancelRegistration(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { registrationId, reason } = req.body;

    if (!registrationId) {
      res.status(400).json({ success: false, message: 'Registration ID is required.' });
      return;
    }

    const reg = await prisma.registration.findUnique({ where: { id: registrationId } });
    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    await updateRegistrationWithStatusLogic(
      registrationId,
      { status: RegistrationStatus.CANCELLED },
      (req as any).admin?.adminId
    );

    res.json({ success: true, message: 'Registration cancelled, notification email sent, and queue promotion triggered.' });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] adminCancelRegistration error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel registration.' });
  }
}

/**
 * DELETE /api/admin/registration/:id
 * Permanently delete a student registration entry from the database
 */
export async function adminDeleteRegistration(req: any, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, message: 'Registration ID parameter is required.' });
      return;
    }

    const reg = await prisma.registration.findUnique({ where: { id } });
    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration entry not found.' });
      return;
    }

    const hadSeat = [
      RegistrationStatus.CONFIRMED,
      RegistrationStatus.CONFIRMATION_PENDING,
      RegistrationStatus.PRESENT,
      RegistrationStatus.PROMOTED,
    ].includes(reg.status as any);

    await prisma.registration.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_DELETED_REGISTRATION',
        adminId: req.admin?.adminId,
        metadata: JSON.stringify({ deletedStudentName: reg.fullName, deletedStudentEmail: reg.email }),
      },
    });

    if (hadSeat) {
      promoteNextInQueue().catch((err) =>
        console.error('[ADMIN CONTROLLER] Queue promotion error after admin delete:', err)
      );
    }

    res.json({ success: true, message: `Registration entry for ${reg.fullName} permanently deleted.` });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] adminDeleteRegistration error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete registration entry.' });
  }
}

/**
 * POST /api/admin/registration/create
 * Admin manual creation of a student registration
 */
export async function adminCreateRegistration(req: any, res: Response): Promise<void> {
  try {
    const { fullName, email, enrollmentNumber, grNumber, department, status, additionalInfo } = req.body;

    if (!fullName || !email || !enrollmentNumber || !grNumber || !department) {
      res.status(400).json({ success: false, message: 'Full Name, Email, Enrollment Number, GR Number, and Department are required.' });
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

    if (status && status !== reg.status) {
      await updateRegistrationWithStatusLogic(
        reg.id,
        { status },
        req.admin?.adminId
      );
    }

    res.status(201).json({ success: true, message: 'Registration created successfully.', registration: reg });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] adminCreateRegistration error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create registration.' });
  }
}

/**
 * PUT /api/admin/registration/update
 * Admin manual update of student registration details
 */
export async function adminUpdateRegistration(req: any, res: Response): Promise<void> {
  try {
    const { registrationId, fullName, email, enrollmentNumber, grNumber, department, status, additionalInfo } = req.body;

    if (!registrationId) {
      res.status(400).json({ success: false, message: 'Registration ID is required.' });
      return;
    }

    const updated = await updateRegistrationWithStatusLogic(
      registrationId,
      {
        fullName,
        email,
        enrollmentNumber,
        grNumber,
        department,
        status,
        additionalInfo,
      },
      req.admin?.adminId
    );

    res.json({ success: true, message: 'Registration details updated successfully.', registration: updated });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] adminUpdateRegistration error:', error);
    res.status(500).json({ success: false, message: 'Failed to update registration.' });
  }
}

/**
 * POST /api/admin/queue/promote-manual
 */
export async function adminPromoteQueueStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const promoted = await promoteNextInQueue();
    if (!promoted) {
      res.status(400).json({ success: false, message: 'No queued student available or capacity is full.' });
      return;
    }

    res.json({
      success: true,
      message: `Promoted student ${promoted.fullName} (${promoted.email}). Confirmation email sent.`,
      promoted,
    });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] adminPromoteQueueStudent error:', error);
    res.status(500).json({ success: false, message: 'Failed to promote queued student.' });
  }
}

/**
 * POST /api/admin/resend-email
 */
export async function resendEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { registrationId } = req.body;
    const reg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { confirmationTokens: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!reg) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const config = await getEventConfig();
    const eventName = config.name;
    const eventDateStr = config.eventDate.toLocaleString('en-US');
    const venueStr = config.venue;

    if (reg.status === RegistrationStatus.CONFIRMED || reg.status === RegistrationStatus.PRESENT) {
      if (!reg.uniqueId || !reg.qrCodeToken) {
        res.status(400).json({ success: false, message: 'No Unique ID generated for this registration.' });
        return;
      }

      await enqueueEmail(
        'FINAL_CONFIRMATION',
        reg.email,
        `Resent Ticket [${reg.uniqueId}] for ${eventName}`,
        {
          recipientEmail: reg.email,
          studentName: reg.fullName,
          eventName,
          eventDate: eventDateStr,
          venue: venueStr,
          uniqueId: reg.uniqueId,
          qrToken: reg.qrCodeToken,
        },
        `resend_final_${reg.id}_${Date.now()}`,
        reg.id
      );
    } else if (
      reg.status === RegistrationStatus.CONFIRMATION_PENDING ||
      reg.status === RegistrationStatus.PROMOTED
    ) {
      const latestToken = reg.confirmationTokens[0];
      if (!latestToken) {
        res.status(400).json({ success: false, message: 'No confirmation token found.' });
        return;
      }

      await enqueueEmail(
        'CONFIRMATION_REQUIRED',
        reg.email,
        `[Resent] Confirm Registration for ${eventName}`,
        {
          recipientEmail: reg.email,
          studentName: reg.fullName,
          eventName,
          eventDate: eventDateStr,
          venue: venueStr,
          token: latestToken.token,
          deadlineFormatted: latestToken.expiresAt.toLocaleString('en-US'),
        },
        `resend_token_${reg.id}_${Date.now()}`,
        reg.id
      );
    } else {
      res.status(400).json({ success: false, message: `Cannot resend email for status: ${reg.status}` });
      return;
    }

    res.json({ success: true, message: 'Email job enqueued for delivery.' });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] resendEmail error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend email.' });
  }
}

/**
 * GET /api/admin/settings
 */
export async function getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const config = await getEventConfig();
    res.json({ success: true, settings: config });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load settings.' });
  }
}

/**
 * PUT /api/admin/settings
 */
export async function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      name,
      description,
      eventDate,
      venue,
      totalCapacity,
      confirmationWindowHours,
      queueConfirmationWindowHours,
      registrationOpen,
    } = req.body;

    const existingConfig = await getEventConfig();

    const updated = await prisma.eventConfig.update({
      where: { id: existingConfig.id },
      data: {
        name: name || existingConfig.name,
        description: description || existingConfig.description,
        eventDate: eventDate ? new Date(eventDate) : existingConfig.eventDate,
        venue: venue || existingConfig.venue,
        totalCapacity: totalCapacity ? parseInt(totalCapacity, 10) : existingConfig.totalCapacity,
        confirmationWindowHours: confirmationWindowHours
          ? parseInt(confirmationWindowHours, 10)
          : existingConfig.confirmationWindowHours,
        queueConfirmationWindowHours: queueConfirmationWindowHours
          ? parseInt(queueConfirmationWindowHours, 10)
          : existingConfig.queueConfirmationWindowHours,
        registrationOpen: typeof registrationOpen === 'boolean' ? registrationOpen : existingConfig.registrationOpen,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'EVENT_SETTINGS_UPDATED',
        adminId: req.admin?.adminId,
        metadata: JSON.stringify(updated),
      },
    });

    res.json({ success: true, message: 'Event settings updated successfully.', settings: updated });
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] updateSettings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event settings.' });
  }
}

/**
 * GET /api/admin/audit-logs
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: {
        registration: {
          select: { fullName: true, email: true, uniqueId: true },
        },
      },
    });

    res.json({ success: true, auditLogs: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
}

/**
 * GET /api/admin/export/registrations
 */
export async function exportRegistrationsCSV(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const list = await prisma.registration.findMany({
      orderBy: { createdAt: 'asc' },
      include: { attendance: true },
    });

    let csv = 'Unique ID,Full Name,Email,Enrollment Number,GR Number,Department,Additional Info,Status,Queue Position,Registration Time,Attendance Status,Scanned Time\n';

    for (const r of list) {
      const uid = r.uniqueId || 'N/A';
      const name = `"${r.fullName.replace(/"/g, '""')}"`;
      const email = r.email;
      const enr = r.enrollmentNumber;
      const grNo = r.grNumber || 'N/A';
      const dept = r.department || 'N/A';
      const addInfo = r.additionalInfo ? `"${r.additionalInfo.replace(/"/g, '""')}"` : 'N/A';
      const status = r.status;
      const queuePos = r.queuePosition !== null ? r.queuePosition : 'N/A';
      const regTime = r.createdAt.toISOString();
      const attStatus = r.attendance ? 'PRESENT' : 'ABSENT';
      const attTime = r.attendance ? r.attendance.scannedAt.toISOString() : 'N/A';

      csv += `${uid},${name},${email},${enr},${grNo},${dept},${addInfo},${status},${queuePos},${regTime},${attStatus},${attTime}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="msc_registrations.csv"');
    res.send(csv);
  } catch (error: any) {
    console.error('[ADMIN CONTROLLER] exportRegistrationsCSV error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
}
