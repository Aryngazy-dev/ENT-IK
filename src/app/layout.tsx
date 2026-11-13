import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Тарих ЕНТ",
  description: "Платформа подготовки к ЕНТ по истории Казахстана",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const language = (await cookies()).get("ent_language")?.value === "kk" ? "kk" : "ru";
  return <html lang={language} suppressHydrationWarning><body><ThemeProvider><a className="skip-link" href="#main-content">К основному содержимому</a><header className="site-header"><a href="/">Тарих ЕНТ</a><nav aria-label="Основная навигация"><a href="/train">Тренировка</a><a href="/persons">Личности</a><a href="/favorites">Избранное</a><a href="/dashboard">Кабинет</a><ThemeSwitcher /><LanguageSwitcher initial={language} /></nav></header><div id="main-content">{children}</div></ThemeProvider></body></html>;
}
