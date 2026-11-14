// All dates are stored and compared as UTC midnight. The client sends "YYYY-MM-DD".

export const currentMonth = () => new Date().toISOString().slice(0, 7);

// "2026-11" -> { start: 2026-11-01Z, end: 2026-12-01Z (exclusive) } or null if invalid
export const monthRange = (month) => {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(month || ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return { start: new Date(Date.UTC(y, mo - 1, 1)), end: new Date(Date.UTC(y, mo, 1)) };
};

export const yearRange = (year) => {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 1970 || y > 9999) return null;
  return { start: new Date(Date.UTC(y, 0, 1)), end: new Date(Date.UTC(y + 1, 0, 1)) };
};

// "YYYY-MM-DD" -> Date (UTC midnight) or null
export const parseDateOnly = (value) => {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime()) || d.getUTCMonth() !== Number(m[2]) - 1) return null;
  return d;
};

export const todayUTC = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
};

const daysIn = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

// Next occurrence after `date`. `anchorDay` keeps "31st" style schedules stable across short months.
export const addInterval = (date, frequency, anchorDay = date.getUTCDate()) => {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  switch (frequency) {
    case 'daily':
      return new Date(date.getTime() + 86400000);
    case 'weekly':
      return new Date(date.getTime() + 7 * 86400000);
    case 'monthly': {
      const ny = y + Math.floor((m + 1) / 12);
      const nm = (m + 1) % 12;
      return new Date(Date.UTC(ny, nm, Math.min(anchorDay, daysIn(ny, nm))));
    }
    case 'yearly': {
      const ny = y + 1;
      return new Date(Date.UTC(ny, m, Math.min(anchorDay, daysIn(ny, m))));
    }
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
};
