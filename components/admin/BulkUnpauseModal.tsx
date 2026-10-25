"use client";

import { useState, type ReactNode } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { adminError } from "./adminError";
import AdminDialog from "./AdminDialog";

export function BulkUnpauseModal({
  profiles,
  onSubmit,
  onClose,
  pagination,
}: {
  profiles: Array<{ _id: Id<"billingProfiles">; studentName: string; pauseReason?: string }>;
  onSubmit: (ids: Id<"billingProfiles">[]) => Promise<void>;
  onClose: () => void;
  pagination: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
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
    <AdminDialog onClose={onClose} label="Resume billing" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">Unpause Billing</h3>
        <p className="mt-1 text-sm text-slate-500">
          Select students to resume billing. They will be charged again on their next class day.
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
              {p.pauseReason && (
                <span className="max-w-[120px] truncate text-xs text-yellow-600" title={p.pauseReason}>
                  {p.pauseReason}
                </span>
              )}
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-4 text-center text-sm text-slate-400">No paused profiles found</p>
          )}
        </div>

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
                await onSubmit(Array.from(selected) as Id<"billingProfiles">[]);
              } catch (error) { setError(adminError(error, "Unable to save billing changes.")); } finally {
                setLoading(false);
              }
            }}
            disabled={selected.size === 0 || loading}
            className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Unpausing..." : `Unpause ${selected.size} student${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </AdminDialog>
  );
}
