"use client";

import { useState, type ReactNode } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { adminError } from "./adminError";
import AdminDialog from "./AdminDialog";

export function BulkPauseModal({
  profiles,
  onSubmit,
  onClose,
  pagination,
}: {
  profiles: Array<{ _id: Id<"billingProfiles">; studentName: string; weeklyRateCents: number }>;
  onSubmit: (ids: Id<"billingProfiles">[], reason: string) => Promise<void>;
  onClose: () => void;
  pagination: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = profiles.filter((p) =>
    p.studentName.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p._id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <AdminDialog onClose={onClose} label="Pause billing" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Pause Billing</h3>
        <p className="mt-1 text-sm text-slate-500">
          Select students to pause billing. They will not be charged until unpaused.
        </p>

        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />

        <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-slate-200">
          <label className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-2.5 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-medium text-slate-700">Select loaded ({filtered.length})</span>
          </label>
          {filtered.map((p) => (
            <label
              key={p._id}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.has(p._id)}
                onChange={() => toggle(p._id)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="flex-1 text-sm text-slate-900">{p.studentName}</span>
              <span className="text-xs text-slate-400">${(p.weeklyRateCents / 100).toFixed(2)}/wk</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-slate-400">No active profiles found</p>
          )}
        </div>

        <textarea
          placeholder="Pause reason (optional)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300"
        />

        {pagination}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (selected.size === 0) return;
              setLoading(true);
              try {
                await onSubmit(Array.from(selected) as Id<"billingProfiles">[], reason);
              } catch (error) { setError(adminError(error, "Unable to save billing changes.")); } finally {
                setLoading(false);
              }
            }}
            disabled={selected.size === 0 || loading}
            className="flex-1 rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Pausing..." : `Pause ${selected.size} student${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </AdminDialog>
  );
}
