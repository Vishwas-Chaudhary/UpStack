const SOURCE_COLORS = {
  GitHub: "#aeb79f",
  "Hacker News": "#d6a36e",
  "Stack Overflow": "#b7a47b",
  "Dev.to": "#93a98a",
  Lobsters: "#bd8b82",
  "Hugging Face": "#c2b477",
};
const SOURCE_LABELS = {
  "Hacker News": "Hacker News",
  "Stack Overflow": "Stack O.",
  "Hugging Face": "Hugging Face",
};
const WIDTH = 600;
const HEIGHT = 190;
const PADDING = { top: 22, right: 12, bottom: 42, left: 34 };

export default function LiveSourceChart({ items }) {
  const sources = Object.entries(items.reduce((counts, item) => {
    counts[item.source] = (counts[item.source] || 0) + 1;
    return counts;
  }, {}))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  if (!sources.length) {
    return <p className="muted">No live source data is available yet.</p>;
  }

  const max = sources[0].count;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const slotWidth = plotWidth / sources.length;
  const ticks = max > 1 ? [max, Math.floor(max / 2), 0] : [1, 0];

  return (
    <div className="live-source-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Bar chart of current feed items by platform">
        {ticks.map((tick, index) => {
          const y = PADDING.top + (index / (ticks.length - 1)) * plotHeight;
          return (
            <g key={`${tick}-${index}`}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="source-chart-grid" />
              <text x={PADDING.left - 7} y={y + 3} textAnchor="end" className="source-chart-axis-label">{tick}</text>
            </g>
          );
        })}
        {sources.map((source, index) => {
          const barHeight = (source.count / max) * plotHeight;
          const x = PADDING.left + index * slotWidth + slotWidth * 0.2;
          const barWidth = slotWidth * 0.6;
          return (
            <g key={source.name}>
              <rect
                x={x}
                y={PADDING.top + plotHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx="5"
                fill={SOURCE_COLORS[source.name] || "#aeb79f"}
                className="source-chart-bar"
              />
              <text x={x + barWidth / 2} y={PADDING.top + plotHeight - barHeight - 7} textAnchor="middle" className="source-chart-value">{source.count}</text>
              <text x={x + barWidth / 2} y={HEIGHT - 13} textAnchor="middle" className="source-chart-axis-label">
                <title>{source.name}</title>
                {SOURCE_LABELS[source.name] || source.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
