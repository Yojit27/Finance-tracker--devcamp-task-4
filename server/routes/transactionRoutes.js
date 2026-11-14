import { Router } from 'express';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';
import { loadOwned } from '../middleware/ownership.js';
import { syncRecurring } from '../middleware/recurring.js';
import Transaction from '../models/Transaction.js';

const router = Router();
router.use(protect);

router.get('/export', syncRecurring, exportTransactions); // must stay above /:id
router.route('/').get(syncRecurring, listTransactions).post(createTransaction);
router.route('/:id').put(loadOwned(Transaction), updateTransaction).delete(loadOwned(Transaction), deleteTransaction);

export default router;
