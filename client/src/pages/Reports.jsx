import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import MonthPicker from '../components/MonthPicker.jsx';
import StatCard from '../components/StatCard.jsx';
import { EmptyState, ErrorState, Loader } from '../components/StateViews.jsx';
import { currentMonth, formatMoney, monthLabel } from '../utils/format.js';
import { EXPENSE_COLOR, INCOME_COLOR, tooltipStyle } from '../utils/charts.js';

const rate = (r) => (r === null || r === undefined ? 'n/a' : `${r}%`);

function CategoryTable({ title, rows, total }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <EmptyState title="Nothing recorded" />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="num">Amount</th>
              <th className="num">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.categoryId}>
                <td>{r.name}</td>
                <td className="num">{formatMoney(r.total)}</td>
                <td className="num">{total ? `${Math.round((r.total / total) * 100)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MonthlyReport({ month }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const { data, loading, error, reload } = useFetch(() => api.monthlyReport(month), [month]);
  const r = data?.data;

  const download = async () => {
    setDownloading(true);
    try {
      await api.downloadMonthlyReport(month);
      toast.success('Report downloaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!r) return <Loader />;

  return (
    <div className={loading ? 'fade' : undefined}>
      <div className="head-actions no-print">
        <button type="button" className="btn" onClick={download} disabled={downloading}>
          {downloading ? 'Preparing…' : 'Download expense report (CSV)'}
        </button>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <section className="grid grid-3 report-stats">
        <StatCard label="Income" value={formatMoney(r.income)} tone="income" />
        <StatCard label="Expenses" value={formatMoney(r.expense)} tone="expense" />
        <StatCard label="Net" value={formatMoney(r.net)} tone={r.net < 0 ? 'expense' : 'income'} hint={`Savings rate: ${rate(r.savingsRate)}`} />
      </section>
      <p className="muted small">
        {r.transactionCount} transaction{r.transactionCount === 1 ? '' : 's'} in {monthLabel(month)}.
        {r.budget.amount != null && ` Budget ${formatMoney(r.budget.amount)} · ${formatMoney(r.budget.spent)} spent (${Math.round(r.budget.percentUsed)}%).`}
      </p>

      <section className="card">
        <h2>Daily spending</h2>
        {r.dailyExpenses.length === 0 ? (
          <EmptyState title="No spending this month" />
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.dailyExpenses.map((d) => ({ ...d, day: Number(d.date.slice(8)) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip formatter={(v) => formatMoney(v)} labelFormatter={(d) => `Day ${d}`} contentStyle={tooltipStyle} cursor={{ fill: 'var(--hover)' }} />
                <Bar dataKey="total" name="Spent" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="grid grid-2">
        <CategoryTable title="Expenses by category" rows={r.expenseByCategory} total={r.expense} />
        <CategoryTable title="Income by category" rows={r.incomeByCategory} total={r.income} />
      </section>
    </div>
  );
}

function YearlyReport({ year }) {
  const { data, loading, error, reload } = useFetch(() => api.yearlyReport(year), [year]);
  const r = data?.data;

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!r) return <Loader />;

  return (
    <div className={loading ? 'fade' : undefined}>
      <div className="head-actions no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <section className="grid grid-3 report-stats">
        <StatCard label={`${r.year} income`} value={formatMoney(r.income)} tone="income" />
        <StatCard label={`${r.year} expenses`} value={formatMoney(r.expense)} tone="expense" />
        <StatCard label="Net" value={formatMoney(r.net)} tone={r.net < 0 ? 'expense' : 'income'} hint={`Savings rate: ${rate(r.savingsRate)}`} />
      </section>

      <section className="card">
        <h2>Month by month</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r.months.map((m) => ({ ...m, label: monthLabel(m.month, true) }))}>
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
        <table className="table responsive-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="num">Income</th>
              <th className="num">Expenses</th>
              <th className="num">Net</th>
            </tr>
          </thead>
          <tbody>
            {r.months.map((m) => (
              <tr key={m.month}>
                <td data-label="Month">{monthLabel(m.month)}</td>
                <td data-label="Income" className="num amount-income">{formatMoney(m.income)}</td>
                <td data-label="Expenses" className="num amount-expense">{formatMoney(m.expense)}</td>
                <td data-label="Net" className={`num ${m.net < 0 ? 'amount-expense' : ''}`}>{formatMoney(m.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid grid-2">
        <CategoryTable title="Expenses by category" rows={r.expenseByCategory} total={r.expense} />
        <CategoryTable title="Income by category" rows={r.incomeByCategory} total={r.income} />
      </section>
    </div>
  );
}

export default function Reports() {
  const [view, setView] = useState('monthly');
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(() => currentMonth().slice(0, 4));

  const yearNum = Number(year);
  const yearValid = Number.isInteger(yearNum) && yearNum >= 1970 && yearNum <= 9999;

  return (
    <>
      <div className="page-head">
        <h1>Reports</h1>
        {view === 'monthly' ? (
          <MonthPicker value={month} onChange={setMonth} />
        ) : (
          <div className="month-picker no-print">
            <button type="button" className="btn btn-small" aria-label="Previous year" disabled={!yearValid} onClick={() => setYear(String(yearNum - 1))}>
              ‹
            </button>
            <input
              className="year-input"
              type="number"
              aria-label="Year"
              min="1970"
              max="9999"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <button type="button" className="btn btn-small" aria-label="Next year" disabled={!yearValid} onClick={() => setYear(String(yearNum + 1))}>
              ›
            </button>
          </div>
        )}
      </div>

      <div className="tabs no-print" role="tablist">
        {['monthly', 'yearly'].map((v) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} className={view === v ? 'tab tab-active' : 'tab'} onClick={() => setView(v)}>
            {v === 'monthly' ? 'Monthly report' : 'Yearly report'}
          </button>
        ))}
      </div>

      {view === 'monthly' ? (
        <MonthlyReport month={month} />
      ) : yearValid ? (
        <YearlyReport year={String(yearNum)} />
      ) : (
        <ErrorState message="Enter a valid 4-digit year." />
      )}
    </>
  );
}
