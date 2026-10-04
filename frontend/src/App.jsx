import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { SavedProvider } from "./saved.jsx";
import Layout from "./components/Layout.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Research from "./pages/Research.jsx";
import Compare from "./pages/Compare.jsx";
import Saved from "./pages/Saved.jsx";
import Account from "./pages/Account.jsx";
import Technology from "./pages/Technology.jsx";
import Notes from "./pages/Notes.jsx";

// Anything inside this route requires a logged-in user.
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  // key={user.id} resets all per-user state if someone else logs in on the same browser
  return (
    <SavedProvider key={user.id}>
      <Layout />
    </SavedProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/research" element={<Research />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/account" element={<Account />} />
        <Route path="/technology/:name" element={<Technology />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
