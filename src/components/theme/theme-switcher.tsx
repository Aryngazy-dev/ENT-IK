"use client";
import { useTheme } from "next-themes";
export function ThemeSwitcher() { const { resolvedTheme, setTheme } = useTheme(); const dark = resolvedTheme === "dark"; return <button className="theme-switcher" aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"} title={dark ? "Светлая тема" : "Тёмная тема"} onClick={() => setTheme(dark ? "light" : "dark")}>{dark ? "☀" : "◐"}</button>; }
