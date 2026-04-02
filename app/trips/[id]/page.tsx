import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import TripResponseButtons from "./trip-response-buttons";
import Link from "next/link";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

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
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
      className: "border-amber-200 bg-amber-50 text-amber-700",
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

export default async function TripDetailPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const trip = await prisma.trip.findFirst({
    where: {
      id,
      visibility: {
        some: {
          userId: session.userId,
        },
      },
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
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const myResponse =
    trip.responses.find((item) => item.userId === session.userId) ?? null;

  const canManage =
    session.role === "ADMIN" || trip.creatorId === session.userId;

  const stats = getReactionStats(trip.responses);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    Detail výletu
                  </span>

                  {trip.eventDate ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Naplánovaný termín
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                      Bez termínu
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                  {trip.title}
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Vytvoril{" "}
                  <span className="font-semibold text-slate-700">
                    {trip.creator.username}
                  </span>
                  . Výlet vidí {trip.visibility.length}{" "}
                  {trip.visibility.length === 1
                    ? "používateľ"
                    : trip.visibility.length >= 2 && trip.visibility.length <= 4
                    ? "používatelia"
                    : "používateľov"}{" "}
                  a momentálne má {trip.responses.length} reakcií.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {trip.eventDate
                    ? formatEventDate(trip.eventDate)
                    : "Termín zatiaľ neurčený"}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Späť
                  </Link>

                  {canManage ? (
                    <Link
                      href={`/trips/${trip.id}/edit`}
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Upraviť výlet
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Popis výletu
                  </h2>

                  {trip.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {trip.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      K tomuto výletu zatiaľ nebol pridaný žiadny popis.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Viditeľné pre
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Používatelia, ktorí majú prístup k tomuto výletu.
                      </p>
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                      {trip.visibility.length}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
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
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Súhrn reakcií
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">Ide</p>
                      <p className="mt-2 text-2xl font-semibold text-emerald-700">
                        {stats.going}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">Nejde</p>
                      <p className="mt-2 text-2xl font-semibold text-rose-700">
                        {stats.notGoing}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">
                        Zaujalo
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-amber-700">
                        {stats.interested}
                      </p>
                    </div>

                    {stats.other > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-medium text-slate-500">Iné</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-700">
                          {stats.other}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 p-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Tvoja odpoveď
                  </h2>

                  <div className="mt-3">
                    {myResponse ? (
                      <span
                        className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusMeta(myResponse.status).className}`}
                      >
                        {getStatusMeta(myResponse.status).label}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
                        Zatiaľ si nereagoval
                      </span>
                    )}
                  </div>

                  <div className="mt-5">
                    <TripResponseButtons
                      tripId={trip.id}
                      initialStatus={myResponse?.status ?? null}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Reakcie používateľov
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Zoznam odpovedí zoradený od najnovšej zmeny.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
                Celkovo {trip.responses.length}
              </span>
            </div>

            {trip.responses.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Zatiaľ bez reakcií.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {trip.responses.map((response) => {
                  const statusMeta = getStatusMeta(response.status);
                  const isMe = response.user.id === session.userId;

                  return (
                    <div
                      key={response.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {response.user.username}
                            </p>

                            {isMe ? (
                              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                                Ty
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            Aktualizované{" "}
                            {new Intl.DateTimeFormat("sk-SK", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(response.updatedAt))}
                          </p>
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                    </div>
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