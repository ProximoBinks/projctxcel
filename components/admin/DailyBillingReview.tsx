"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../convex/_generated/api";
import { adelaideDate } from "../../lib/adelaideDate";
import { LoadMore } from "./LoadMore";
import AdminDialog from "./AdminDialog";
import { adminError } from "./adminError";

type Lesson = FunctionReturnType<typeof api.billingReview.lessons>["page"][number];
const money = (cents: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

export function DailyBillingReview() {
  const [date, setDate] = useState(adelaideDate);
  return <section className="space-y-4" aria-label="Daily lesson billing review">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h3 className="text-lg font-semibold text-slate-900">Daily lesson review</h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">Review the day’s scheduled lessons, confirm they took place, then approve their charges. Only lessons approved before 7pm Adelaide time are charged automatically.</p>
      </div>
      <label className="text-sm font-medium text-slate-700">Lesson date
        <input type="date" value={date} max={adelaideDate()} onChange={event => { if (event.target.value) setDate(event.target.value); }} className="ml-2 rounded-lg border border-slate-300 px-3 py-2" />
      </label>
    </div>
    <ReviewDay key={date} date={date} />
  </section>;
}

function ReviewDay({ date }: { date: string }) {
  const info = useQuery(api.billingReview.day, { date });
  const page = usePaginatedQuery(api.billingReview.lessons, { date }, { initialNumItems: 50 });
  const prepare = useMutation(api.billingReview.prepareToday);
  const approve = useMutation(api.billingReview.approve);
  const chargeNow = useMutation(api.billingReview.chargeApprovedNow);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [confirmation, setConfirmation] = useState<{ mode: "approve" | "charge"; lessons: Lesson[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const summary = info?.summary;
  const pending = page.results.filter(row => row.status === "pending");
  const chosen = pending.filter(row => selected.has(row._id));
  const approved = page.results.filter(row => row.status === "approved").slice(0, 50);
  const allSelected = pending.length > 0 && pending.slice(0, 50).every(row => selected.has(row._id));

  async function refresh() {
    setBusy(true); setError("");
    try { await prepare({}); setMessage("Refreshing today’s scheduled lessons. Changed lessons will need approval again."); }
    catch (error) { setError(adminError(error, "Unable to prepare the summary.")); }
    finally { setBusy(false); }
  }

  async function confirm() {
    if (!confirmation || !summary) return;
    setBusy(true); setError("");
    const reviews = confirmation.lessons.map(row => ({ id: row._id, version: row.version }));
    try {
      if (confirmation.mode === "approve") {
        await approve({ reviews });
        setMessage("Approval saved. Check each lesson’s status: approvals after 7pm wait for Charge approved now.");
      } else {
        await chargeNow({ dayId: summary._id, reviews });
        setMessage("Payment processing requested. Any lesson that changed is held for review; check its status below.");
      }
      setSelected(new Set()); setConfirmation(null);
    } catch (error) { setError(adminError(error, "Unable to update these lessons.")); }
    finally { setBusy(false); }
  }

  if (!info) return <p role="status" className="py-6 text-sm text-slate-600">Loading the daily review…</p>;
  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      The summary is prepared automatically at 6pm. Lessons must have finished before you approve them.
      Unapproved lessons are never charged. Late approvals, including lessons finishing at or after 7pm, wait for a separate charge action.
      Cash accounts stay cash; available credit is applied when payments are queued.
    </div>
    <div className="flex flex-wrap items-center gap-3">
      {date === info.today && <button type="button" onClick={refresh} disabled={busy || summary?.status === "preparing"} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">{summary?.status === "preparing" ? "Preparing summary…" : summary ? "Refresh today’s lessons" : "Prepare today’s summary"}</button>}
      {summary && <p className="text-xs text-slate-500">Scheduled, billable enrolments only. Paused classes and off-cycle weeks are excluded. Tutor session logs are separate.</p>}
    </div>
    {!summary ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No summary has been prepared for this date.{date !== info.today && " Historical schedules are not reconstructed automatically."}</p> : <>
      <p className={`text-xs ${summary.discord?.status === "failed" || summary.discord?.status === "uncertain" ? "text-amber-800" : "text-slate-500"}`}>
        Discord summary: {summary.discord?.status === "sent" ? "sent" : summary.discord?.status === "failed" ? "not sent" : summary.discord?.status === "uncertain" ? "delivery unconfirmed" : summary.discord?.status === "sending" ? "sending…" : summary.discord?.status === "queued" ? "queued" : "scheduled for 6pm Adelaide time"}.
        {summary.discord?.error && ` ${summary.discord.error}`}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[{ label: "Student lessons", value: summary.lessonCount }, { label: "Awaiting review", value: summary.pendingCount }, { label: "Approved · before credit", value: money(summary.approvedCents) }, { label: "Submitted / held", value: `${summary.submittedCount} / ${summary.heldCount}` }].map(item =>
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 text-xl font-semibold text-slate-900">{summary.status === "preparing" ? "…" : item.value}</p></div>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(pending.slice(0, 50).map(row => row._id)))} disabled={busy || summary.status !== "ready"} />Select up to 50 awaiting review</label>
        <button type="button" disabled={busy || chosen.length === 0 || chosen.length > 50 || summary.status !== "ready"} onClick={() => setConfirmation({ mode: "approve", lessons: chosen })} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve selected ({chosen.length})</button>
        <button type="button" disabled={busy || approved.length === 0 || approved.length > 50 || summary.status !== "ready"} onClick={() => setConfirmation({ mode: "charge", lessons: approved })} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50">Charge next approved ({approved.length})</button>
      </div>
      <p className="text-xs text-slate-500">Each approval confirms the lesson took place. “Charge approved shown” is available after the date’s 7pm cutoff; it charges only the approved lessons currently loaded, up to 50 at a time.</p>
      <div className="space-y-3">
        {page.results.map(row => <article key={row._id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1" aria-label={`Select ${row.studentName}, ${row.className}`} checked={selected.has(row._id) && row.status === "pending"} disabled={row.status !== "pending" || busy || summary.status !== "ready"} onChange={() => setSelected(previous => { const next = new Set(previous); if (next.has(row._id)) next.delete(row._id); else if (next.size < 50) next.add(row._id); return next; })} />
              <div><h4 className="font-semibold text-slate-900">{row.studentName}</h4>
                <p className="text-sm text-slate-700">{row.className} · {row.subject}</p>
                <p className="text-xs text-slate-500">{row.startTime}–{row.endTime} · {row.tutorName} · {row.paymentType === "cash" ? "Cash" : row.hasCard ? "Card" : "No card on file"}</p>
              </div>
            </div>
            <div className="text-right"><p className="font-semibold text-slate-900">{money(row.amountCents)}</p>
              {row.amountCents !== row.scheduledCents && <p className="text-xs text-slate-500">Adjusted from {money(row.scheduledCents)}</p>}
              <p className={`mt-1 text-xs font-medium ${row.status === "held" || row.operationStatus === "failed" ? "text-amber-700" : "text-slate-600"}`}>{statusLabel(row)}</p>
            </div>
          </div>
          {row.adjustmentNote && <p className="mt-2 text-sm text-slate-600">Adjustment: {row.adjustmentNote}</p>}
          {(row.note || row.paymentError) && <p className="mt-2 text-sm text-amber-800">{row.paymentError ?? row.note}</p>}
          {row.status === "approved" && row.approvedAt && <p className="mt-2 text-xs text-slate-500">Approved {new Date(row.approvedAt).toLocaleString("en-AU", { timeZone: "Australia/Adelaide" })} Adelaide time.</p>}
          {row.operationStatus === "failed" && <p className="mt-2 text-xs text-slate-500">Use charge history to retry this failed payment. Do not create a replacement manual charge.</p>}
          {row.status !== "submitted" && <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy || summary.status !== "ready"} onClick={() => setEditing(row)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">{row.status === "held" ? "Review held lesson" : "Adjust or hold"}</button>
            {row.status === "pending" && <button disabled={busy || summary.status !== "ready"} onClick={() => setConfirmation({ mode: "approve", lessons: [row] })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50">Approve lesson</button>}
          </div>}
        </article>)}
        {page.status === "Exhausted" && page.results.length === 0 && <p className="rounded-xl bg-white p-6 text-sm text-slate-600">No billable scheduled lessons for this date.</p>}
      </div>
      <LoadMore status={page.status} loadMore={page.loadMore} count={page.results.length} label="student lessons" />
    </>}
    {editing && <EditLesson key={`${editing._id}:${editing.version}`} lesson={editing} onClose={() => setEditing(null)} />}
    {confirmation && <AdminDialog label={confirmation.mode === "approve" ? "Approve lessons" : "Charge approved lessons"} onClose={() => { if (!busy) setConfirmation(null); }}>
      <div className="space-y-4 p-6">
        <h3 className="text-lg font-semibold">{confirmation.mode === "approve" ? "Confirm completed lessons" : "Charge approved lessons now"}</h3>
        <p className="text-sm">{confirmation.lessons.length} student lesson(s), totalling <strong>{money(confirmation.lessons.reduce((sum, row) => sum + row.amountCents, 0))}</strong> before available credit.</p>
        <ul className="max-h-56 overflow-y-auto text-sm">{confirmation.lessons.map(row => <li key={row._id} className="py-1">{row.studentName} · {row.className} · {money(row.amountCents)}</li>)}</ul>
        <p className="text-sm text-slate-600">{confirmation.mode === "approve" ? "Approval confirms these lessons took place. Approvals saved before 7pm Adelaide time are charged at 7pm. Later approvals stay on hold until you request payment." : "This submits only the lessons listed above. Card charges are grouped per student; cash accounts are recorded for manual collection. This action is allowed only after 7pm on the lesson date."}</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button disabled={busy} onClick={() => setConfirmation(null)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={busy} onClick={confirm} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50">{busy ? "Saving…" : confirmation.mode === "approve" ? "Confirm approval" : "Submit charges"}</button></div>
      </div>
    </AdminDialog>}
  </div>;
}

function statusLabel(row: Lesson) {
  if (row.status === "submitted") {
    if (row.operationStatus === "succeeded") return row.paymentType === "cash" ? "Recorded for cash collection" : "Paid / credit applied";
    if (row.operationStatus === "failed") return "Payment failed";
    if (row.operationStatus === "uncertain") return "Payment awaiting confirmation";
    return "Payment processing";
  }
  if (row.status === "approved") return row.autoChargeEligible ? "Approved for the 7pm run" : "Approved · waiting for charge action";
  return row.status === "held" ? "Held · will not be charged" : "Awaiting review";
}

function EditLesson({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const edit = useMutation(api.billingReview.edit);
  const [amount, setAmount] = useState((lesson.amountCents / 100).toFixed(2));
  const [note, setNote] = useState(lesson.adjustmentNote ?? "");
  const [hold, setHold] = useState(lesson.status === "held");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <AdminDialog label={`Review ${lesson.studentName}’s lesson`} onClose={() => { if (!busy) onClose(); }}>
    <form className="space-y-4 p-6" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError("");
      try {
        await edit({ reviewId: lesson._id, version: lesson.version, amountCents: Math.round(Number(amount) * 100), note, hold });
        onClose();
      } catch (error) { setError(adminError(error, "Unable to save changes.")); }
      finally { setBusy(false); }
    }}>
      <h3 className="text-lg font-semibold">{lesson.studentName} · {lesson.className}</h3>
      <label className="block text-sm">Charge amount ($)<input type="number" required min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="block text-sm">Reason / note<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hold} onChange={event => setHold(event.target.checked)} />Hold this lesson — do not charge</label>
      <p className="text-xs text-slate-500">Saving clears any previous approval. Hold cancelled or non-billable lessons; uncheck hold to return a lesson to review.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={busy} type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button></div>
    </form>
  </AdminDialog>;
}
