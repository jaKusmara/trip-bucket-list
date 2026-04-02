import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                Letné plánovanie výletov
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Naplánuj si leto s kamarátmi jednoducho a prehľadne
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Vytváraj výlety, nastav termíny, pozývaj ľudí a sleduj reakcie
                na jednom mieste. Bez chaosu v chatoch a bez stratených správ.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Prihlásiť sa
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Prejsť na dashboard
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  Výber účastníkov
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  Reakcie kto ide / nejde
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                  Prehľad termínov
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">
                      Ukážka výletu
                    </p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Víkend vo Vysokých Tatrách
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                    Potvrdzuje sa
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Turistika, chata, spoločná cesta autom a večerné posedenie.
                  Stačí vytvoriť plán a ostatní rovno vidia, či sa pridajú.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                    Sobota 18. júla
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                    8 pozvaných
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">Ide</p>
                    <p className="mt-2 text-2xl font-semibold text-emerald-800">
                      4
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-medium text-rose-700">Nejde</p>
                    <p className="mt-2 text-2xl font-semibold text-rose-800">
                      2
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-700">
                      Zaujalo
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-amber-800">
                      2
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              01
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              Vytvor výlet
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Zadaj názov, popis, termín a priprav plán, ktorý bude pre všetkých
              prehľadný.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              02
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              Vyber ľudí
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Nastav, kto výlet uvidí, a pozvi len tých, ktorých sa plán týka.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              03
            </div>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              Sleduj reakcie
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Hneď vidíš, kto ide, kto nejde a koho plán zatiaľ len zaujal.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}