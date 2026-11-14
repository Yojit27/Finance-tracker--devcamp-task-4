import { Router } from 'express';
import { monthlyReport, yearlyReport, downloadMonthlyReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { syncRecurring } from '../middleware/recurring.js';

const router = Router();
router.use(protect, syncRecurring);

router.get('/monthly', monthlyReport);
router.get('/monthly/download', downloadMonthlyReport);
router.get('/yearly', yearlyReport);

export default router;
