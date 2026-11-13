"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { mergeGuestProgress } from "@/client/guest-progress";

export default function LoginPage() {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const values = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: values.get("email"), password: values.get("password") }) });
    setPending(false); if (!response.ok) { setError((await response.json()).error ?? "Не удалось войти"); return; }
    const user = await response.json(); await mergeGuestProgress(); if (user.role === "ADMIN") router.push("/admin"); else router.push("/"); router.refresh();
  }
  return <main className="auth"><form className="form" onSubmit={submit}><p className="eyebrow">ВХОД</p><h1>Продолжить подготовку</h1><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label>{error && <p role="alert" className="error">{error}</p>}<button disabled={pending}>{pending ? "Входим…" : "Войти"}</button><a className="google-login" href="/api/auth/google">Войти через Google</a></form></main>;
}
