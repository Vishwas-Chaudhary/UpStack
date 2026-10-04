import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const PAGES = [
  { label: "Dashboard", to: "/" },
  { label: "Research", to: "/research" },
  { label: "Compare repositories", to: "/compare" },
  { label: "Saved", to: "/saved" },
  { label: "Notes", to: "/notes" },
  { label: "Account", to: "/account" },
];

export default function CommandPalette({ onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const term = text.trim();
  const commands = [
    ...(term ? [{ label: `Research “${term}”`, run: () => navigate(`/research?q=${encodeURIComponent(term)}`) }] : []),
    ...PAGES.filter((p) => p.label.toLowerCase().includes(term.toLowerCase())).map((p) => ({
      label: p.label,
      run: () => navigate(p.to),
    })),
    ...("log out".includes(term.toLowerCase()) ? [{ label: "Log out", run: logout }] : []),
  ];

  function pick(command) {
    command?.run();
    onClose();
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pick(commands[0])}
          placeholder="Search a topic or jump to a page…"
        />
        <ul>
          {commands.map((c) => (
            <li key={c.label}>
              <button onClick={() => pick(c)}>{c.label}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
