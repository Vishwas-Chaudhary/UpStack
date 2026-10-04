import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import ArticleCard from "../components/ArticleCard.jsx";
import SelectionActions from "../components/SelectionActions.jsx";

export default function Research() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setInput(q);
    setError("");
    if (!q) return setData(null);
    setLoading(true);
    api(`/research?q=${encodeURIComponent(q)}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q]);

  function submit(e) {
    e.preventDefault();
    if (input.trim()) setParams({ q: input.trim() });
  }

  function toggleSelected(item) {
    setSelected((list) =>
      list.some((entry) => entry.url === item.url)
        ? list.filter((entry) => entry.url !== item.url)
        : [...list, item]
    );
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">DISCOVER ACROSS THE WEB</span>
        <h1>Idea researcher</h1>
        <p className="hero-description">Search GitHub, Dev.to, Reddit and Stack Overflow at once.</p>
      </div>

      <form className="inline-form research-search" onSubmit={submit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. WebSockets" />
        <button className="btn" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
      </form>

      {error && <p className="error">{error}</p>}

      {data?.results.map((group) => (
        <section key={group.source}>
          <div className="section-head">
            <h2>{group.source}</h2>
          </div>
          <div className="stack">
            {group.items.length === 0 && (
              <p className="muted">No results (this source may be rate limiting requests).</p>
            )}
            {group.items.map((item) => (
              <ArticleCard
                key={item.url}
                item={item}
                selectable
                selected={selected.some((entry) => entry.url === item.url)}
                onSelect={toggleSelected}
              />
            ))}
          </div>
        </section>
      ))}
      {selected.length > 0 && (
        <SelectionActions items={selected} onClear={() => setSelected([])} />
      )}
    </>
  );
}
