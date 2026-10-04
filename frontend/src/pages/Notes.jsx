import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selected = notes.find((note) => note.id === selectedId);

  useEffect(() => {
    api("/notes")
      .then((records) => {
        setNotes(records);
        if (records.length) {
          setSelectedId(records[0].id);
          setTitle(records[0].title);
          setContent(records[0].content);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function selectNote(note) {
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setError("");
  }

  function newNote() {
    setSelectedId(null);
    setTitle("");
    setContent("");
    setError("");
  }

  async function saveNote(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const record = selected
        ? await api(`/notes/${selected.id}`, { method: "PATCH", body: { title, content } })
        : await api("/notes", { method: "POST", body: { title: title.trim() || "Untitled note", content } });
      setNotes((list) => [record, ...list.filter((note) => note.id !== record.id)]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
      setSelectedId(record.id);
      setTitle(record.title);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (!selected || !confirm("Delete this note? This cannot be undone.")) return;
    setError("");
    try {
      await api(`/notes/${selected.id}`, { method: "DELETE" });
      const remaining = notes.filter((note) => note.id !== selected.id);
      setNotes(remaining);
      if (remaining.length) selectNote(remaining[0]);
      else newNote();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">YOUR PRIVATE WORKSPACE</span>
        <h1>Research notes</h1>
        <p className="hero-description">Keep ideas, observations, and follow-ups in one place. Notes are private to your account.</p>
      </div>
      {error && <p className="error">{error}</p>}
      <section className="notes-layout">
        <aside className="card notes-list">
          <div className="notes-list-head">
            <strong>Your notes</strong>
            <button className="btn btn-outline" onClick={newNote}>New note</button>
          </div>
          {loading && <p className="muted">Loading your notes…</p>}
          {!loading && notes.length === 0 && <p className="muted notes-empty">No notes yet. Create one to capture an idea.</p>}
          {notes.map((note) => (
            <button
              key={note.id}
              className={`note-list-item ${note.id === selectedId ? "active" : ""}`}
              onClick={() => selectNote(note)}
            >
              <strong>{note.title}</strong>
              <span>{note.content || "No content yet"}</span>
              <small>{new Date(note.updated_at).toLocaleDateString()}</small>
            </button>
          ))}
        </aside>

        <form className="card note-editor" onSubmit={saveNote}>
          <div className="note-editor-head">
            <span className="eyebrow">{selected ? "NOTE" : "NEW NOTE"}</span>
            {selected && <span className="muted">Updated {new Date(selected.updated_at).toLocaleString()}</span>}
          </div>
          <input
            className="note-title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            maxLength={160}
            required
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write down a technology to explore, a useful link, or an idea…"
            maxLength={20000}
          />
          <div className="note-editor-foot">
            <span className="muted">{content.length.toLocaleString()} / 20,000</span>
            <div className="row">
              {selected && <button type="button" className="btn btn-danger" onClick={deleteNote}>Delete</button>}
              <button className="btn" disabled={saving}>{saving ? "Saving…" : selected ? "Save changes" : "Create note"}</button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
