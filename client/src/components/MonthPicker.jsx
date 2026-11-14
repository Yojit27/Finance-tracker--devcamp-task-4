import { monthLabel, shiftMonth } from '../utils/format.js';

export default function MonthPicker({ value, onChange }) {
  return (
    <div className="month-picker no-print">
      <button type="button" className="btn btn-small" aria-label="Previous month" onClick={() => onChange(shiftMonth(value, -1))}>
        ‹
      </button>
      <label className="month-label">
        <span className="sr-only">Select month</span>
        <input type="month" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />
        <span className="month-text" aria-hidden="true">
          {monthLabel(value)}
        </span>
      </label>
      <button type="button" className="btn btn-small" aria-label="Next month" onClick={() => onChange(shiftMonth(value, 1))}>
        ›
      </button>
    </div>
  );
}
