import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLocation } from "react-router-dom";
import { api } from "../api.js";
import { useSaved } from "../saved.jsx";

const MAX = 5;
const GITHUB_REPO = /github\.com\/([^/\s]+)\/([^/\s#?]+)/i;

// "https://github.com/a/b/tree/main" -> "https://github.com/a/b" (or null if not a repo link)
function repoUrl(url) {
  const m = String(url).match(GITHUB_REPO);
  return m ? `https://github.com/${m[1]}/${m[2].replace(/\.git$/, "")}` : null;
}
const shortName = (url) => url.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/$/, "");
const key = (url) => url.toLowerCase();
const title = (items) => items.map((item) => {
  const value = String(item);
  return repoUrl(value) ? shortName(repoUrl(value)) : value;
}).join(" vs ");

export default function Compare() {
  const { saved, favorites } = useSaved();
  const location = useLocation();
  const [trending, setTrending] = useState([]);
  const [custom, setCustom] = useState([]); // repos added by pasting a link
  const [searchResults, setSearchResults] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState([]); // ticked repo URLs (max 5)
  const [dashboardItems, setDashboardItems] = useState([]);
  const [link, setLink] = useState("");
  const [current, setCurrent] = useState(null); // { repos, result, id? }
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "I’m Pino. Ask me about this comparison; I’ll base my answers on the report above." },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    api("/comparisons").then(setHistory).catch(() => {});
    api("/trending")
      .then((d) => setTrending(d.items.filter((i) => i.source === "GitHub")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const repos = location.state?.repos;
    const items = location.state?.items;
    if (Array.isArray(repos)) {
      setSelected(repos.map(repoUrl).filter(Boolean).slice(0, MAX));
      setDashboardItems([]);
    } else if (Array.isArray(items)) {
      setSelected([]);
      setDashboardItems(items.slice(0, MAX));
    } else {
      setDashboardItems([]);
    }
  }, [location.key]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError("");
      return;
    }
    let active = true;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    api(`/research?q=${encodeURIComponent(searchQuery)}`)
      .then((data) => {
        if (!active) return;
        const github = data.results.find((group) => group.source === "GitHub");
        setSearchResults(github?.items || []);
      })
      .catch((err) => {
        if (active) setSearchError(err.message);
      })
      .finally(() => {
        if (active) setSearchLoading(false);
      });
    return () => {
      active = false;
    };
  }, [searchQuery]);

  // One de-duplicated list of repos the user can tick, grouped by where they came from.
  const groups = useMemo(() => {
    const seen = new Set();
    const take = (list) =>
      list.flatMap((x) => {
        const url = repoUrl(x.url);
        if (!url || seen.has(key(url))) return [];
        seen.add(key(url));
        return [{ url, name: shortName(url), description: x.description, metric: x.metric, label: x.metric_label }];
      });
    return [
      { title: searchQuery ? `GitHub search: ${searchQuery}` : "", repos: take(searchResults) },
      { title: "Added by link", repos: take(custom.map((url) => ({ url }))) },
      {
        title: "Your saved & favorite repositories",
        repos: take([
          ...favorites.filter((favorite) => favorite.source === "GitHub" || /github\.com/i.test(favorite.url)),
          ...saved,
        ]),
      },
      { title: "Trending on GitHub this week", repos: take(trending) },
    ].filter((g) => g.repos.length > 0);
  }, [custom, favorites, saved, searchQuery, searchResults, trending]);

  const isSelected = (url) => selected.some((u) => key(u) === key(url));
  const full = selected.length >= MAX;

  function toggle(url) {
    setSelected((list) => {
      if (list.some((u) => key(u) === key(url))) return list.filter((u) => key(u) !== key(url));
      return list.length < MAX ? [...list, url] : list;
    });
  }

  function addLink(e) {
    e.preventDefault();
    const url = repoUrl(link);
    if (!url) return setError("That doesn’t look like a GitHub repository link.");
    setError("");
    if (!custom.some((u) => key(u) === key(url))) setCustom([...custom, url]);
    if (!isSelected(url) && !full) setSelected([...selected, url]);
    setLink("");
  }

  function search(e) {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  }

  async function run() {
    setLoading(true);
    setError("");
    setCurrent(null);
    setChatMessages([{ role: "assistant", text: "I’m Pino. Ask me about this comparison; I’ll base my answers on the report above." }]);
    try {
      const result = dashboardItems.length
        ? await api("/compare/items", { method: "POST", body: { items: dashboardItems } })
        : await api("/compare", { method: "POST", body: { repos: selected } });
      setCurrent(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function askAboutComparison(event) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message || chatLoading || !current) return;

    const history = chatMessages
      .filter((entry) => entry.role === "user" || entry.role === "assistant")
      .slice(-10);
    setChatMessages((list) => [...list, { role: "user", text: message }]);
    setChatDraft("");
    setChatLoading(true);
    try {
      const response = await api("/compare/ask", {
        method: "POST",
        body: {
          repos: current.repos,
          result: current.result,
          history,
          message,
        },
      });
      setChatMessages((list) => [...list, { role: "assistant", text: response.answer }]);
    } catch (chatError) {
      setChatMessages((list) => [...list, { role: "error", text: chatError.message }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function save() {
    try {
      const record = await api("/comparisons", {
        method: "POST",
        body: { repos: current.repos, result: current.result },
      });
      setHistory((h) => [record, ...h]);
      setCurrent(record);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this comparison?")) return;
    await api(`/comparisons/${id}`, { method: "DELETE" });
    setHistory((h) => h.filter((c) => c.id !== id));
    if (current?.id === id) setCurrent(null);
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">COMPARISON LAB</span>
        <h1>Compare items</h1>
        <p className="hero-description">
          Compare 2–{MAX} dashboard items from any source, or compare GitHub repositories using their READMEs.
        </p>
      </div>

      {dashboardItems.length > 0 ? (
        <section className="card panel picker">
          <h2>Selected dashboard items</h2>
          <p className="muted">Compare items selected from any dashboard source. You can compare 2–5 at a time.</p>
          <div className="repo-list">
            {dashboardItems.map((item) => (
              <div key={`${item.source}:${item.url}`} className="repo-row">
                <span className="repo-info">
                  <strong>{item.title}</strong>
                  <span className="muted">{item.source}</span>
                </span>
                <button
                  className="btn btn-quiet-dark"
                  onClick={() => setDashboardItems((list) => list.filter((entry) => entry.url !== item.url))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="picker-bar">
            <span className={dashboardItems.length >= 2 && dashboardItems.length <= MAX ? "" : "muted"}>
              {dashboardItems.length} selected{dashboardItems.length < 2 ? " · pick at least 2" : dashboardItems.length > MAX ? ` · maximum ${MAX}` : ""}
            </span>
            <div className="row">
              <button className="btn btn-quiet-dark" onClick={() => setDashboardItems([])}>Clear</button>
              <button className="btn" onClick={run} disabled={loading || dashboardItems.length < 2 || dashboardItems.length > MAX}>
                {loading ? "Comparing…" : "Compare"}
              </button>
            </div>
          </div>
        </section>
      ) : (
      <section className="card panel picker">
        <form className="inline-form compare-search" onSubmit={search}>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search GitHub repositories, e.g. React"
            aria-label="Search GitHub repositories"
          />
          <button className="btn" disabled={searchLoading || !searchInput.trim()}>
            {searchLoading ? "Searching…" : "Search GitHub"}
          </button>
        </form>
        {searchError && <p className="error">{searchError}</p>}
        {searchQuery && !searchLoading && !searchError && searchResults.length === 0 && (
          <p className="muted">No GitHub repositories found for “{searchQuery}”.</p>
        )}

        <form className="inline-form" onSubmit={addLink}>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste a GitHub link, e.g. https://github.com/facebook/react"
          />
          <button className="btn btn-outline">Add link</button>
        </form>

        {groups.map((group) => (
          <div key={group.title} className="repo-group">
            {group.title && <h3>{group.title}</h3>}
            <div className="repo-list">
              {group.repos.map((r) => {
                const checked = isSelected(r.url);
                const disabled = !checked && full;
                return (
                  <label key={r.url} className={`repo-row ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}`}>
                    <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(r.url)} />
                    <span className="repo-info">
                      <strong>{r.name}</strong>
                      {r.description && <span className="muted">{r.description}</span>}
                    </span>
                    {r.metric > 0 && (
                      <span className="muted repo-metric">
                        {Math.round(r.metric).toLocaleString()} {r.label}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className="muted">Paste a link above, or save repositories from the dashboard to pick them here.</p>
        )}

        <div className="picker-bar">
          <span className={selected.length >= 2 ? "" : "muted"}>
            {selected.length} of {MAX} selected{selected.length < 2 ? " · pick at least 2" : ""}
          </span>
          <div className="row">
            {selected.length > 0 && (
              <button className="btn btn-quiet-dark" onClick={() => setSelected([])}>Clear</button>
            )}
            <button className="btn" onClick={run} disabled={loading || selected.length < 2}>
              {loading ? "Comparing…" : "Compare"}
            </button>
          </div>
        </div>
      </section>
      )}

      {error && <p className="error">{error}</p>}

      {current && (
        <section className="card panel">
          <div className="section-head tight">
            <h2>{title(current.repos)}</h2>
            {current.id ? (
              <span className="muted">Saved</span>
            ) : (
              <button className="btn" onClick={save}>Save comparison</button>
            )}
          </div>
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.result}</ReactMarkdown>
          </div>
          <section className="comparison-chat" aria-label="Ask Pino about this comparison">
            <div className="section-head tight">
              <div>
                <span className="eyebrow">FOLLOW-UP CHAT</span>
                <h3>Ask Pino</h3>
              </div>
            </div>
            <p className="muted">Ask questions about the repositories, fetched details, or this comparison result.</p>
            <div className="chat-messages" aria-live="polite">
              {chatMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
                  {message.text}
                </div>
              ))}
              {chatLoading && <div className="chat-typing">Thinking<span> · · ·</span></div>}
            </div>
            <form className="chat-form" onSubmit={askAboutComparison}>
              <input
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Ask about this comparison…"
                aria-label="Ask about this comparison"
                maxLength={1000}
              />
              <button className="btn" disabled={chatLoading || !chatDraft.trim()} aria-label="Send question">↑</button>
            </form>
          </section>
        </section>
      )}

      <div className="section-head">
        <h2>Previous comparisons</h2>
      </div>
      <div className="stack">
        {history.length === 0 && <p className="muted">Comparisons you save will show up here.</p>}
        {history.map((c) => (
          <div key={c.id} className="card article">
            <div className="article-body">
              <strong>{title(c.repos)}</strong>
              <div className="muted">
                {c.repos.length} items · {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="row">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setCurrent(c);
                  setChatMessages([{ role: "assistant", text: "I’m Pino. Ask me about this comparison; I’ll base my answers on the report above." }]);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Open
              </button>
              <button className="btn btn-danger" onClick={() => remove(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
