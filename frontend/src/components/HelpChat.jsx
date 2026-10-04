import { useState } from "react";
import { api } from "../api.js";

const STARTERS = ["How do I compare repositories?", "What can I save?", "How are trends ranked?"];

export default function HelpChat({ className = "" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I’m Pino. Ask me how to use the dashboard or what the current ecosystem signals mean." },
  ]);
  const [busy, setBusy] = useState(false);

  async function send(text) {
    const question = text.trim();
    if (!question || busy) return;
    setDraft("");
    setMessages((list) => [...list, { role: "user", text: question }]);
    setBusy(true);
    try {
      const response = await api("/chat", { method: "POST", body: { message: question } });
      setMessages((list) => [...list, { role: "assistant", text: response.answer }]);
    } catch (error) {
      setMessages((list) => [...list, { role: "error", text: error.message }]);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    send(draft);
  }

  return (
    <div className={`help-chat ${className}`.trim()}>
      {open && (
        <section className="chat-panel card" role="dialog" aria-label="Dashboard help chat">
          <header className="chat-header">
            <div>
              <span className="chat-online"><span className="live-dot" /> PINO</span>
              <strong>How can I help?</strong>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close help chat">×</button>
          </header>
          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-message chat-${message.role}`}>
                {message.text}
              </div>
            ))}
            {busy && <div className="chat-typing">Thinking<span> · · ·</span></div>}
          </div>
          {messages.length === 1 && (
            <div className="chat-starters">
              {STARTERS.map((starter) => (
                <button key={starter} onClick={() => send(starter)} disabled={busy}>{starter}</button>
              ))}
            </div>
          )}
          <form className="chat-form" onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about the dashboard…"
              aria-label="Message the assistant"
              maxLength={1000}
            />
            <button className="btn" disabled={busy || !draft.trim()} aria-label="Send message">↑</button>
          </form>
          <p className="chat-note">AI answers can be wrong. Avoid sharing private information.</p>
        </section>
      )}
      <button className="chat-launcher" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? "Close help" : "Ask Pino?"}
        {open && <span aria-hidden="true">×</span>}
      </button>
    </div>
  );
}
