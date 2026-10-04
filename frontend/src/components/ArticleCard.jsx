import { useState } from "react";
import { useSaved } from "../saved.jsx";

export default function ArticleCard({ item, selectable = false, selected = false, onSelect }) {
  const { find, toggle, findFavorite, toggleFavorite } = useSaved();
  const [busy, setBusy] = useState(false);
  const isSaved = !!find(item.url);
  const isFavorite = !!findFavorite(item.url);

  async function onToggle() {
    setBusy(true);
    try {
      await toggle(item);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onFavorite() {
    setBusy(true);
    try {
      await toggleFavorite(item);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card article">
      {selectable && (
        <label className="article-select">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(item)}
            aria-label={`Select ${item.title}`}
          />
        </label>
      )}
      <div className="article-body">
        <div className="article-meta">
          {item.source && <span className="badge">{item.source}</span>}
          {item.metric > 0 && (
            <span className="muted">
              {Math.round(item.metric).toLocaleString()} {item.metric_label}
            </span>
          )}
        </div>
        <a className="article-title" href={item.url} target="_blank" rel="noreferrer">
          {item.title}
        </a>
        {item.description && <p className="muted article-desc">{item.description}</p>}
        {item.tags?.length > 0 && (
          <div className="chips">
            {item.tags.map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="article-actions">
        <button
          className={`favorite-toggle ${isFavorite ? "is-favorite" : ""}`}
          onClick={onFavorite}
          disabled={busy}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? "★" : "☆"}
        </button>
        <button className={`btn ${isSaved ? "btn-outline" : ""}`} onClick={onToggle} disabled={busy}>
          {isSaved ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  );
}
