import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ArticleCard from "../components/ArticleCard.jsx";
import { useSaved } from "../saved.jsx";

const SECTIONS = ["Saved items", "Favorites", "Comparisons"];
const comparisonTitle = (items) => items.map((item) => {
  const match = String(item).match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  return match ? `${match[1]}/${match[2].replace(/\.git$/, "")}` : item;
}).join(" vs ");

export default function Saved() {
  const { saved, favorites, favoritesError, toggleFavorite } = useSaved();
  const [comparisons, setComparisons] = useState([]);
  const [active, setActive] = useState(SECTIONS[0]);
  const [openComparison, setOpenComparison] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/comparisons").then(setComparisons).catch((err) => setError(err.message));
  }, []);

  async function deleteComparison(id) {
    if (!confirm("Delete this saved comparison?")) return;
    setError("");
    try {
      await api(`/comparisons/${id}`, { method: "DELETE" });
      setComparisons((list) => list.filter((comparison) => comparison.id !== id));
      if (openComparison?.id === id) setOpenComparison(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">YOUR PERSONAL COLLECTION</span>
        <h1>Saved library</h1>
        <p className="hero-description">Articles, starred GitHub projects, and comparison reports—all in one place.</p>
      </div>
      {error && <p className="error">{error}</p>}
      {active === "Favorites" && favoritesError && <p className="error">Couldn’t load favorites: {favoritesError}</p>}
      <div className="library-tabs" role="tablist" aria-label="Saved library sections">
        {SECTIONS.map((section, index) => {
          const count = index === 0 ? saved.length : index === 1 ? favorites.length : comparisons.length;
          return (
            <button
              key={section}
              className={`library-tab ${active === section ? "active" : ""}`}
              role="tab"
              aria-selected={active === section}
              onClick={() => {
                setActive(section);
                setOpenComparison(null);
              }}
            >
              {section}<span>{count}</span>
            </button>
          );
        })}
      </div>

      {active === "Saved items" && (
        <div className="stack">
          {saved.length === 0 ? (
            <div className="card library-empty">
              <span className="empty-symbol">▤</span>
              <h2>Your library is ready</h2>
              <p className="muted">Save useful stories from the dashboard or research results to find them here.</p>
              <Link className="btn" to="/">Explore dashboard</Link>
            </div>
          ) : saved.map((item) => <ArticleCard key={item.id} item={item} />)}
        </div>
      )}

      {active === "Favorites" && (
        <div className="stack">
          {favorites.length === 0 ? (
            <div className="card library-empty">
              <span className="empty-symbol">☆</span>
              <h2>No favorites yet</h2>
              <p className="muted">Star any useful article, repository, model, question, or research result to keep it here.</p>
              <Link className="btn" to="/">Find repositories</Link>
            </div>
          ) : favorites.map((favorite) => (
            <article className="card favorite-repo-card" key={favorite.id}>
              <span className="favorite-star" aria-hidden="true">★</span>
              <div className="article-body">
                <div className="article-meta">
                  <span className="badge">{favorite.source || (/github\.com/i.test(favorite.url) ? "GitHub" : "Website")}</span>
                  {favorite.metric > 0 && <span className="muted">{Math.round(favorite.metric).toLocaleString()} {favorite.metric_label}</span>}
                </div>
                <a className="article-title" href={favorite.url} target="_blank" rel="noreferrer">{favorite.name}</a>
                {favorite.description && <p className="muted article-desc">{favorite.description}</p>}
              </div>
              <button
                className="btn btn-outline"
                onClick={() => toggleFavorite({ url: favorite.url }).catch((err) => setError(err.message))}
              >
                Unstar
              </button>
            </article>
          ))}
        </div>
      )}

      {active === "Comparisons" && (
        <div className="stack">
          {comparisons.length === 0 ? (
            <div className="card library-empty">
              <span className="empty-symbol">⇄</span>
              <h2>No saved comparison reports</h2>
              <p className="muted">Compare dashboard items or repositories, then choose “Save comparison” to keep the result.</p>
              <Link className="btn" to="/compare">Compare items</Link>
            </div>
          ) : comparisons.map((comparison) => (
            <article className="card comparison-library-card" key={comparison.id}>
              <div className="comparison-library-head">
                <div>
                  <span className="eyebrow">SAVED REPORT</span>
                  <h2>{comparisonTitle(comparison.repos)}</h2>
                  <span className="muted">{comparison.repos.length} items · {new Date(comparison.created_at).toLocaleDateString()}</span>
                </div>
                <div className="row">
                  <button className="btn btn-outline" onClick={() => setOpenComparison(openComparison?.id === comparison.id ? null : comparison)}>
                    {openComparison?.id === comparison.id ? "Close report" : "Open report"}
                  </button>
                  <button className="btn btn-danger" onClick={() => deleteComparison(comparison.id)}>Delete</button>
                </div>
              </div>
              {openComparison?.id === comparison.id && (
                <div className="markdown comparison-library-result">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparison.result}</ReactMarkdown>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
