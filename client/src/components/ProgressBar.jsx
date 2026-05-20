export default function ProgressBar({ current, total, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div
      className="progress-wrap"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={label || "Bulk update progress"}
    >
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-count">
          {current} / {total} ({pct}%)
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
