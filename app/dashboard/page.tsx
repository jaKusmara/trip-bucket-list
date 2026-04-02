import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/logout-button";

function formatEventDate(date: Date | null) {
  if (!date) return "Termín zatiaľ neurčený";

  return new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getStatusMeta(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized.includes("YES") ||
    normalized.includes("GOING") ||
    normalized.includes("ATTEND") ||
    normalized.includes("IDE") ||
    normalized.includes("ANO")
  ) {
    return {
      key: "going",
      label: "Ide",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    normalized.includes("NO") ||
    normalized.includes("DECLIN") ||
    normalized.includes("NOT") ||
    normalized.includes("NEJDE")
  ) {
    return {
      key: "notGoing",
      label: "Nejde",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (
    normalized.includes("MAYBE") ||
    normalized.includes("INTEREST") ||
    normalized.includes("ZAU") ||
    normalized.includes("LATER")
  ) {
    return {
      key: "interested",
      label: "Zaujalo",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    key: "other",
    label: status,
    className: "border-slate-200 bg-slate-100 text-slate-700",
  };
}

function getReactionStats(responses: Array<{ status: string }>) {
  return responses.reduce(
    (acc, response) => {
      const meta = getStatusMeta(response.status);

      if (meta.key === "going") acc.going += 1;
      else if (meta.key === "notGoing") acc.notGoing += 1;
      else if (meta.key === "interested") acc.interested += 1;
      else acc.other += 1;

      return acc;
    },
    { going: 0, notGoing: 0, interested: 0, other: 0 }
  );
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const trips = await prisma.trip.findMany({
    where: {
      visibility: {
        some: {
          userId: session.userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      creator: {
        select: {
          id: true,
          username: true,
        },
      },
      visibility: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
      responses: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  });

  const now = new Date();

  const upcomingTrips = trips.filter(
    (trip) => trip.eventDate && new Date(trip.eventDate) > now
  ).length;

  const totalResponses = trips.reduce(
    (sum, trip) => sum + trip.responses.length,
    0
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-indigo-600">
                Letné plánovanie
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                Dashboard výletov
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Vitaj späť, <span className="font-semibold text-slate-700">{session.username}</span>.
                Tu máš prehľad výletov, reakcií a ľudí, ktorí boli prizvaní.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Nový výlet
              </Link>

              {session.role === "ADMIN" ? (
                <>
                  <Link
                    href="/admin/invite-codes"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Invite kódy
                  </Link>

                  <Link
                    href="/admin/reset-codes"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset kódy
                  </Link>
                </>
              ) : null}

              <LogoutButton />
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Moje výlety</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{trips.length}</p>
              <p className="mt-1 text-sm text-slate-500">
                Viditeľné pre tvoj účet
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Najbližšie plány</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{upcomingTrips}</p>
              <p className="mt-1 text-sm text-slate-500">
                Výletov s budúcim termínom
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">Celkovo reakcií</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalResponses}</p>
              <p className="mt-1 text-sm text-slate-500">
                Odpovede naprieč výletmi
              </p>
            </div>
          </div>
        </section>

        {trips.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Zatiaľ tu nemáš žiadne výlety
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Vytvor prvý plán na leto alebo počkaj, kým ťa niekto pridá do výletu.
            </p>

            <Link
              href="/trips/new"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Vytvoriť výlet
            </Link>
          </section>
        ) : (
          <section className="space-y-5">
            {trips.map((trip) => {
              const stats = getReactionStats(trip.responses);

              return (
                <article
                  key={trip.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                          <Link
                            href={`/trips/${trip.id}`}
                            className="transition hover:text-indigo-600"
                          >
                            {trip.title}
                          </Link>
                        </h2>

                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          Výlet
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          Vytvoril: {trip.creator.username}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          Viditeľné pre {trip.visibility.length} používateľov
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                          Reakcií: {trip.responses.length}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {trip.eventDate ? formatEventDate(trip.eventDate) : "Termín zatiaľ neurčený"}
                      </div>
                    </div>
                  </div>

                  {trip.description ? (
                    <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {trip.description}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Viditeľné pre
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {trip.visibility.map((item) => (
                          <span
                            key={item.user.id}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                          >
                            {item.user.username}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Súhrn reakcií
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                          Ide {stats.going}
                        </span>
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
                          Nejde {stats.notGoing}
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                          Zaujalo {stats.interested}
                        </span>
                        {stats.other > 0 ? (
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                            Iné {stats.other}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">Reakcie používateľov</p>

                    {trip.responses.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        Zatiaľ bez reakcií.
                      </p>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {trip.responses.map((response) => {
                          const statusMeta = getStatusMeta(response.status);

                          return (
                            <div
                              key={response.id}
                              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                              <span className="text-sm font-medium text-slate-800">
                                {response.user.username}
                              </span>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}