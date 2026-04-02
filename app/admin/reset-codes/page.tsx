"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  username: string;
  role: "ADMIN" | "MEMBER";
};

type ResetCode = {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  targetUser: {
    id: string;
    username: string;
  } | null;
  createdBy: {
    id: string;
    username: string;
  };
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

function getResetCodeStatus(item: ResetCode) {
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

export default function ResetCodesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<ResetCode[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadUsers() {
    try {
      const res = await fetch("/api/users", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa načítať používateľov.");
        setUsers([]);
        return;
      }

      const loadedUsers = Array.isArray(data.users) ? data.users : [];
      setUsers(loadedUsers);

      if (!selectedUserId && loadedUsers.length > 0) {
        setSelectedUserId(loadedUsers[0].id);
      }
    } catch {
      setError("Nepodarilo sa načítať používateľov.");
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadCodes() {
    try {
      const res = await fetch("/api/admin/reset-codes", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa načítať reset kódy.");
        setCodes([]);
        return;
      }

      setCodes(Array.isArray(data.codes) ? data.codes : []);
    } catch {
      setError("Nepodarilo sa načítať reset kódy.");
      setCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  }

  async function handleCreateCode() {
    try {
      if (!selectedUserId) {
        setError("Vyber používateľa.");
        return;
      }

      setSubmitting(true);
      setError("");

      const res = await fetch("/api/admin/reset-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          targetUserId: selectedUserId,
          expiresInHours,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa vytvoriť reset kód.");
        return;
      }

      await loadCodes();
    } catch {
      setError("Nepodarilo sa vytvoriť reset kód.");
    } finally {
      setSubmitting(false);
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
    loadUsers();
    loadCodes();
  }, []);

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;

  const stats = useMemo(() => {
    const summary = {
      total: codes.length,
      active: 0,
      used: 0,
      expired: 0,
    };

    for (const item of codes) {
      const status = getResetCodeStatus(item);

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
                  Reset kódy
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Vytváraj časovo obmedzené kódy na zmenu hesla pre konkrétnych
                  používateľov a sleduj ich stav.
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
                  type="button"
                  onClick={handleCreateCode}
                  disabled={submitting || loadingUsers || !selectedUserId}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {submitting ? "Generujem..." : "Vygenerovať reset kód"}
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

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Vytvoriť reset kód
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Vyber účet a nastav dĺžku platnosti kódu.
                  </p>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  Admin akcia
                </span>
              </div>

              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="targetUser"
                    className="text-sm font-medium text-slate-700"
                  >
                    Používateľ
                  </label>

                  {loadingUsers ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Načítavam používateľov...
                    </div>
                  ) : users.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Nenašli sa žiadni používatelia.
                    </div>
                  ) : (
                    <select
                      id="targetUser"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.role})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="expiresInHours"
                    className="text-sm font-medium text-slate-700"
                  >
                    Platnosť v hodinách
                  </label>
                  <input
                    id="expiresInHours"
                    type="number"
                    min={1}
                    max={168}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  />
                  <p className="text-sm text-slate-500">
                    Povolený rozsah: 1 až 168 hodín.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCode}
                  disabled={submitting || loadingUsers || !selectedUserId}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {submitting ? "Generujem..." : "Vygenerovať reset kód"}
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Rýchly prehľad
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Vybraný používateľ
                  </p>

                  {selectedUser ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                        {selectedUser.username}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                          selectedUser.role === "ADMIN"
                            ? "border border-amber-200 bg-amber-50 text-amber-700"
                            : "border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {selectedUser.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Zatiaľ nie je vybraný žiadny používateľ.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Nastavená platnosť
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {expiresInHours} h
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Reset kód bude použiteľný počas zvoleného času.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">Poznámka</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Reset kód je určený pre konkrétneho používateľa a po použití
                    už nebude znova platný.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  História reset kódov
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Prehľad všetkých vytvorených kódov a ich stavu.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                Celkovo {codes.length}
              </span>
            </div>

            {loadingCodes ? (
              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-3">
                        <div className="h-8 w-40 animate-pulse rounded-2xl bg-slate-200" />
                        <div className="h-4 w-64 animate-pulse rounded-full bg-slate-200" />
                        <div className="h-4 w-56 animate-pulse rounded-full bg-slate-200" />
                      </div>
                      <div className="h-10 w-28 animate-pulse rounded-2xl bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : codes.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Zatiaľ tu nie sú žiadne reset kódy.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {codes.map((item) => {
                  const status = getResetCodeStatus(item);

                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
                              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                                Reset code
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
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                                Skopírované
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                              Vytvorený: {formatDate(item.createdAt)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
                              Expirácia:{" "}
                              {item.expiresAt
                                ? formatDate(item.expiresAt)
                                : "Bez expirácie"}
                            </span>
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

                      <div className="mt-5 grid gap-4 lg:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Pre používateľa
                          </p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {item.targetUser?.username ?? "Neznámy"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Účet, pre ktorý bol kód vytvorený.
                          </p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Vytvoril
                          </p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {item.createdBy.username}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Administrátor, ktorý vytvoril kód.
                          </p>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Použitie
                          </p>

                          {item.usedAt ? (
                            <>
                              <p className="mt-2 font-semibold text-slate-900">
                                Použitý {formatDate(item.usedAt)}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.usedBy
                                  ? `Použil: ${item.usedBy.username}`
                                  : "Používateľ neznámy"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="mt-2 font-semibold text-slate-900">
                                Zatiaľ nepoužitý
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Čaká na použitie.
                              </p>
                            </>
                          )}
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-500">
                            Stav
                          </p>
                          <div className="mt-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {status.key === "used"
                              ? "Kód už bol úspešne použitý."
                              : status.key === "expired"
                              ? "Kód už nie je možné použiť."
                              : "Kód je momentálne platný."}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}