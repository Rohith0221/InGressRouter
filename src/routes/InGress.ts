import { Router} from 'express';
import { safePayloadParser } from '../middlewares/safePayloadParser';
import { ingestWebhook } from '../controllers/InGressController';

const router = Router();

router.post('/:slug', safePayloadParser, ingestWebhook);

export default router; 