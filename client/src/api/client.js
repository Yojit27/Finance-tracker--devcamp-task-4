import { API_URL } from '../config.js';

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => localStorage.setItem('token', t);
export const clearToken = () => localStorage.removeItem('token');

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

const toQuery = (params) => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

async function send(path, { method = 'GET', body, params } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_URL}${path}${toQuery(params)}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  return { res, token };
}

async function failure(res, token) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && onUnauthorized) onUnauthorized();
  const err = new Error(data.message || 'Something went wrong. Please try again.');
  err.status = res.status;
  err.errors = data.errors || {};
  return err;
}

async function request(path, options) {
  const { res, token } = await send(path, options);
  if (!res.ok) throw await failure(res, token);
  return res.json();
}

// Downloads a file response (CSV) through fetch so the Authorization header is included.
async function download(path, params, fallbackName) {
  const { res, token } = await send(path, { params });
  if (!res.ok) throw await failure(res, token);
  const disposition = res.headers.get('Content-Disposition') || '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  dashboard: (month) => request('/dashboard', { params: { month } }),

  listTransactions: (params) => request('/transactions', { params }),
  createTransaction: (body) => request('/transactions', { method: 'POST', body }),
  updateTransaction: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  exportTransactions: (params) => download('/transactions/export', params, 'transactions.csv'),

  listCategories: (params) => request('/categories', { params }),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PUT', body }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getBudget: (month) => request('/budgets', { params: { month } }),
  setBudget: (body) => request('/budgets', { method: 'PUT', body }),
  deleteBudget: (month) => request('/budgets', { method: 'DELETE', params: { month } }),

  monthlyReport: (month) => request('/reports/monthly', { params: { month } }),
  yearlyReport: (year) => request('/reports/yearly', { params: { year } }),
  downloadMonthlyReport: (month) => download('/reports/monthly/download', { month }, `expense-report-${month}.csv`),
};
