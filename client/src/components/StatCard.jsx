export default function StatCard({ label, value, tone = 'neutral', hint }) {
  return (
    <div className={`card stat stat-${tone}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
