import { Router } from 'express';
import { getBudget, setBudget, deleteBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';
import { syncRecurring } from '../middleware/recurring.js';

const router = Router();
router.use(protect);

router.route('/').get(syncRecurring, getBudget).put(syncRecurring, setBudget).delete(deleteBudget);

export default router;
