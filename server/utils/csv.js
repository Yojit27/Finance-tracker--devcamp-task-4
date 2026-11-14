// Escapes a CSV cell. Strings starting with = + - @ are prefixed with ' to block spreadsheet formula injection.
const cell = (value) => {
  let s = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
};

// rows: array of arrays. A leading BOM makes Excel read UTF-8 correctly.
export const toCsv = (rows) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');

export const sendCsv = (res, filename, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(toCsv(rows));
};
