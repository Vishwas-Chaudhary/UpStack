import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Auth({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <Link to="/" className="brand auth-brand" aria-label="UpStack home">
        <span className="brand-mark" aria-hidden="true">&lt;/&gt;</span>
        <span className="brand-name">UpStack</span>
      </Link>
      <form className="card auth-card" onSubmit={submit}>
        <span className="eyebrow">DEVELOPER INTELLIGENCE</span>
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">
          {isRegister
            ? "Save articles and keep your repository comparisons."
            : "Log in to see your saved articles and comparisons."}
        </p>

        {isRegister && (
          <label>
            Name
            <input value={form.name} onChange={set("name")} required autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          {isRegister && <span className="hint">At least 8 characters</span>}
        </label>

        {error && <p className="error">{error}</p>}
        <button className="btn auth-submit" disabled={busy}>
          {busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </button>

        <p className="muted switch">
          {isRegister ? (
            <>Already have an account? <Link to="/login">Log in</Link></>
          ) : (
            <>New here? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
