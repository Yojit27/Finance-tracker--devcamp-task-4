import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import MonthPicker from '../components/MonthPicker.jsx';
import StatCard from '../components/StatCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { EmptyState, ErrorState, Loader } from '../components/StateViews.jsx';
import { currentMonth, formatMoney, monthLabel } from '../utils/format.js';
import { EXPENSE_COLOR, INCOME_COLOR, PALETTE, tooltipStyle } from '../utils/charts.js';

const BUDGET_MESSAGES = {
  none: 'No budget set for this month.',
  ok: 'You are within your budget.',
  warning: 'You are approaching your budget limit.',
  exceeded: 'You have exceeded your budget.',
};

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth);
  const { data, loading, error, reload } = useFetch(() => api.dashboard(month), [month]);
  const d = data?.data;

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !d && <Loader />}

      {d && (
        <div className={loading ? 'fade' : undefined}>
          <section className="grid grid-3" aria-label="All-time totals">
            <StatCard label="Total balance" value={formatMoney(d.allTime.balance)} tone={d.allTime.balance < 0 ? 'expense' : 'neutral'} hint="All income minus all expenses" />
            <StatCard label="Total income" value={formatMoney(d.allTime.income)} tone="income" hint="All time" />
            <StatCard label="Total expenses" value={formatMoney(d.allTime.expense)} tone="expense" hint="All time" />
          </section>

          <section className="grid grid-2">
            <div className="card">
              <h2>{monthLabel(month)} summary</h2>
              <dl className="summary">
                <div>
                  <dt>Income</dt>
                  <dd className="amount-income">{formatMoney(d.monthly.income)}</dd>
                </div>
                <div>
                  <dt>Spending</dt>
                  <dd className="amount-expense">{formatMoney(d.monthly.expense)}</dd>
                </div>
                <div>
                  <dt>Net</dt>
                  <dd className={d.monthly.net < 0 ? 'amount-expense' : 'amount-income'}>{formatMoney(d.monthly.net)}</dd>
                </div>
              </dl>

              <h3>Income vs. expenses</h3>
              {d.monthly.income === 0 && d.monthly.expense === 0 ? (
                <p className="muted">No activity this month.</p>
              ) : (
                <>
                  <ProgressBar
                    percent={d.monthly.income > 0 ? (d.monthly.expense / d.monthly.income) * 100 : 100}
                    status={d.monthly.expense > d.monthly.income ? 'exceeded' : 'income'}
                    label="Expenses as a share of income"
                  />
                  <p className="muted small">
                    {d.monthly.income > 0
                      ? `You spent ${Math.round((d.monthly.expense / d.monthly.income) * 100)}% of this month's income.`
                      : 'You have spending but no income recorded this month.'}
                  </p>
                </>
              )}
            </div>

            <div className="card">
              <h2>Monthly budget</h2>
              {d.budget.status === 'none' ? (
                <>
                  <p className="muted">{BUDGET_MESSAGES.none}</p>
                  <p>
                    Spent so far: <strong>{formatMoney(d.budget.spent)}</strong>
                  </p>
                </>
              ) : (
                <>
                  <ProgressBar percent={d.budget.percentUsed} status={d.budget.status} label="Budget used" />
                  <p>
                    <strong>{formatMoney(d.budget.spent)}</strong> of {formatMoney(d.budget.amount)} ({Math.round(d.budget.percentUsed)}%)
                  </p>
                  <p className={`budget-msg budget-${d.budget.status}`}>
                    {BUDGET_MESSAGES[d.budget.status]}{' '}
                    {d.budget.remaining >= 0 ? `${formatMoney(d.budget.remaining)} left.` : `Over by ${formatMoney(-d.budget.remaining)}.`}
                  </p>
                </>
              )}
              <Link to="/budget" className="btn btn-small">
                Manage budget
              </Link>
            </div>
          </section>

          <section className="grid grid-2">
            <div className="card">
              <h2>Income vs. expenses (6 months)</h2>
              <div className="chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.trend.map((t) => ({ ...t, label: monthLabel(t.month, true) }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" tickLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                    <Tooltip formatter={(v) => formatMoney(v)} contentStyle={tooltipStyle} cursor={{ fill: 'var(--hover)' }} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2>Spending by category</h2>
              {d.categoryBreakdown.length === 0 ? (
                <EmptyState title="No spending this month" />
              ) : (
                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={d.categoryBreakdown} dataKey="total" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2} stroke="var(--surface)">
                        {d.categoryBreakdown.map((c, i) => (
                          <Cell key={c.categoryId} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(v)} contentStyle={tooltipStyle} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Recent transactions</h2>
              <Link to="/transactions" className="btn btn-small">
                View all
              </Link>
            </div>
            {d.recent.length === 0 ? (
              <EmptyState title="No transactions yet">
                Head to <Link to="/transactions">Transactions</Link> to add your first one.
              </EmptyState>
            ) : (
              <TransactionTable transactions={d.recent} />
            )}
          </section>
        </div>
      )}
    </>
  );
}
