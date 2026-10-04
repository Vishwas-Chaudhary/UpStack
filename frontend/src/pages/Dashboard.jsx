import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ArticleCard from "../components/ArticleCard.jsx";
import SelectionActions from "../components/SelectionActions.jsx";
import LiveSourceChart from "../components/LiveSourceChart.jsx";

const CATEGORIES = ["All", "Frontend", "Backend", "AI/ML", "Cloud", "Data", "Mobile", "DevOps", "Systems", "Testing"];
const SOURCES = ["All", "GitHub", "Hacker News", "Stack Overflow", "Dev.to", "Lobsters", "Hugging Face"];
const CATEGORY_MARKS = {
  "AI/ML": "AI",
  Frontend: "</>",
  Cloud: "☁",
  Data: "DB",
  Security: "SEC",
  Mobile: "APP",
  DevOps: "OPS",
  Systems: "SYS",
  Testing: "QA"
};
const CATEGORY_RESEARCH_SUGGESTIONS = {
  Data: ["Apache Kafka", "DuckDB", "ClickHouse", "dbt"],
  Testing: ["Playwright", "Vitest", "Cypress", "Jest"]
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All"); // global ecosystem filter
  const [source, setSource] = useState("All");
  const [selected, setSelected] = useState([]);
  const [digest, setDigest] = useState(null);
  const [digestError, setDigestError] = useState("");
  const [sort, setSort] = useState("score");
  const [rankings, setRankings] = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsError, setRankingsError] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = () => api("/trending")
      .then((trends) => {
        if (!active) return;
        setData(trends);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    let active = true;
    api("/digest")
      .then((briefing) => {
        if (active) setDigest(briefing);
      })
      .catch((err) => {
        if (active) setDigestError(err.message);
      });
    return () => {
      active = false;
    };
  }, [data?.generated_at]);

  useEffect(() => {
    if (!data) return;
    let active = true;
    setRankingsLoading(true);
    setRankingsError("");
    api("/rankings?period=overall")
      .then((result) => {
        if (active) setRankings(result.rankings || []);
      })
      .catch((err) => {
        if (active) setRankingsError(err.message);
      })
      .finally(() => {
        if (active) setRankingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [data]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="center-note">Gathering signals from the tech community…</p>;

  const inCategory = (c) => category === "All" || c === category;
  const techs = data.technologies.filter((t) => inCategory(t.category)).slice(0, 12);
  const items = data.items
    .filter((i) => (category === "All" || i.categories.includes(category)) && (source === "All" || i.source === source))
    .sort((a, b) => sort === "title"
      ? a.title.localeCompare(b.title)
      : b.score - a.score)
    .slice(0, 30);
  const featured = techs.slice(0, 3);
  const periodRankings = rankings
    .filter((technology) => inCategory(technology.category))
    .slice(0, 8);
  const topRanking = periodRankings[0]?.score || 1;
  const isSelected = (item) => selected.some((entry) => entry.url === item.url);
  const toggleSelected = (item) => setSelected((list) =>
    list.some((entry) => entry.url === item.url)
      ? list.filter((entry) => entry.url !== item.url)
      : [...list, item]
  );

  return (
    <>
      <div className="dashboard-top-grid">
        <div className="page-head dashboard-hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="live-dot" /> LIVE ECOSYSTEM PULSE</span>
            <h1>Signals from the<span>tech frontier.</span></h1>
            <p className="hero-description">
              Discover the tools, ideas, and repositories developers are talking about right now.
            </p>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{data.items.length}</span>
            <span className="hero-stat-label">fresh signals</span>
            <span className="hero-stat-foot">Across {new Set(data.items.map((item) => item.source)).size} platforms</span>
            <span className="hero-updated">Updated {new Date(data.generated_at).toLocaleTimeString()}</span>
          </div>
        </div>
        <section className="card panel rail-chart top-live-chart">
          <div className="live-chart-heading">
            <div>
              <span className="eyebrow"><span className="live-dot" /> LIVE FEED GRAPH</span>
              <h2>Source activity</h2>
            </div>
            <span className="live-refresh-label">Refreshes every minute</span>
          </div>
          <p className="muted">Feed items by platform · {data.items.length} signals</p>
          <LiveSourceChart items={data.items} />
        </section>
      </div>

      <div className="chips filters" role="tablist" aria-label="Ecosystem">
        {CATEGORIES.map((c) => (
          <button key={c} className={`pill ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="dashboard-feature-layout">
        <section className="spotlight-section">
          <div className="section-head spotlight-heading">
            <div>
              <span className="eyebrow">WHAT DEVELOPERS ARE EXPLORING</span>
              <h2>Technology spotlight</h2>
            </div>
            <span className="muted">Current cross-source score</span>
          </div>
          {featured.length === 0 ? (
            <div className="spotlight-empty">
              <p className="muted">
                No {category === "All" ? "" : `${category} `}signals are in the current feed yet. Technology spotlights appear when matching items are found.
              </p>
              {CATEGORY_RESEARCH_SUGGESTIONS[category] && (
                <div className="spotlight-suggestions" aria-label={`Research ${category} technologies`}>
                  {CATEGORY_RESEARCH_SUGGESTIONS[category].map((technology) => (
                    <Link
                      key={technology}
                      className="pill"
                      to={`/research?q=${encodeURIComponent(technology)}`}
                    >
                      Research {technology}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="spotlight-grid">
              {featured.map((technology, index) => (
                <Link
                  key={technology.name}
                  to={`/technology/${encodeURIComponent(technology.name)}`}
                  className={`card spotlight-card spotlight-rank-${index + 1}`}
                >
                  <span className="spotlight-rank">0{index + 1} / TRENDING</span>
                  <span className="spotlight-icon" aria-hidden="true">{CATEGORY_MARKS[technology.category] || "API"}</span>
                  <strong>{technology.name}</strong>
                  <span className="spotlight-category">{technology.category || "Emerging technology"}</span>
                  <span className="spotlight-score">{Math.round(technology.score)}<small> momentum</small></span>
                  <span className="spotlight-foot">{technology.source_count} sources · {technology.item_count} signals</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="card panel digest-panel">
          <div className="section-head tight">
            <div>
              <span className="eyebrow">YOUR DAILY BRIEFING</span>
              <h2>Today’s highlights</h2>
            </div>
            <span className="digest-date">{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          </div>
          <div className="digest-techs">
            {(digest?.technologies || []).slice(0, 4).map((technology) => (
              <Link key={technology.name} to={`/technology/${encodeURIComponent(technology.name)}`}>
                <span>{technology.name}</span><strong>{Math.round(technology.score)}</strong>
              </Link>
            ))}
          </div>
          <div className="digest-stories">
            {(digest?.stories || []).slice(0, 3).map((item) => (
              <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="digest-story">
                <span className="badge">{item.source}</span>
                <strong>{item.title}</strong>
                <span className="muted">{Math.round(item.score)} ecosystem points</span>
              </a>
            ))}
            {digest && digest.stories.length === 0 && <p className="muted">No source stories are available right now.</p>}
          </div>
        </section>
      </div>

      <div className="feed-layout">
        <section className="feed-main">
          <div className="section-head feed-heading">
            <div>
              <span className="eyebrow">LIVE COMMUNITY SIGNALS</span>
              <h2>Trending feed</h2>
            </div>
            <div className="feed-controls">
              <label className="filter-control">Source
                <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="filter-control">Sort
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort feed">
                  <option value="score">Ecosystem momentum</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            </div>
          </div>
          {digestError && <p className="muted">The daily briefing is temporarily unavailable: {digestError}</p>}
          <div className="stack">
            {items.length === 0 && <p className="muted">No posts match these filters.</p>}
            {items.map((item) => (
              <ArticleCard
                key={item.url}
                item={item}
                selectable
                selected={isSelected(item)}
                onSelect={toggleSelected}
              />
            ))}
          </div>
          {selected.length > 0 && (
            <SelectionActions items={selected} onClear={() => setSelected([])} />
          )}
        </section>

        <aside className="trending-rail">
          <section className="card panel rail-trending">
            <div className="section-head tight">
              <div>
                <span className="eyebrow">UPSTACK RANKINGS</span>
                <h2>Technology leaderboard</h2>
              </div>
              <span className="live-dot" aria-label="Live trend data" />
            </div>
            <p className="ranking-explainer">Current scores across the live feed.</p>
            {rankingsError && <p className="error">Couldn’t load rankings: {rankingsError}</p>}
            <ol className="rail-tech-list">
              {periodRankings.map((technology, index) => (
                <li key={technology.name}>
                  <span className="rail-rank">{String(index + 1).padStart(2, "0")}</span>
                  <Link to={`/technology/${encodeURIComponent(technology.name)}`}>
                    <strong>{technology.name}</strong>
                    <small>{technology.category || "Emerging"} · {technology.source_count} sources</small>
                    <span className="ranking-meter"><span style={{ width: `${Math.max(4, (technology.score / topRanking) * 100)}%` }} /></span>
                  </Link>
                  <span className="rail-score">{Math.round(technology.score)}</span>
                </li>
              ))}
            </ol>
            {rankingsLoading && <p className="muted ranking-status">Updating rankings…</p>}
            {!rankingsLoading && periodRankings.length === 0 && (
              <p className="muted ranking-status">
                "No current rankings are available."
              </p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
