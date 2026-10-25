"use client";

import { useState } from "react";
import { useAction, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LoadMore } from "./LoadMore";
import { adminError } from "./adminError";

export function UnresolvedCharges({ adminId }: { adminId: Id<"tutorAccounts"> }) {
  const [status, setStatus] = useState<"pending" | "uncertain">("uncertain");
  const page = usePaginatedQuery(api.adminLists.unresolvedOperations, { adminId, status }, { initialNumItems: 25 });
  const check = useAction(api.stripeActions.checkCharge);
  const [checking, setChecking] = useState<string | null>(null);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  return <section className="rounded-xl border border-amber-200 bg-amber-50 p-4" aria-label="Payments awaiting confirmation">
    <h3 className="font-semibold">Payments awaiting confirmation</h3>
    <p className="mt-1 text-sm">Check these payments before creating a new charge. Reserved credit stays unavailable until the outcome is confirmed.</p>
    <div className="my-3 flex gap-3">{(["uncertain", "pending"] as const).map(value =>
      <button key={value} aria-pressed={status === value} className="rounded-lg border px-3 py-2 text-sm aria-pressed:bg-white" onClick={() => setStatus(value)}>{value === "uncertain" ? "Needs review" : "Processing"}</button>
    )}</div>
    {message && <p role="status" className="text-sm">{message}</p>}
    {page.results.map(op => <div key={op._id} className="my-2 rounded-lg bg-white p-3 text-sm">
      <p className="font-medium">{op.studentName} · ${(op.amountCents / 100).toFixed(2)}</p>
      <p>{op.description}</p>{op.error && <p>{op.error}</p>}
      <label className="mt-2 block">Stripe payment reference (optional)
        <input className="ml-2 rounded border px-2 py-1" placeholder="pi_…" value={references[op._id] ?? ""} onChange={event => setReferences(previous => ({ ...previous, [op._id]: event.target.value }))} />
      </label>
      <button disabled={checking !== null} className="mt-2 rounded border px-3 py-2 disabled:opacity-50" onClick={async () => {
        setChecking(op._id); setMessage("");
        try {
          const result = await check({ operationId: op._id, paymentIntentId: references[op._id]?.trim() || undefined });
          setMessage(result.success ? "Payment confirmed." : result.error ?? "Still awaiting confirmation.");
        } catch (error) { setMessage(adminError(error, "Unable to check payment.")); }
        finally { setChecking(null); }
      }}>{checking === op._id ? "Checking…" : "Check payment status"}</button>
    </div>)}
    {page.status === "Exhausted" && page.results.length === 0 && <p className="text-sm">No {status} payments.</p>}
    <LoadMore status={page.status} loadMore={page.loadMore} count={page.results.length} label="payments" pageSize={25} />
  </section>;
}
