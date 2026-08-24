import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/prisma';
import {
  registerStudentService,
  processConfirmationToken,
  promoteNextInQueue,
  getEventConfig,
} from '../src/services/queueService';
import { runExpirationCheck } from '../src/services/expirationWorker';
import { RegistrationStatus, TokenResponseStatus } from '../src/types';

describe('Event Registration & Queue System Business Logic Tests', () => {
  beforeAll(async () => {
    // Reset database state before running test suite
    await prisma.attendance.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.confirmationToken.deleteMany();
    await prisma.emailJob.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.eventConfig.deleteMany();

    // Set capacity to 2 for fast capacity & queue testing
    await prisma.eventConfig.create({
      data: {
        name: 'Test Symposium',
        totalCapacity: 2,
        confirmationWindowHours: 24,
        queueConfirmationWindowHours: 1,
        registrationOpen: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Registration #1 should be allocated seat (CONFIRMATION_PENDING)', async () => {
    const reg1 = await registerStudentService({
      fullName: 'Alice Student',
      email: 'alice@test.edu',
      phone: '1234567890',
      enrollmentNumber: 'ENR-001',
      college: 'Engineering',
      course: 'CS',
      semester: '1',
      division: 'A',
    });

    expect(reg1.status).toBe(RegistrationStatus.CONFIRMATION_PENDING);
    expect(reg1.queuePosition).toBeNull();
    expect(reg1.confirmationDeadline).not.toBeNull();
  });

  it('2. Registration #2 should also be allocated seat (Capacity = 2)', async () => {
    const reg2 = await registerStudentService({
      fullName: 'Bob Student',
      email: 'bob@test.edu',
      phone: '1234567891',
      enrollmentNumber: 'ENR-002',
      college: 'Engineering',
      course: 'CS',
      semester: '1',
      division: 'A',
    });

    expect(reg2.status).toBe(RegistrationStatus.CONFIRMATION_PENDING);
    expect(reg2.queuePosition).toBeNull();
  });

  it('3. Registration #3 beyond capacity should enter QUEUED status with position #1', async () => {
    const reg3 = await registerStudentService({
      fullName: 'Charlie Queue',
      email: 'charlie@test.edu',
      phone: '1234567892',
      enrollmentNumber: 'ENR-003',
      college: 'Engineering',
      course: 'CS',
      semester: '1',
      division: 'A',
    });

    expect(reg3.status).toBe(RegistrationStatus.QUEUED);
    expect(reg3.queuePosition).toBe(1);
  });

  it('4. Duplicate registration email/enrollment should throw error', async () => {
    await expect(
      registerStudentService({
        fullName: 'Duplicate Student',
        email: 'alice@test.edu', // duplicate email
        phone: '9999999999',
        enrollmentNumber: 'ENR-999',
        college: 'Engineering',
        course: 'CS',
        semester: '1',
        division: 'A',
      })
    ).rejects.toThrow('already registered');
  });

  it('5. Confirming YES should generate Unique ID and QR token', async () => {
    const alice = await prisma.registration.findUnique({
      where: { email: 'alice@test.edu' },
      include: { confirmationTokens: true },
    });

    const token = alice?.confirmationTokens[0].token;
    expect(token).toBeDefined();

    const result = await processConfirmationToken(token!, 'yes');
    expect(result.status).toBe('YES_CONFIRMED');
    expect(result.registration.status).toBe(RegistrationStatus.CONFIRMED);
    expect(result.registration.uniqueId).toMatch(/^MSC26-\d{4}$/);
    expect(result.registration.qrCodeToken).toBeDefined();
  });

  it('6. Clicking token again after processing should throw TOKEN_ALREADY_USED', async () => {
    const alice = await prisma.registration.findUnique({
      where: { email: 'alice@test.edu' },
      include: { confirmationTokens: true },
    });

    const token = alice?.confirmationTokens[0].token;
    await expect(processConfirmationToken(token!, 'yes')).rejects.toThrow('TOKEN_ALREADY_USED');
  });

  it('7. Confirming NO should cancel seat and promote next in queue (Charlie)', async () => {
    const bob = await prisma.registration.findUnique({
      where: { email: 'bob@test.edu' },
      include: { confirmationTokens: true },
    });

    const token = bob?.confirmationTokens[0].token;
    const result = await processConfirmationToken(token!, 'no');

    expect(result.status).toBe('NO_CANCELLED');
    expect(result.registration.status).toBe(RegistrationStatus.CANCELLED);

    // Wait a brief moment for queue promotion trigger
    await new Promise((r) => setTimeout(r, 200));

    const charlie = await prisma.registration.findUnique({
      where: { email: 'charlie@test.edu' },
    });

    expect(charlie?.status).toBe(RegistrationStatus.PROMOTED);
  });

  it('8. Expiration worker should expire unconfirmed token and release seat', async () => {
    // Manually force Charlie's deadline into the past
    const charlie = await prisma.registration.findUnique({
      where: { email: 'charlie@test.edu' },
    });

    await prisma.registration.update({
      where: { id: charlie!.id },
      data: {
        confirmationDeadline: new Date(Date.now() - 10000),
      },
    });

    await runExpirationCheck();

    const charlieAfter = await prisma.registration.findUnique({
      where: { email: 'charlie@test.edu' },
    });

    expect(charlieAfter?.status).toBe(RegistrationStatus.EXPIRED);
  });
});
