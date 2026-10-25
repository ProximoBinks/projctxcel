"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import AdminDialog from "./AdminDialog";

export function AddCreditModal({
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
  const addCredit = useMutation(api.billing.addCredit);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await addCredit({ adminId, studentId, amountCents: cents, description: description.trim() });
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to add credit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDialog onClose={onClose} label={`Add credit for ${studentName}`} width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Add Credit — {studentName}
        </h2>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Prefer credit (or bank transfer) over Stripe refunds — frequent Stripe
          refunds can get the account flagged. Credit is auto-applied to their
          next charges.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-42">Amount ($)</label>
            <input id="admin-field-42"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              step="0.01"
              min="0.01"
              placeholder="e.g. 50.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-43">Description</label>
            <input id="admin-field-43"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Refund for cancelled class, Goodwill credit"
              required
            />
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
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Credit"}
            </button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
}
