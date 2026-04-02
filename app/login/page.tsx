"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Prihlásenie zlyhalo.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Nastala chyba pri prihlasovaní.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.06),_transparent_30%)]" />

      <div className="relative w-full max-w-md">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)] backdrop-blur sm:p-8">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-medium tracking-wide text-indigo-600">
              Vitaj späť
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Prihlásenie
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              Prihlás sa do systému pomocou svojho mena a hesla.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-slate-700"
              >
                Používateľské meno
              </label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                placeholder="Zadaj používateľské meno"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Heslo
                </label>

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
                >
                  {showPassword ? "Skryť" : "Zobraziť"}
                </button>
              </div>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Zadaj heslo"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {loading ? "Prihlasujem..." : "Prihlásiť sa"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm">
            <span className="text-slate-500">Máš problém s prístupom?</span>
            <Link
              href="/reset-password"
              className="font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Reset hesla
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}