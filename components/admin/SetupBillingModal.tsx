"use client";

import { useState, type ReactNode } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { adminError } from "./adminError";
import AdminDialog from "./AdminDialog";

export function SetupBillingModal({
  students,
  onSetup,
  onClose,
  pagination,
}: {
  students: Array<{ _id: Id<"students">; name: string }>;
  onSetup: (studentId: Id<"students">, paymentType: string) => Promise<void>;
  onClose: () => void;
  pagination: ReactNode;
}) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [paymentType, setPaymentType] = useState<"card" | "cash">("card");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await onSetup(selectedStudent as Id<"students">, paymentType);
    } catch (error) { setError(adminError(error, "Unable to save billing changes.")); } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDialog onClose={onClose} label="Set Up Billing" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Set Up Billing</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-39">Student</label>
            <select id="admin-field-39"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Payment Type
            </label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("card")}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  paymentType === "card"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("cash")}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  paymentType === "cash"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {pagination}
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
              disabled={loading || !selectedStudent}
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
}
