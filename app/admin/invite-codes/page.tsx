"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type InviteCode = {
  id: string;
  code: string;
  createdAt: string;
  usedAt: string | null;
  expiresAt: string | null;
  usedBy: {
    id: string;
    username: string;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) return "Bez dátumu";

  return new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCodeStatus(item: InviteCode) {
  const now = new Date();

  if (item.usedAt) {
    return {
      key: "used",
      label: "Použitý",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (item.expiresAt && new Date(item.expiresAt) < now) {
    return {
      key: "expired",
      label: "Expirovaný",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  return {
    key: "active",
    label: "Aktívny",
    className: "border-indigo-200 bg-indigo-50 text-indigo-700",
  };
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadCodes() {
    try {
      setError("");

      const res = await fetch("/api/admin/invite-codes");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa načítať kódy.");
        return;
      }

      setCodes(Array.isArray(data.codes) ? data.codes : []);
    } catch {
      setError("Nepodarilo sa načítať kódy.");
    } finally {
      setPageLoading(false);
    }
  }

  async function handleGenerateCode() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa vytvoriť kód.");
        return;
      }

      await loadCodes();
    } catch {
      setError("Nepodarilo sa vytvoriť kód.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);

      window.setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1800);
    } catch {
      setError("Nepodarilo sa skopírovať kód.");
    }
  }

  useEffect(() => {
    loadCodes();
  }, []);

  const stats = useMemo(() => {
    const summary = {
      total: codes.length,
      active: 0,
      used: 0,
      expired: 0,
    };

    for (const item of codes) {
      const status = getCodeStatus(item);

      if (status.key === "active") summary.active += 1;
      if (status.key === "used") summary.used += 1;
      if (status.key === "expired") summary.expired += 1;
    }

    return summary;
  }, [codes]);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-medium tracking-wide text-indigo-600">
                  Administrácia
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                  Pozývacie kódy
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Spravuj jednorazové kódy pre registráciu kamarátov a sleduj,
                  ktoré boli použité, ktoré sú stále aktívne a ktoré už expirovali.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Späť na dashboard
                </Link>

                <button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {loading ? "Generujem..." : "Vygenerovať kód"}
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Všetky kódy</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">Aktívne</p>
                <p className="mt-2 text-3xl font-semibold text-indigo-800">
                  {stats.active}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">Použité</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-800">
                  {stats.used}
                </p>
              </div>

              <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-sm font-medium text-rose-700">Expirované</p>
                <p className="mt-2 text-3xl font-semibold text-rose-800">
                  {stats.expired}
                </p>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {pageLoading ? (
            <section className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="h-8 w-40 animate-pulse rounded-2xl bg-slate-200" />
                      <div className="h-4 w-56 animate-pulse rounded-full bg-slate-200" />
                    </div>
                    <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-200" />
                  </div>
                </div>
              ))}
            </section>
          ) : codes.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Zatiaľ nemáš žiadne pozývacie kódy
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Vygeneruj prvý kód a pošli ho človeku, ktorého chceš pozvať do aplikácie.
              </p>

              <button
                onClick={handleGenerateCode}
                disabled={loading}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {loading ? "Generujem..." : "Vytvoriť prvý kód"}
              </button>
            </section>
          ) : (
            <section className="space-y-4">
              {codes.map((item) => {
                const status = getCodeStatus(item);

                return (
                  <article
                    key={item.id}
                    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                              Invite code
                            </p>
                            <p className="mt-1 break-all font-mono text-lg font-semibold text-slate-900 sm:text-xl">
                              {item.code}
                            </p>
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>

                          {copiedCode === item.code ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                              Skopírované
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                            Vytvorený: {formatDate(item.createdAt)}
                          </span>

                          {item.expiresAt ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                              Expirácia: {formatDate(item.expiresAt)}
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                              Bez expirácie
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.code)}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Kopírovať kód
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Použitie</p>

                        {item.usedAt ? (
                          <>
                            <p className="mt-2 font-semibold text-slate-900">
                              Kód bol použitý
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Dátum použitia: {formatDate(item.usedAt)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 font-semibold text-slate-900">
                              Kód ešte nebol použitý
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Čaká na registráciu.
                            </p>
                          </>
                        )}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Používateľ</p>

                        {item.usedBy ? (
                          <>
                            <p className="mt-2 font-semibold text-slate-900">
                              {item.usedBy.username}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Účet bol vytvorený cez tento kód.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 font-semibold text-slate-900">
                              Zatiaľ nikto
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Kód ešte nebol priradený používateľovi.
                            </p>
                          </>
                        )}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-medium text-slate-500">Stav</p>
                        <div className="mt-2">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {status.key === "used"
                            ? "Kód bol úspešne použitý."
                            : status.key === "expired"
                            ? "Kód už nie je možné použiť."
                            : "Kód je pripravený na použitie."}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}