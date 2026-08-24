import { Router } from 'express';
import {
  loginAdmin,
  getAdminMe,
  logoutAdmin,
  getDashboardStats,
  getRegistrations,
  getQueueList,
  scanAttendance,
  getAttendanceList,
  undoAttendance,
  adminCancelRegistration,
  adminDeleteRegistration,
  adminCreateRegistration,
  adminUpdateRegistration,
  adminPromoteQueueStudent,
  resendEmail,
  getSettings,
  updateSettings,
  getAuditLogs,
  exportRegistrationsCSV,
} from '../controllers/adminController';
import { requireAdminAuth } from '../middleware/authMiddleware';

const router = Router();

// Public Admin Auth Route
router.post('/login', loginAdmin);

// Protected Admin Routes
router.use(requireAdminAuth);

router.get('/me', getAdminMe);
router.post('/logout', logoutAdmin);
router.get('/stats', getDashboardStats);
router.get('/registrations', getRegistrations);
router.get('/queue', getQueueList);
router.post('/attendance/scan', scanAttendance);
router.get('/attendance', getAttendanceList);
router.post('/attendance/undo', undoAttendance);
router.post('/registration/create', adminCreateRegistration);
router.put('/registration/update', adminUpdateRegistration);
router.post('/registration/cancel', adminCancelRegistration);
router.delete('/registration/:id', adminDeleteRegistration);
router.post('/queue/promote-manual', adminPromoteQueueStudent);
router.post('/resend-email', resendEmail);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/audit-logs', getAuditLogs);
router.get('/export/registrations', exportRegistrationsCSV);

export default router;
