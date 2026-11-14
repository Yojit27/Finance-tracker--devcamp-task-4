import { CURRENCY } from '../config.js';

const moneyFmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY });

export const formatMoney = (n) => moneyFmt.format(Number(n) || 0);

// Dates from the API are UTC midnight, so format them in UTC to avoid off-by-one-day errors.
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const toDateInput = (iso) => new Date(iso).toISOString().slice(0, 10);

const pad = (n) => String(n).padStart(2, '0');

// Today's date in the user's own timezone as YYYY-MM-DD
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const currentMonth = () => todayISO().slice(0, 7);

export const monthLabel = (month, short = false) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: short ? 'short' : 'long',
    year: short ? undefined : 'numeric',
    timeZone: 'UTC',
  });
};

export const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
