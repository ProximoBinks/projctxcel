"use client";

import { useRef } from "react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import AdminDialog from "./AdminDialog";
import { adelaideDate } from "../../lib/adelaideDate";

export function ManualChargeModal({
  adminId,
  studentId,
  studentName,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  studentId: Id<"students">;
  studentName: string;
  onClose: () => void;
}) {
  const manualCharge = useAction(api.stripeActions.manualCharge);
  const storageKey = `admin-charge:${adminId}:${studentId}`;
  const [resume] = useState<{ requestId: string; amountCents: number; description: string } | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) ?? "null"); } catch { return null; }
  });
  const requestId = useRef<string | null>(resume?.requestId ?? null);
  const [submitted, setSubmitted] = useState(!!resume);
  const billingProfile = useQuery(api.billing.getBillingProfile, { studentId });
  const [amount, setAmount] = useState(resume ? (resume.amountCents / 100).toFixed(2) : "");
  const [description, setDescription] = useState(resume?.description ?? "");
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [singleDate, setSingleDate] = useState(() => adelaideDate());
  const [rangeStart, setRangeStart] = useState(() => adelaideDate());
  const [rangeEnd, setRangeEnd] = useState(() => adelaideDate());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [receiptDescription, setReceiptDescription] = useState("");

  const presets = billingProfile?.weeklyRate.breakdown.filter((l) => !l.paused && l.lineTotalCents > 0) ?? [];

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };

  const buildFullDescription = () => {
    if (resume) return resume.description;
    const base = description.trim();
    const datePart =
      dateMode === "single"
        ? formatDateLabel(singleDate)
        : `${formatDateLabel(rangeStart)} – ${formatDateLabel(rangeEnd)}`;
    return base ? `${base} (${datePart})` : datePart;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (dateMode === "range" && rangeEnd < rangeStart) {
      setError("End date must be on or after start date");
      return;
    }
    if (loading) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      const payload = saved ? JSON.parse(saved) as { requestId: string; amountCents: number; description: string } : {
        requestId: requestId.current ?? crypto.randomUUID(), amountCents: cents, description: buildFullDescription(),
      };
      requestId.current = payload.requestId;
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      setSubmitted(true);
      setLoading(true);
      setError("");
      const result = await manualCharge({
        ...payload,
        adminId,
        studentId,
      });
      if (result.status === "succeeded" || result.status === "failed") sessionStorage.removeItem(storageKey);
      if (result.success) {
        setAmount((payload.amountCents / 100).toFixed(2));
        setReceiptDescription(payload.description);
        setSuccess(true);
      } else {
        setError(result.error ?? "Charge failed");
      }
    } catch (err: any) {
      setError(err.message ?? "Charge failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AdminDialog onClose={onClose} label="Charge Successful" width="max-w-md">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Charge Successful</h2>
          <p className="mt-1 text-sm text-slate-500">
            ${parseFloat(amount).toFixed(2)} has been charged to {studentName}&apos;s card.
          </p>
          <p className="mt-1 text-xs text-slate-400">{receiptDescription}</p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </AdminDialog>
    );
  }

  return (
    <AdminDialog onClose={onClose} label={`Charge card for ${studentName}`} width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Charge Card — {studentName}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          This will immediately charge the student&apos;s card on file.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <p className="text-xs text-slate-500">If a previous submission is awaiting confirmation in this browser, this checks that original payment. Its amount and description are preserved.</p>
          {presets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Quick Presets</label>
              <div className="mt-2 space-y-1.5">
                {presets.map((p) => (
                  <button
                    disabled={submitted}
                    key={`${p.classId}-${p.dayOfWeek}`}
                    type="button"
                    onClick={() => {
                      setAmount((p.lineTotalCents / 100).toFixed(2));
                      setDescription(`${p.subject} — ${p.tutorName} (${p.dayOfWeek} ${p.startTime}–${p.endTime})`);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <div>
                      <span className="font-medium text-slate-900">{p.className}</span>
                      <span className="ml-2 text-slate-500">{p.subject} &middot; {p.tutorName}</span>
                      <div className="text-xs text-slate-400">
                        {p.dayOfWeek} {p.startTime}–{p.endTime} &middot; {p.durationMinutes}min @ ${(p.rateCents / 100).toFixed(0)}/hr
                      </div>
                    </div>
                    <span className="ml-3 whitespace-nowrap font-semibold text-slate-900">
                      ${(p.lineTotalCents / 100).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-40">Amount ($)</label>
            <input disabled={submitted} id="admin-field-40"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
              step="0.01"
              min="0.01"
              placeholder="e.g. 75.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-41">Description</label>
            <input disabled={submitted} id="admin-field-41"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Extra lesson, Materials fee"
            />
          </div>

          {/* Date selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Charge Period</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={submitted}
                onClick={() => setDateMode("single")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  dateMode === "single"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Single Date
              </button>
              <button
                type="button"
                disabled={submitted}
                onClick={() => setDateMode("range")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  dateMode === "range"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Date Range
              </button>
            </div>
            {dateMode === "single" ? (
              <input
                disabled={submitted}
                  type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                required
              />
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <input
                  disabled={submitted}
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
                <span className="text-sm text-slate-400">to</span>
                <input
                  disabled={submitted}
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>
            )}
            <p className="mt-1.5 text-xs text-slate-400">
              Saved as: {buildFullDescription() || "—"}
            </p>
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Checking payment…" : submitted ? "Check original payment" : "Submit payment"}
            </button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
}
