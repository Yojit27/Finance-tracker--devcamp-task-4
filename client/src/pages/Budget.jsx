import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import MonthPicker from '../components/MonthPicker.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import StatCard from '../components/StatCard.jsx';
import CategoryManager from '../components/CategoryManager.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Loader } from '../components/StateViews.jsx';
import { currentMonth, formatMoney, monthLabel } from '../utils/format.js';

const MESSAGES = {
  ok: { text: 'You are within your budget.', icon: '✓' },
  warning: { text: 'Heads up: you are approaching your budget limit (80% or more used).', icon: '!' },
  exceeded: { text: 'You have exceeded your budget for this month.', icon: '✕' },
};

export default function Budget() {
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const budget = useFetch(() => api.getBudget(month), [month]);
  const cats = useFetch(() => api.listCategories(), []);
  const b = budget.data?.data;

  // Reset the input whenever the loaded budget (or month) changes.
  useEffect(() => {
    if (b && b.month === month) setAmount(b.amount != null ? String(b.amount) : '');
    setAmountError('');
  }, [b, month]);

  const save = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (amount === '' || !Number.isFinite(n) || n <= 0) return setAmountError('Enter a budget greater than 0');
    setSaving(true);
    setAmountError('');
    try {
      await api.setBudget({ month, amount: n });
      toast.success(`Budget for ${monthLabel(month)} saved`);
      budget.reload();
    } catch (err) {
      setAmountError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeBudget = async () => {
    await api.deleteBudget(month);
    toast.success('Budget removed');
    setRemoving(false);
    budget.reload();
  };

  return (
    <>
      <div className="page-head">
        <h1>Budget &amp; Categories</h1>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {budget.error && <ErrorState message={budget.error} onRetry={budget.reload} />}
      {budget.loading && !b && <Loader />}

      {b && (
        <div className={budget.loading ? 'fade' : undefined}>
          <section className="card">
            <h2>{monthLabel(month)} budget</h2>
            <form className="inline-form" onSubmit={save} noValidate>
              <div className="field grow">
                <label htmlFor="budget-amount">Monthly spending budget</label>
                <input
                  id="budget-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 20000"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
                  aria-invalid={Boolean(amountError)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : b.amount != null ? 'Update budget' : 'Set budget'}
              </button>
              {b.amount != null && (
                <button type="button" className="btn btn-danger-outline" onClick={() => setRemoving(true)}>
                  Remove
                </button>
              )}
            </form>
            {amountError && <span className="field-error">{amountError}</span>}

            {b.status === 'none' ? (
              <p className="muted">
                No budget set for {monthLabel(month)}. Spent so far: <strong>{formatMoney(b.spent)}</strong>.
              </p>
            ) : (
              <>
                <div className="grid grid-3 budget-stats">
                  <StatCard label="Budget" value={formatMoney(b.amount)} />
                  <StatCard label="Spent" value={formatMoney(b.spent)} tone="expense" hint={`${Math.round(b.percentUsed)}% of budget`} />
                  <StatCard
                    label={b.remaining >= 0 ? 'Remaining' : 'Over budget by'}
                    value={formatMoney(Math.abs(b.remaining))}
                    tone={b.remaining >= 0 ? 'income' : 'expense'}
                  />
                </div>
                <ProgressBar percent={b.percentUsed} status={b.status} label="Budget used" />
                <p className={`budget-msg budget-${b.status}`} role="status">
                  <span aria-hidden="true" className="budget-icon">{MESSAGES[b.status].icon}</span> {MESSAGES[b.status].text}
                </p>
              </>
            )}
          </section>

          <section className="card">
            <h2>Spending by category in {monthLabel(month)}</h2>
            {b.byCategory.length === 0 ? (
              <EmptyState title="No spending recorded this month" />
            ) : (
              <ul className="list">
                {b.byCategory.map((c) => (
                  <li key={c.categoryId} className="list-item">
                    <span className="grow">{c.name}</span>
                    <span className="muted small">{c.count} txn{c.count === 1 ? '' : 's'}</span>
                    <strong>{formatMoney(c.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <CategoryManager
        categories={cats.data?.data}
        loading={cats.loading}
        error={cats.error}
        onChanged={() => {
          cats.reload();
          budget.reload();
        }}
        onRetry={cats.reload}
      />

      {removing && (
        <ConfirmDialog
          title="Remove budget"
          message={`Remove the budget for ${monthLabel(month)}? Your transactions are not affected.`}
          confirmLabel="Remove"
          onConfirm={removeBudget}
          onClose={() => setRemoving(false)}
        />
      )}
    </>
  );
}
