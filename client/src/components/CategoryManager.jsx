import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { EmptyState, ErrorState, Loader } from './StateViews.jsx';

export default function CategoryManager({ categories, loading, error, onChanged, onRetry }) {
  const toast = useToast();
  const [tab, setTab] = useState('expense');
  const [name, setName] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const visible = (categories || []).filter((c) => c.type === tab);

  const add = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setAddError('Category name is required');
    if (trimmed.length > 40) return setAddError('Category name must be 40 characters or fewer');
    setAdding(true);
    setAddError('');
    try {
      await api.createCategory({ name: trimmed, type: tab });
      setName('');
      toast.success(`Added "${trimmed}"`);
      onChanged();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setEditName(c.name);
    setEditError('');
  };

  const saveEdit = async (c) => {
    const trimmed = editName.trim();
    if (!trimmed) return setEditError('Name is required');
    if (trimmed.length > 40) return setEditError('Name must be 40 characters or fewer');
    if (trimmed === c.name) return setEditingId(null);
    try {
      await api.updateCategory(c._id, { name: trimmed });
      toast.success('Category renamed');
      setEditingId(null);
      onChanged();
    } catch (err) {
      setEditError(err.message);
    }
  };

  const confirmDelete = async () => {
    await api.deleteCategory(toDelete._id);
    toast.success(`Deleted "${toDelete.name}"`);
    setToDelete(null);
    onChanged();
  };

  return (
    <section className="card">
      <h2>Categories</h2>
      <div className="tabs" role="tablist">
        {['expense', 'income'].map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'tab tab-active' : 'tab'} onClick={() => setTab(t)}>
            {t === 'expense' ? 'Expense categories' : 'Income categories'}
          </button>
        ))}
      </div>

      <form className="inline-form" onSubmit={add} noValidate>
        <div className="field grow">
          <label htmlFor="cat-name" className="sr-only">
            New {tab} category name
          </label>
          <input id="cat-name" placeholder={`New ${tab} category`} value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setAddError(''); }} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={adding}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
      {addError && <span className="field-error">{addError}</span>}

      {loading && !categories ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : visible.length === 0 ? (
        <EmptyState title={`No ${tab} categories yet`}>Add one above.</EmptyState>
      ) : (
        <ul className="list">
          {visible.map((c) => (
            <li key={c._id} className="list-item">
              {editingId === c._id ? (
                <div className="grow">
                  <div className="inline-form">
                    <input
                      aria-label={`Rename ${c.name}`}
                      value={editName}
                      maxLength={40}
                      autoFocus
                      onChange={(e) => { setEditName(e.target.value); setEditError(''); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(c);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button type="button" className="btn btn-small btn-primary" onClick={() => saveEdit(c)}>
                      Save
                    </button>
                    <button type="button" className="btn btn-small" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                  {editError && <span className="field-error">{editError}</span>}
                </div>
              ) : (
                <>
                  <span className="grow">
                    {c.name} <span className="muted">· {c.transactionCount} transaction{c.transactionCount === 1 ? '' : 's'}</span>
                  </span>
                  <button type="button" className="btn btn-small" onClick={() => startEdit(c)}>
                    Rename
                  </button>
                  <button type="button" className="btn btn-small btn-danger-outline" onClick={() => setToDelete(c)}>
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${toDelete.name}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </section>
  );
}
