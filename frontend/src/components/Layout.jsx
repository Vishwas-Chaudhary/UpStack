import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import CommandPalette from "./CommandPalette.jsx";
import HelpChat from "./HelpChat.jsx";

export default function Layout() {
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("upstack-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("upstack-theme", theme);
    } catch {
      // The in-memory selection still works when storage is unavailable.
    }
  }, [theme]);

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
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="UpStack home">
          <span className="brand-mark" aria-hidden="true">&lt;/&gt;</span>
          <span className="brand-name">UpStack</span>
        </Link>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="nav sidebar-nav" aria-label="Main navigation">
          <NavLink to="/" end><span className="nav-icon" aria-hidden="true">⌂</span>Dashboard</NavLink>
          <NavLink to="/research"><span className="nav-icon" aria-hidden="true">⌕</span>Research</NavLink>
          <NavLink to="/compare"><span className="nav-icon" aria-hidden="true">⇄</span>Compare</NavLink>
          <NavLink to="/saved"><span className="nav-icon" aria-hidden="true">▤</span>Saved</NavLink>
          <NavLink to="/notes"><span className="nav-icon" aria-hidden="true">✎</span>Notes</NavLink>
        </nav>
        <HelpChat className="sidebar-chat" />
        <div className="sidebar-footer">
          <span className="sidebar-caption">SIGNED IN AS</span>
          <NavLink to="/account" className="sidebar-profile">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span><strong>{user.name}</strong><small>Account settings</small></span>
            <span className="profile-arrow" aria-hidden="true">›</span>
          </NavLink>
        </div>
      </aside>
      <div className="workspace-column">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-context">
            <span>DEVELOPER INTELLIGENCE</span>
            <strong>Explore the developer ecosystem</strong>
          </div>
          <div className="topbar-right">
            <button
              className="btn btn-quiet theme-toggle"
              onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <span aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
              <span>{theme === "dark" ? "Light" : "Dark"} mode</span>
            </button>
            <button className="btn btn-quiet" onClick={() => setPaletteOpen(true)}>
              Search <kbd>Ctrl K</kbd>
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      </div>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
