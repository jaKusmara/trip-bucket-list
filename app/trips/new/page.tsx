"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  role: "ADMIN" | "MEMBER";
};

export default function NewTripPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    visibleUserIds: [] as string[],
  });

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        setError("");

        const res = await fetch("/api/users");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Nepodarilo sa načítať používateľov.");
          setUsers([]);
          return;
        }

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch {
        setError("Nepodarilo sa načítať používateľov.");
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  function toggleUser(userId: string) {
    setForm((prev) => {
      const exists = prev.visibleUserIds.includes(userId);

      if (exists) {
        return {
          ...prev,
          visibleUserIds: prev.visibleUserIds.filter((id) => id !== userId),
        };
      }

      return {
        ...prev,
        visibleUserIds: [...prev.visibleUserIds, userId],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa vytvoriť výlet.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Nepodarilo sa vytvoriť výlet.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUsers = useMemo(
    () => users.filter((user) => form.visibleUserIds.includes(user.id)),
    [users, form.visibleUserIds]
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-indigo-600">
                Letné plánovanie
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Nový výlet
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Vytvor nový plán, doplň základné informácie a vyber ľudí,
                ktorí ho budú vidieť.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Späť na dashboard
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Základné informácie
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Názov, popis a termín výletu.
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label
                        htmlFor="title"
                        className="text-sm font-medium text-slate-700"
                      >
                        Názov výletu
                      </label>
                      <input
                        id="title"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        value={form.title}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Napr. Túra do Tatier"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="description"
                        className="text-sm font-medium text-slate-700"
                      >
                        Popis
                      </label>
                      <textarea
                        id="description"
                        className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Kam sa ide, čo treba zobrať, aký je plán, doprava, orientačný rozpočet..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="eventDate"
                        className="text-sm font-medium text-slate-700"
                      >
                        Dátum a čas
                      </label>
                      <input
                        id="eventDate"
                        type="datetime-local"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                        value={form.eventDate}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            eventDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Rýchly prehľad
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">
                        Vybraní používatelia
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {form.visibleUserIds.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">
                        Dostupní používatelia
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {users.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-700">
                      Vybraní:
                    </p>

                    {selectedUsers.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Zatiaľ si nevybral žiadneho používateľa.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                          <span
                            key={user.id}
                            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                          >
                            {user.username}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>

            <section className="rounded-3xl border border-slate-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Viditeľné pre
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Vyber používateľov, ktorí uvidia tento výlet.
                  </p>
                </div>

                <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                  Vybraní {form.visibleUserIds.length}
                </span>
              </div>

              {loadingUsers ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Načítavam používateľov...
                </div>
              ) : users.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Nenašli sa žiadni používatelia.
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => {
                    const selected = form.visibleUserIds.includes(user.id);

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleUser(user.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-indigo-300 bg-indigo-50 shadow-sm"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.username}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Používateľ aplikácie
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              user.role === "ADMIN"
                                ? "border border-amber-200 bg-amber-50 text-amber-700"
                                : "border border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {user.role === "ADMIN" ? "Admin" : "Member"}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span
                            className={`text-sm font-medium ${
                              selected ? "text-indigo-700" : "text-slate-500"
                            }`}
                          >
                            {selected ? "Vybraný" : "Klikni pre výber"}
                          </span>

                          <span
                            className={`h-5 w-5 rounded-full border transition ${
                              selected
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-slate-300 bg-white"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Po vytvorení sa výlet zobrazí na dashboarde.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Zrušiť
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {submitting ? "Ukladám..." : "Vytvoriť výlet"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}