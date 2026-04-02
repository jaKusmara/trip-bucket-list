"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa zmeniť heslo.");
        return;
      }

      setSuccess("Heslo bolo úspešne zmenené.");
      setForm({
        code: "",
        newPassword: "",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch {
      setError("Nepodarilo sa zmeniť heslo.");
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
              Obnova prístupu
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Obnova hesla
            </h1>
            <p className="text-sm leading-6 text-slate-500">
              Zadaj reset kód a nastav si nové heslo pre svoj účet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="text-sm font-medium text-slate-700"
              >
                Reset kód
              </label>
              <input
                id="code"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium tracking-wide text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                placeholder="Zadaj reset kód"
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-slate-700"
                >
                  Nové heslo
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
                id="newPassword"
                type={showPassword ? "text" : "password"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                placeholder="Zadaj nové heslo"
                value={form.newPassword}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
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
              {loading ? "Mením heslo..." : "Zmeniť heslo"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm">
            <span className="text-slate-500">Pamätáš si heslo?</span>
            <Link
              href="/login"
              className="font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              Späť na prihlásenie
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}