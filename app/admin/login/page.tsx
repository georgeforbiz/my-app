"use client";

import { useState } from "react";
import { SITE_BG_GRADIENT } from "@/lib/brand";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password })
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Invalid admin email or password.");
        setPending(false);
        return;
      }
      // Full reload so the new session cookie is present on the first admin render.
      window.location.assign("/admin");
    } catch {
      setError("Could not reach the server. Try again.");
      setPending(false);
    }
  };

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-10"
      style={{ background: SITE_BG_GRADIENT }}
    >
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
            Restricted area
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Admin sign in</h1>
        </div>

        <div className="mt-8 rounded-3xl border border-white/15 bg-white p-6 shadow-2xl shadow-black/25">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Admin email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0033A0]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#0033A0]"
              />
            </label>

            {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#0033A0] px-6 py-3.5 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-70"
            >
              {pending ? "Signing in…" : "Enter admin panel"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
