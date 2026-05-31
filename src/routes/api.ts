import { Router } from 'express';
import {requireAdminAuth} from '../auth/auth';
import { getEvents, getDlqEvents, replayDlqEvent } from '../controllers/apiController';

const router = Router();

router.use(requireAdminAuth);

router.get('/events', getEvents);
router.get('/dlq', getDlqEvents);
router.post('/dlq/replay/:id', replayDlqEvent);

export default router;