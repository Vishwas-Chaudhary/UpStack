import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import ArticleCard from "../components/ArticleCard.jsx";
import TrendChart from "../components/TrendChart.jsx";

export default function Technology() {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api("/trending")
      .then(() => api(`/technologies/${encodeURIComponent(name)}`))
      .then((profile) => {
        if (active) setData(profile);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [name]);

  if (error) {
    return (
      <>
        <p className="error">{error}</p>
        <Link to="/">Back to dashboard</Link>
      </>
    );
  }
  if (!data) return <p className="center-note">Loading technology profile…</p>;

  const { technology, history, items } = data;
  return (
    <>
      <div className="page-head technology-hero">
        <span className="eyebrow">TECHNOLOGY PROFILE · {technology.category || "ECOSYSTEM"}</span>
        <h1>{technology.name}</h1>
        <p className="hero-description">
          Showing up in {technology.source_count} {technology.source_count === 1 ? "source" : "sources"} across {technology.item_count} current signals.
        </p>
        <Link className="btn" to={`/research?q=${encodeURIComponent(technology.name)}`}>Research {technology.name}</Link>
      </div>

      <section className="card panel">
        <div className="section-head tight">
          <div>
            <span className="eyebrow">OBSERVED OVER TIME</span>
            <h2>Trend history</h2>
          </div>
          <span className="muted">Daily ecosystem score</span>
        </div>
        <TrendChart points={history} />
      </section>

      <div className="section-head">
        <div>
          <span className="eyebrow">RELATED SIGNALS</span>
          <h2>Latest mentions</h2>
        </div>
        <Link to={`/research?q=${encodeURIComponent(technology.name)}`}>Search all sources</Link>
      </div>
      <div className="stack">
        {items.length ? items.map((item) => <ArticleCard key={item.url} item={item} />) : (
          <p className="muted">No related feed items are currently cached. Try searching for this technology.</p>
        )}
      </div>
    </>
  );
}
