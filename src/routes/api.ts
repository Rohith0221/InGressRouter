import { Router } from 'express';
import {requireAdminAuth} from '../auth/auth';
import { getEvents, getDLQEvents, replayDlqEvent, generateToken, clearToken, verifySession } from '../controllers/apiController';

const router = Router();

router.post('/login', generateToken);
router.post('/logout', clearToken);

router.use(requireAdminAuth);

router.get('/events', getEvents);
router.get('/dlq', getDLQEvents);
router.post('/dlq/replay/:id', replayDlqEvent);
router.get('/verify', verifySession);

export default router;