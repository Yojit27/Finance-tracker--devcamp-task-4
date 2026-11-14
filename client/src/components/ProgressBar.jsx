// status: 'ok' | 'warning' | 'exceeded' | 'income' | 'neutral'
export default function ProgressBar({ percent, status = 'neutral', label }) {
  const width = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <div className={`progress-fill progress-${status}`} style={{ width: `${width}%` }} />
    </div>
  );
}
