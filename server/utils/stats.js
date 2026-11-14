import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { monthRange } from './dates.js';
import { round2 } from './validate.js';

const sumByType = async (userId, match = {}) => {
  const rows = await Transaction.aggregate([
    { $match: { user: userId, ...match } },
    { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const out = { income: 0, expense: 0, count: 0 };
  for (const r of rows) {
    out[r._id] = round2(r.total);
    out.count += r.count;
  }
  return out;
};

export const totalsAll = (userId) => sumByType(userId);
export const totalsBetween = (userId, start, end) => sumByType(userId, { date: { $gte: start, $lt: end } });

// Spending (or income) per category in a date range, largest first.
export const categoryBreakdown = async (userId, start, end, type) => {
  const rows = await Transaction.aggregate([
    { $match: { user: userId, type, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, categoryId: '$_id', name: { $ifNull: ['$cat.name', 'Uncategorised'] }, total: 1, count: 1 } },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ ...r, total: round2(r.total) }));
};

// Income and expense per "YYYY-MM" in a date range.
export const monthlySeries = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$date', timezone: 'UTC' } }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);
  const map = {};
  for (const r of rows) {
    map[r._id.month] ||= { income: 0, expense: 0 };
    map[r._id.month][r._id.type] = round2(r.total);
  }
  return map;
};

// Expense per day ("YYYY-MM-DD") in a date range.
export const dailyExpenses = async (userId, start, end) => {
  const rows = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, total: round2(r.total) }));
};

// Budget vs. actual spending for one month.
export const budgetSummary = async (userId, month) => {
  const { start, end } = monthRange(month);
  const [budget, totals] = await Promise.all([
    Budget.findOne({ user: userId, month }),
    totalsBetween(userId, start, end),
  ]);
  const spent = totals.expense;
  if (!budget) return { month, amount: null, spent, remaining: null, percentUsed: null, status: 'none' };

  const percentUsed = round2((spent / budget.amount) * 100);
  const status = spent > budget.amount ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'ok';
  return { month, amount: budget.amount, spent, remaining: round2(budget.amount - spent), percentUsed, status };
};
