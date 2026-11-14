import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import useFetch from '../hooks/useFetch.js';
import { useToast } from '../context/ToastContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import TransactionTable from '../components/TransactionTable.jsx';
import { EmptyState, ErrorState, Loader } from '../components/StateViews.jsx';
import { formatDate, formatMoney, capitalize } from '../utils/format.js';

const EMPTY_FILTERS = { type: '', category: '', startDate: '', endDate: '', search: '' };

export default function Transactions() {
  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState(''); // debounced into filters.search
  const [editing, setEditing] = useState(null); // null | 'new' | transaction
  const [deleting, setDeleting] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFilters((f) => ({ ...f, search })), 300);
    return () => clearTimeout(id);
  }, [search]);

  const dateRangeInvalid = filters.startDate && filters.endDate && filters.startDate > filters.endDate;
  const params = useMemo(() => (dateRangeInvalid ? { ...filters, startDate: '', endDate: '' } : filters), [filters, dateRangeInvalid]);

  const tx = useFetch(() => api.listTransactions(params), [JSON.stringify(params)]);
  const cats = useFetch(() => api.listCategories(), []);
  const categories = cats.data?.data || [];

  const filterCategories = categories.filter((c) => !filters.type || c.type === filters.type);
  const hasFilters = Object.values(filters).some(Boolean) || search;

  const setFilter = (name, value) => setFilters((f) => ({ ...f, [name]: value, ...(name === 'type' ? { category: '' } : {}) }));
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearch('');
  };

  const save = async (payload) => {
    if (editing === 'new') {
      await api.createTransaction(payload);
      toast.success('Transaction added');
    } else {
      await api.updateTransaction(editing._id, payload);
      toast.success('Transaction updated');
    }
    setEditing(null);
    tx.reload();
  };

  const remove = async () => {
    await api.deleteTransaction(deleting._id);
    toast.success('Transaction deleted');
    setDeleting(null);
    tx.reload();
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await api.exportTransactions(params);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const list = tx.data?.data || [];
  const summary = tx.data?.summary;

  return (
    <>
      <div className="page-head">
        <h1>Transactions</h1>
        <div className="head-actions">
          <button type="button" className="btn" onClick={exportCsv} disabled={exporting || list.length === 0}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add transaction
          </button>
        </div>
      </div>

      <section className="card filters" aria-label="Filters">
        <div className="field">
          <label htmlFor="f-search">Search</label>
          <input id="f-search" placeholder="Title contains…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-type">Type</label>
          <select id="f-type" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-cat">Category</label>
          <select id="f-cat" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {filterCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
                {!filters.type ? ` (${c.type})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-from">From</label>
          <input id="f-from" type="date" value={filters.startDate} onChange={(e) => setFilter('startDate', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="f-to">To</label>
          <input id="f-to" type="date" value={filters.endDate} onChange={(e) => setFilter('endDate', e.target.value)} />
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-small filters-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
        {dateRangeInvalid && <span className="field-error filters-error">The "From" date must be on or before the "To" date. Date filter ignored.</span>}
      </section>

      {tx.error && <ErrorState message={tx.error} onRetry={tx.reload} />}
      {tx.loading && !tx.data && <Loader />}

      {tx.data && (
        <section className={tx.loading ? 'card fade' : 'card'}>
          <div className="card-head">
            <h2>
              {list.length} transaction{list.length === 1 ? '' : 's'}
            </h2>
            <span className="muted small">
              Income <strong className="amount-income">{formatMoney(summary.income)}</strong> · Expenses{' '}
              <strong className="amount-expense">{formatMoney(summary.expense)}</strong>
            </span>
          </div>
          {list.length === 0 ? (
            hasFilters ? (
              <EmptyState title="No transactions match these filters">
                <button type="button" className="btn btn-small" onClick={clearFilters}>
                  Clear filters
                </button>
              </EmptyState>
            ) : (
              <EmptyState title="No transactions yet">Use “Add transaction” to record your first income or expense.</EmptyState>
            )
          ) : (
            <TransactionTable transactions={list} onEdit={setEditing} onDelete={setDeleting} />
          )}
        </section>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add transaction' : 'Edit transaction'} onClose={() => setEditing(null)}>
          {cats.loading && !cats.data ? (
            <Loader />
          ) : cats.error ? (
            <ErrorState message={cats.error} onRetry={cats.reload} />
          ) : (
            <TransactionForm
              transaction={editing === 'new' ? null : editing}
              categories={categories}
              onSubmit={save}
              onCancel={() => setEditing(null)}
            />
          )}
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete transaction"
          message={`Delete "${deleting.title}" (${capitalize(deleting.type)}, ${formatMoney(deleting.amount)}, ${formatDate(deleting.date)})? This cannot be undone.`}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
