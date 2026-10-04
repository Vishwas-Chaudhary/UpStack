// One small wrapper around fetch. Adds the login token and turns errors into Error objects.
export const getToken = () => localStorage.getItem("token");

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

const configuredApiUrl = import.meta.env.VITE_API_URL || "";
const API_ORIGIN = configuredApiUrl
  ? `${/^https?:\/\//i.test(configuredApiUrl) ? "" : "https://"}${configuredApiUrl}`.replace(/\/$/, "")
  : "";

export async function api(path, { method = "GET", body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_ORIGIN}/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event("auth:expired"));
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Something went wrong");
  return data;
}
