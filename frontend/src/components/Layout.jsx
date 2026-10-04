import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import CommandPalette from "./CommandPalette.jsx";
import HelpChat from "./HelpChat.jsx";

export default function Layout() {
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl + K opens the command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="UpStack home">
          <span className="brand-mark" aria-hidden="true">&lt;/&gt;</span>
            <span className="brand-name">UpStack</span>
          </Link>
          <nav className="nav workspace-nav" aria-label="Main navigation">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/research">Research</NavLink>
            <NavLink to="/compare">Compare</NavLink>
            <NavLink to="/saved">Saved</NavLink>
            <NavLink to="/notes">Notes</NavLink>
          </nav>
          <div className="topbar-right workspace-actions">
            <button className="btn btn-outline" onClick={() => setPaletteOpen(true)}>
              Search <kbd>Ctrl K</kbd>
            </button>
            <Link to="/account" className="workspace-user" aria-label={`${user.name}, account settings`}>
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            </Link>
            <HelpChat className="topbar-help-chat" />
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
