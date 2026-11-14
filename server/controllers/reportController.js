import Transaction from '../models/Transaction.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { monthRange, yearRange, currentMonth } from '../utils/dates.js';
import { totalsBetween, categoryBreakdown, monthlySeries, dailyExpenses, budgetSummary } from '../utils/stats.js';
import { round2 } from '../utils/validate.js';
import { sendCsv } from '../utils/csv.js';

const requireMonth = (value) => {
  const month = value || currentMonth();
  const range = monthRange(month);
  if (!range) throw new ApiError(400, 'Month must be in YYYY-MM format', { month: 'Invalid month' });
  return { month, ...range };
};

const savingsRate = (income, expense) => (income > 0 ? round2(((income - expense) / income) * 100) : null);

async function buildMonthly(userId, month, start, end) {
  const [totals, expenseByCategory, incomeByCategory, daily, budget] = await Promise.all([
    totalsBetween(userId, start, end),
    categoryBreakdown(userId, start, end, 'expense'),
    categoryBreakdown(userId, start, end, 'income'),
    dailyExpenses(userId, start, end),
    budgetSummary(userId, month),
  ]);
  return {
    month,
    income: totals.income,
    expense: totals.expense,
    net: round2(totals.income - totals.expense),
    savingsRate: savingsRate(totals.income, totals.expense),
    transactionCount: totals.count,
    expenseByCategory,
    incomeByCategory,
    dailyExpenses: daily,
    budget,
  };
}

export const monthlyReport = asyncHandler(async (req, res) => {
  const { month, start, end } = requireMonth(req.query.month);
  res.json({ success: true, data: await buildMonthly(req.user._id, month, start, end) });
});

export const yearlyReport = asyncHandler(async (req, res) => {
  const year = req.query.year || String(new Date().getUTCFullYear());
  const range = yearRange(year);
  if (!range) throw new ApiError(400, 'Year must be a 4-digit year', { year: 'Invalid year' });

  const [series, expenseByCategory, incomeByCategory] = await Promise.all([
    monthlySeries(req.user._id, range.start, range.end),
    categoryBreakdown(req.user._id, range.start, range.end, 'expense'),
    categoryBreakdown(req.user._id, range.start, range.end, 'income'),
  ]);

  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`;
    const income = series[key]?.income || 0;
    const expense = series[key]?.expense || 0;
    return { month: key, income, expense, net: round2(income - expense) };
  });
  const income = round2(months.reduce((s, m) => s + m.income, 0));
  const expense = round2(months.reduce((s, m) => s + m.expense, 0));

  res.json({
    success: true,
    data: { year: Number(year), income, expense, net: round2(income - expense), savingsRate: savingsRate(income, expense), months, expenseByCategory, incomeByCategory },
  });
});

// Downloadable monthly expense report (CSV): summary, spending by category, then every expense.
export const downloadMonthlyReport = asyncHandler(async (req, res) => {
  const { month, start, end } = requireMonth(req.query.month);
  const report = await buildMonthly(req.user._id, month, start, end);
  const expenses = await Transaction.find({ user: req.user._id, type: 'expense', date: { $gte: start, $lt: end } })
    .sort({ date: 1 })
    .populate('category', 'name');

  const rows = [
    [`Monthly Expense Report - ${month}`],
    [`Account`, req.user.name],
    [],
    ['SUMMARY'],
    ['Total income', report.income],
    ['Total expenses', report.expense],
    ['Net (income - expenses)', report.net],
    ['Savings rate (%)', report.savingsRate ?? 'n/a'],
    ['Budget', report.budget.amount ?? 'not set'],
    ['Remaining budget', report.budget.remaining ?? 'n/a'],
    [],
    ['EXPENSES BY CATEGORY'],
    ['Category', 'Amount', 'Share of expenses (%)', 'Transactions'],
    ...report.expenseByCategory.map((c) => [c.name, c.total, report.expense ? round2((c.total / report.expense) * 100) : 0, c.count]),
    [],
    ['EXPENSE TRANSACTIONS'],
    ['Date', 'Title', 'Category', 'Amount'],
    ...expenses.map((t) => [t.date.toISOString().slice(0, 10), t.title, t.category?.name ?? '', t.amount]),
  ];
  sendCsv(res, `expense-report-${month}.csv`, rows);
});
