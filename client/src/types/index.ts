export type RegistrationStatus =
  | 'REGISTERED'
  | 'CONFIRMATION_PENDING'
  | 'CONFIRMED'
  | 'QUEUED'
  | 'PROMOTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REJECTED'
  | 'PRESENT';

export interface EventConfig {
  name: string;
  description: string;
  eventDate: string;
  venue: string;
  totalCapacity: number;
  confirmedCount: number;
  pendingConfirmationCount: number;
  queueCount: number;
  availableSeats: number;
  registrationOpen: boolean;
}

export interface Registration {
  id: string;
  fullName: string;
  email: string;
  enrollmentNumber: string;
  grNumber: string;
  department: string;
  additionalInfo?: string | null;
  phone?: string | null;
  college?: string | null;
  course?: string | null;
  semester?: string | null;
  division?: string | null;
  status: RegistrationStatus;
  queuePosition: number | null;
  confirmationDeadline: string | null;
  uniqueId: string | null;
  qrCodeToken: string | null;
  createdAt: string;
  updatedAt: string;
  attendance?: {
    scannedAt: string;
    scannedBy: string;
    method: string;
  } | null;
}

export interface DashboardStats {
  totalCapacity: number;
  totalRegistrations: number;
  confirmed: number;
  pending: number;
  queue: number;
  cancelled: number;
  expired: number;
  present: number;
  remainingSeats: number;
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  scannedAt: string;
  scannedBy: string;
  method: string;
  registration: Registration;
}

export interface AuditLog {
  id: string;
  action: string;
  registrationId?: string | null;
  adminId?: string | null;
  metadata?: string | null;
  timestamp: string;
  registration?: {
    fullName: string;
    email: string;
    uniqueId?: string | null;
  } | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
