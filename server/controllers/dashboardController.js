import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { monthRange, currentMonth } from '../utils/dates.js';
import { totalsAll, totalsBetween, categoryBreakdown, monthlySeries, budgetSummary } from '../utils/stats.js';
import { round2 } from '../utils/validate.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  const range = monthRange(month);
  if (!range) throw new ApiError(400, 'Month must be in YYYY-MM format', { month: 'Invalid month' });
  const userId = req.user._id;

  // Six months of trend data ending at the selected month.
  const [y, m] = month.split('-').map(Number);
  const trendStart = new Date(Date.UTC(y, m - 6, 1));
  const labels = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(y, m - 6 + i, 1)).toISOString().slice(0, 7));

  const [all, monthTotals, budget, breakdown, series, recent] = await Promise.all([
    totalsAll(userId),
    totalsBetween(userId, range.start, range.end),
    budgetSummary(userId, month),
    categoryBreakdown(userId, range.start, range.end, 'expense'),
    monthlySeries(userId, trendStart, range.end),
    Transaction.find({ user: userId }).sort({ date: -1, createdAt: -1 }).limit(5).populate('category', 'name type'),
  ]);

  res.json({
    success: true,
    data: {
      month,
      allTime: { income: all.income, expense: all.expense, balance: round2(all.income - all.expense) },
      monthly: { income: monthTotals.income, expense: monthTotals.expense, net: round2(monthTotals.income - monthTotals.expense) },
      budget,
      categoryBreakdown: breakdown,
      trend: labels.map((label) => ({ month: label, income: series[label]?.income || 0, expense: series[label]?.expense || 0 })),
      recent,
    },
  });
});
