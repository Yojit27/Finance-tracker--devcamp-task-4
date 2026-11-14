import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { syncRecurring } from '../middleware/recurring.js';

const router = Router();
router.get('/', protect, syncRecurring, getDashboard);

export default router;
