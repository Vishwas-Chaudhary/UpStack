import { useEffect, useState } from "react";

export default function useTheme() {
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

  return [theme, setTheme];
}
