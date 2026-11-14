import { useMemo, useState } from 'react';
import { todayISO, toDateInput } from '../utils/format.js';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

const initialState = (t) =>
  t
    ? {
        title: t.title,
        amount: String(t.amount),
        type: t.type,
        category: t.category?._id || '',
        date: toDateInput(t.date),
        isRecurring: Boolean(t.isRecurring),
        frequency: t.frequency || 'monthly',
      }
    : { title: '', amount: '', type: 'expense', category: '', date: todayISO(), isRecurring: false, frequency: 'monthly' };

function validate(f) {
  const e = {};
  if (!f.title.trim()) e.title = 'Title is required';
  else if (f.title.trim().length > 100) e.title = 'Title must be 100 characters or fewer';

  const amount = Number(f.amount);
  if (f.amount === '' || !Number.isFinite(amount) || amount <= 0) e.amount = 'Enter an amount greater than 0';

  if (!f.category) e.category = 'Select a category';
  if (!f.date) e.date = 'Date is required';
  if (f.isRecurring && !f.frequency) e.frequency = 'Choose how often this repeats';
  return e;
}

// `transaction` present = edit mode. onSubmit(payload) must return a promise.
export default function TransactionForm({ transaction, categories, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => initialState(transaction));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generated copies of a recurring rule can't be turned into rules themselves.
  const canRecur = !transaction?.recurringSource;
  const options = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const changeType = (type) => {
    setForm((f) => ({ ...f, type, category: '' })); // categories are per type
    setErrors((e) => ({ ...e, type: undefined, category: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      await onSubmit({
        title: form.title.trim(),
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        date: form.date,
        isRecurring: canRecur && form.isRecurring,
        frequency: canRecur && form.isRecurring ? form.frequency : null,
      });
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...err.errors }));
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}

      <div className="field">
        <span className="field-label">Type</span>
        <div className="segmented" role="group" aria-label="Transaction type">
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              className={form.type === t ? `seg seg-active seg-${t}` : 'seg'}
              aria-pressed={form.type === t}
              onClick={() => changeType(t)}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="tx-title">Title / Description</label>
        <input id="tx-title" value={form.title} maxLength={100} onChange={(e) => set('title', e.target.value)} aria-invalid={Boolean(errors.title)} />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="tx-amount">Amount</label>
          <input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            aria-invalid={Boolean(errors.amount)}
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </div>
        <div className="field">
          <label htmlFor="tx-date">Date</label>
          <input id="tx-date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} aria-invalid={Boolean(errors.date)} />
          {errors.date && <span className="field-error">{errors.date}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="tx-category">Category</label>
        <select id="tx-category" value={form.category} onChange={(e) => set('category', e.target.value)} aria-invalid={Boolean(errors.category)}>
          <option value="">Select a {form.type} category</option>
          {options.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.category && <span className="field-error">{errors.category}</span>}
        {options.length === 0 && <span className="field-hint">No {form.type} categories yet. Add one on the Budget &amp; Categories page.</span>}
      </div>

      {canRecur && (
        <div className="field">
          <label className="checkbox">
            <input type="checkbox" checked={form.isRecurring} onChange={(e) => set('isRecurring', e.target.checked)} />
            Repeat this transaction automatically
          </label>
          {form.isRecurring && (
            <>
              <select aria-label="Repeat frequency" value={form.frequency} onChange={(e) => set('frequency', e.target.value)}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
              <span className="field-hint">New entries are created automatically each time one comes due, including any missed since the start date.</span>
              {errors.frequency && <span className="field-error">{errors.frequency}</span>}
            </>
          )}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  );
}
