import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSaved } from "../saved.jsx";

export default function SelectionActions({ items, onClear }) {
  const navigate = useNavigate();
  const { find, toggle } = useSaved();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canCompare = items.length >= 2 && items.length <= 5;

  async function saveSelected() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const unsaved = items.filter((item) => !find(item.url));
      await Promise.all(unsaved.map((item) => toggle(item)));
      setMessage(unsaved.length ? `Saved ${unsaved.length} item${unsaved.length === 1 ? "" : "s"}.` : "All selected items are already saved.");
      onClear();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function compareSelected() {
    if (!canCompare) return;
    navigate("/compare", {
      state: {
        items: items.map(({ title, url, source, description, metric, metric_label, tags }) => ({
          title, url, source, description, metric, metric_label, tags,
        })),
      },
    });
  }

  return (
    <section className="card selection-bar" aria-label="Selected results actions">
      <div>
        <strong>{items.length} selected</strong>
        <p className="muted">
          Compare 2–5 selected items from any dashboard source.
        </p>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="row selection-actions">
        <button className="btn btn-outline" onClick={onClear}>Clear</button>
        <button className="btn btn-outline" onClick={saveSelected} disabled={saving}>
          {saving ? "Saving…" : "Save selected"}
        </button>
        <button className="btn" onClick={compareSelected} disabled={!canCompare}>
          Compare selected
        </button>
      </div>
    </section>
  );
}
