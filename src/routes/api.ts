import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAdminAuth } from '../auth/auth';
import { getEvents, getDLQEvents, replayDlqEvent, generateToken, clearToken, verifySession } from '../controllers/apiController';

const router = Router();

// Limit login attempts to 10 per 15 minutes to prevent brute force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/login', loginLimiter, generateToken);
router.post('/logout', clearToken);

router.use(requireAdminAuth);

router.get('/events', getEvents);
router.get('/dlq', getDLQEvents);
router.post('/dlq/replay/:id', replayDlqEvent);
router.get('/verify', verifySession);

export default router;