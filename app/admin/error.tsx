"use client";

import Link from "next/link";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl bg-white p-8">
        <h1 className="text-xl font-semibold">Unable to load the admin dashboard</h1>
        <p role="alert" className="mt-3 text-sm text-slate-600">
          Your access may have changed, or the connection may be unavailable. Try again or sign in again.
        </p>
        <div className="mt-6 flex gap-4">
          <button onClick={reset} className="rounded-lg bg-slate-900 px-4 py-2 text-white">Try again</button>
          <Link href="/admin/login" className="rounded-lg border border-slate-300 px-4 py-2">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
