"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    inviteCode: "",
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registrácia zlyhala.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Nastala chyba pri registrácii.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border p-6 shadow-sm"
      >
        <h1 className="text-2xl font-semibold">Registrácia</h1>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pozývací kód</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={form.inviteCode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, inviteCode: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={form.username}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, username: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Heslo</label>
          <input
            type="password"
            className="w-full rounded-xl border px-3 py-2"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border px-4 py-2 font-medium"
        >
          {loading ? "Registrujem..." : "Zaregistrovať sa"}
        </button>
      </form>
    </main>
  );
}