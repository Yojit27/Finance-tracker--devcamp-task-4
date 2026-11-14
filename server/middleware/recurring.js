import asyncHandler from '../utils/asyncHandler.js';
import { processRecurring } from '../utils/recurring.js';

// Generates any due recurring transactions before data is read, so totals are always current.
export const syncRecurring = asyncHandler(async (req, _res, next) => {
  await processRecurring(req.user._id);
  next();
});
