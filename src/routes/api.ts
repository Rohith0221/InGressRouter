import { Router } from 'express';
import {requireAdminAuth} from '../auth/auth';
import { getEvents, getDLQEvents, replayDlqEvent } from '../controllers/apiController';

const router = Router();

router.use(requireAdminAuth);

router.get('/events', getEvents);
router.get('/dlq', getDLQEvents);
router.post('/dlq/replay/:id', replayDlqEvent);

export default router;