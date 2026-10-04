const WIDTH = 720;
const HEIGHT = 230;
const PADDING = { top: 16, right: 20, bottom: 38, left: 48 };

export default function TrendChart({ points }) {
  if (points.length === 0) {
    return (
      <div className="chart-empty">
        <span className="chart-empty-mark" aria-hidden="true">↗</span>
        <strong>No daily snapshots recorded yet</strong>
        <p>Visit the dashboard to collect the first real ecosystem score for this technology.</p>
      </div>
    );
  }

  const values = points.map((point) => Number(point.score) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || Math.max(max, 1);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const coordinates = points.map((point, index) => {
    const x = points.length === 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (points.length - 1)) * plotWidth;
    const y = points.length === 1
      ? PADDING.top + plotHeight / 2
      : PADDING.top + ((max - Number(point.score)) / range) * plotHeight;
    return { x, y, point };
  });
  const polyline = coordinates.map(({ x, y }) => `${x},${y}`).join(" ");
  const area = `${PADDING.left},${HEIGHT - PADDING.bottom} ${polyline} ${WIDTH - PADDING.right},${HEIGHT - PADDING.bottom}`;

  return (
    <div className="trend-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Technology score over time">
        <defs>
          <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#54c7f3" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#54c7f3" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = PADDING.top + (line / 3) * plotHeight;
          const value = max - (line / 3) * range;
          return (
            <g key={line}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="chart-grid" />
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="chart-label">{Math.round(value)}</text>
            </g>
          );
        })}
        {points.length > 1 && <polygon points={area} fill="url(#trend-fill)" />}
        {points.length > 1 && <polyline points={polyline} className="chart-line" />}
        {coordinates.map(({ x, y, point }) => (
          <circle key={point.snapshot_date} cx={x} cy={y} r={points.length === 1 ? "6" : "4"} className="chart-point">
            <title>{point.snapshot_date}: {Number(point.score).toFixed(1)}</title>
          </circle>
        ))}
        {points.length === 1 ? (
          <>
            <text x={coordinates[0].x} y={coordinates[0].y - 14} textAnchor="middle" className="chart-label">
              {Number(points[0].score).toFixed(1)}
            </text>
            <text x={coordinates[0].x} y={HEIGHT - 10} textAnchor="middle" className="chart-label">
              {points[0].snapshot_date}
            </text>
          </>
        ) : (
          <>
            <text x={PADDING.left} y={HEIGHT - 10} className="chart-label">{points[0].snapshot_date}</text>
            <text x={WIDTH - PADDING.right} y={HEIGHT - 10} textAnchor="end" className="chart-label">{points[points.length - 1].snapshot_date}</text>
          </>
        )}
      </svg>
      {points.length === 1 && <p className="chart-single-note">First daily snapshot recorded. The trend line will appear after another day of data.</p>}
    </div>
  );
}
