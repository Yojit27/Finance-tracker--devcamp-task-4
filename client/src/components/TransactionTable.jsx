import { formatDate, formatMoney, capitalize } from '../utils/format.js';

// Table on desktop; the same markup collapses into cards on small screens (see CSS, data-label).
export default function TransactionTable({ transactions, onEdit, onDelete }) {
  const showActions = Boolean(onEdit || onDelete);
  return (
    <table className="table responsive-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Title</th>
          <th>Category</th>
          <th>Type</th>
          <th className="num">Amount</th>
          {showActions && <th className="actions-col no-print">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t._id}>
            <td data-label="Date">{formatDate(t.date)}</td>
            <td data-label="Title">
              {t.title}
              {t.isRecurring && <span className="badge">↻ {capitalize(t.frequency)}</span>}
              {t.recurringSource && <span className="badge badge-muted">Auto</span>}
            </td>
            <td data-label="Category">{t.category?.name ?? '—'}</td>
            <td data-label="Type">
              <span className={`pill pill-${t.type}`}>{capitalize(t.type)}</span>
            </td>
            <td data-label="Amount" className={`num amount-${t.type}`}>
              {t.type === 'income' ? '+' : '−'}
              {formatMoney(t.amount)}
            </td>
            {showActions && (
              <td className="actions-col no-print">
                {onEdit && (
                  <button type="button" className="btn btn-small" onClick={() => onEdit(t)}>
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button type="button" className="btn btn-small btn-danger-outline" onClick={() => onDelete(t)}>
                    Delete
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
