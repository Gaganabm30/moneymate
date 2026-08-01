function StatCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="card stat-card">
      <p>{title}</p>

      <h2>{value}</h2>

      {subtitle && (
        <span className="muted">
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default StatCard;