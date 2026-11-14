import Budget from '../models/Budget.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { monthRange, currentMonth } from '../utils/dates.js';
import { budgetSummary, categoryBreakdown } from '../utils/stats.js';
import { round2 } from '../utils/validate.js';

const requireMonth = (value) => {
  const month = value || currentMonth();
  if (!monthRange(month)) throw new ApiError(400, 'Month must be in YYYY-MM format', { month: 'Invalid month' });
  return month;
};

// Budget for a month + how much has been spent against it + spending per category.
export const getBudget = asyncHandler(async (req, res) => {
  const month = requireMonth(req.query.month);
  const { start, end } = monthRange(month);
  const [summary, byCategory] = await Promise.all([
    budgetSummary(req.user._id, month),
    categoryBreakdown(req.user._id, start, end, 'expense'),
  ]);
  res.json({ success: true, data: { ...summary, byCategory } });
});

export const setBudget = asyncHandler(async (req, res) => {
  const month = requireMonth(req.body.month);
  const amount = Number(req.body.amount);
  if (req.body.amount === '' || req.body.amount == null || !Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, 'Budget must be a number greater than 0', { amount: 'Budget must be a number greater than 0' });
  }
  if (amount > 1e12) throw new ApiError(400, 'Budget is too large', { amount: 'Budget is too large' });

  await Budget.findOneAndUpdate(
    { user: req.user._id, month },
    { $set: { amount: round2(amount) } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const summary = await budgetSummary(req.user._id, month);
  res.json({ success: true, message: 'Budget saved', data: summary });
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const month = requireMonth(req.query.month);
  const removed = await Budget.findOneAndDelete({ user: req.user._id, month });
  if (!removed) throw new ApiError(404, 'No budget is set for that month');
  res.json({ success: true, message: 'Budget removed' });
});
