import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

// Holds the logged-in user's saved articles so every page can show a Save / Saved button.
const SavedContext = createContext(null);
export const useSaved = () => useContext(SavedContext);

export function SavedProvider({ children }) {
  const [saved, setSaved] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoritesError, setFavoritesError] = useState("");

  useEffect(() => {
    api("/saved_articles").then(setSaved).catch(() => {});
    api("/favorites").then(setFavorites).catch((error) => setFavoritesError(error.message));
  }, []);

  const find = (url) => saved.find((s) => s.url === url);

  async function toggle(item) {
    const existing = find(item.url);
    if (existing) {
      await api(`/saved_articles/${existing.id}`, { method: "DELETE" });
      setSaved((list) => list.filter((s) => s.id !== existing.id));
    } else {
      const record = await api("/saved_articles", {
        method: "POST",
        body: {
          title: item.title,
          url: item.url,
          source: item.source,
          description: item.description,
          tags: item.tags || [],
        },
      });
      setSaved((list) => [record, ...list.filter((s) => s.id !== record.id)]);
    }
  }

  const findFavorite = (url) => favorites.find((favorite) => favorite.url.toLowerCase() === url.toLowerCase());

  async function toggleFavorite(item) {
    let parsedUrl;
    try {
      parsedUrl = new URL(item.url);
    } catch {
      throw new Error("This item does not have a valid link.");
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Only web links can be favorited.");
    }
    const isGitHub = parsedUrl.hostname.toLowerCase() === "github.com" || parsedUrl.hostname.toLowerCase() === "www.github.com";
    const path = parsedUrl.pathname.split("/").filter(Boolean);
    const url = isGitHub && path.length >= 2
      ? `https://github.com/${path[0]}/${path[1].replace(/\.git$/, "")}`
      : parsedUrl.href;
    const existing = findFavorite(url);
    if (existing) {
      await api(`/favorites/${existing.id}`, { method: "DELETE" });
      setFavorites((list) => list.filter((favorite) => favorite.id !== existing.id));
    } else {
      const record = await api("/favorites", {
        method: "POST",
        body: {
          name: isGitHub && path.length >= 2 ? path.slice(0, 2).join("/") : item.title || item.name || parsedUrl.hostname,
          url,
          source: item.source || "Website",
          description: item.description || "",
          metric: item.metric || 0,
          metric_label: item.metric_label || "",
          tags: item.tags || [],
        },
      });
      setFavorites((list) => [record, ...list.filter((favorite) => favorite.url.toLowerCase() !== record.url.toLowerCase())]);
    }
  }

  return (
    <SavedContext.Provider value={{ saved, find, toggle, favorites, favoritesError, findFavorite, toggleFavorite }}>
      {children}
    </SavedContext.Provider>
  );
}
