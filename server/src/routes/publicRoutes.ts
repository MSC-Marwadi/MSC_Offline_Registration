import { Router } from 'express';
import {
  getEventInfo,
  registerStudent,
  handleConfirmToken,
  checkRegistrationStatus,
} from '../controllers/publicController';

const router = Router();

router.get('/event-info', getEventInfo);
router.post('/register', registerStudent);
router.post('/confirm/:token/:response', handleConfirmToken);
router.get('/check-status', checkRegistrationStatus);

export default router;
