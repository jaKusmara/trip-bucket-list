"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "GOING" | "NOT_GOING" | "INTERESTED" | null;

type Props = {
  tripId: string;
  initialStatus: Status;
};

const options: Array<{
  value: Exclude<Status, null>;
  title: string;
  description: string;
  activeClassName: string;
  idleClassName: string;
}> = [
  {
    value: "GOING",
    title: "Idem",
    description: "Počíta sa so mnou",
    activeClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm",
    idleClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60",
  },
  {
    value: "NOT_GOING",
    title: "Nejdem",
    description: "Tentoraz sa nepridám",
    activeClassName:
      "border-rose-300 bg-rose-50 text-rose-800 shadow-sm",
    idleClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50/60",
  },
  {
    value: "INTERESTED",
    title: "Zaujíma ma to",
    description: "Zatiaľ sa rozhodujem",
    activeClassName:
      "border-amber-300 bg-amber-50 text-amber-800 shadow-sm",
    idleClassName:
      "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/60",
  },
];

function getSelectedMeta(status: Status) {
  if (status === "GOING") {
    return {
      label: "Idem",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (status === "NOT_GOING") {
    return {
      label: "Nejdem",
      className: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }

  if (status === "INTERESTED") {
    return {
      label: "Zaujíma ma to",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Zatiaľ bez reakcie",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  };
}

export default function TripResponseButtons({
  tripId,
  initialStatus,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Status>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Exclude<Status, null> | null>(null);
  const [error, setError] = useState("");

  async function submitStatus(status: Exclude<Status, null>) {
    try {
      setLoading(true);
      setPendingStatus(status);
      setError("");

      const res = await fetch(`/api/trips/${tripId}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Nepodarilo sa uložiť reakciu.");
        return;
      }

      setSelected(status);
      router.refresh();
    } catch {
      setError("Nepodarilo sa uložiť reakciu.");
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  }

  const selectedMeta = getSelectedMeta(selected);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Moja reakcia</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Vyber, či ideš, nejdeš alebo ťa výlet zatiaľ len zaujal.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${selectedMeta.className}`}
        >
          {selectedMeta.label}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const isActive = selected === option.value;
          const isPending = pendingStatus === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={loading}
              onClick={() => submitStatus(option.value)}
              className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-70 ${
                isActive ? option.activeClassName : option.idleClassName
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{option.title}</p>
                  <p className="mt-1 text-sm opacity-80">{option.description}</p>
                </div>

                <span
                  className={`mt-0.5 h-5 w-5 rounded-full border transition ${
                    isActive
                      ? "border-current bg-current"
                      : "border-slate-300 bg-white"
                  }`}
                />
              </div>

              {isPending ? (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Ukladám...
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}