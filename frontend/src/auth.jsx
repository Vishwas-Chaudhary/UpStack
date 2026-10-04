import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  // Restore the session on page load.
  useEffect(() => {
    if (!getToken()) return;
    api("/me")
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // api.js fires this when the server rejects our token.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  async function authenticate(path, body) {
    const data = await api(path, { method: "POST", body });
    setToken(data.token);
    setUser(data.user);
  }

  const login = (email, password) => authenticate("/login", { email, password });
  const register = (name, email, password) => authenticate("/register", { name, email, password });

  async function logout() {
    try {
      await api("/logout", { method: "DELETE" });
    } catch {
      /* token may already be invalid; just clear it locally */
    }
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
