"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import AdminDialog from "./AdminDialog";
import { adminError } from "./adminError";

export function TutorsTab({
  adminId,
  tutors,
  onAddTutor,
}: {
  adminId: Id<"tutorAccounts">;
  tutors: ReturnType<typeof useQuery<typeof api.admin.listTutorAccounts>>;
  onAddTutor: () => void;
}) {
  type TutorList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.listTutorAccounts>>
  >;
  type TutorRow = TutorList[number];

  const updateTutor = useMutation(api.admin.updateTutorAccount);
  const deleteTutor = useMutation(api.admin.deleteTutorAccount);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState("");
  const [editingTutor, setEditingTutor] = useState<TutorRow | null>(null);
  const [deletingTutor, setDeletingTutor] = useState<string | null>(null);

  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const runTutorUpdate = async (args: Parameters<typeof updateTutor>[0]) => {
    if (saving) return false;
    setSaving(true); setActionError("");
    try {
      const result = await updateTutor(args);
      if (!result.success) setActionError(result.error || "Unable to update tutor.");
      return result.success;
    } catch (error) {
      setActionError(adminError(error, "Unable to update tutor. Please try again."));
      return false;
    } finally { setSaving(false); }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const saveRate = async (tutorId: Id<"tutorAccounts">) => {
    const cents = Math.round(parseFloat(rateValue) * 100);
    if (!Number.isSafeInteger(cents) || cents < 0) { setActionError("Enter a valid non-negative rate."); return; }
    if (await runTutorUpdate({ adminId, tutorId, hourlyRate: cents })) setEditingRate(null);
  };

  const toggleActive = async (tutorId: Id<"tutorAccounts">, currentActive: boolean) => {
    await runTutorUpdate({ adminId, tutorId, active: !currentActive });
  };

  const toggleAdminRole = async (
    tutorId: Id<"tutorAccounts">,
    roles: string[]
  ) => {
    const hasAdmin = roles.includes("admin");
    const nextRoles = hasAdmin
      ? roles.filter((role) => role !== "admin")
      : [...roles, "admin"];
    if (!hasAdmin && !confirm("Grant full admin access, including billing and account management?")) return;
    await runTutorUpdate({ adminId, tutorId, roles: nextRoles });
  };

  const handleDeleteTutor = async (tutorId: Id<"tutorAccounts">, tutorName: string) => {
    if (!confirm(`Are you sure you want to delete "${tutorName}"? This will also delete all their sessions and class assignments. This cannot be undone.`)) {
      return;
    }
    setDeletingTutor(tutorId);
    try {
      const result = await deleteTutor({ adminId, tutorId });
      if (!result.success) {
        setActionError(result.error || "Failed to delete tutor");
      }
    } catch {
      setActionError("Failed to delete tutor");
    } finally {
      setDeletingTutor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Tutor Accounts</h2>
        <button
          onClick={onAddTutor}
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          + Add Tutor
        </button>
      </div>

      {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Hourly Rate</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tutors && tutors.length > 0 ? (
                tutors.map((tutor: TutorRow) => (
                  <tr key={tutor._id} className="text-sm">
                    <td className="px-6 py-4 font-medium text-slate-900">{tutor.name}</td>
                    <td className="px-6 py-4 text-slate-600">{tutor.email}</td>
                    <td className="px-6 py-4">
                      {editingRate === tutor._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={rateValue}
                            onChange={(e) => setRateValue(e.target.value)}
                            className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                            step="0.01"
                          />
                          <button
                            disabled={saving}
                            onClick={() => saveRate(tutor._id)}
                            className="text-blue-600 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingRate(null)}
                            className="text-slate-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRate(tutor._id);
                            setRateValue((tutor.hourlyRate / 100).toFixed(2));
                          }}
                          className="text-slate-900 hover:text-blue-600"
                        >
                          {formatCurrency(tutor.hourlyRate)}/hr
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          tutor.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tutor.active ? "Active" : "Inactive"}
                      </span>
                      {tutor.roles.includes("admin") && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditingTutor(tutor)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        disabled={saving || tutor._id === adminId}
                        onClick={() => toggleActive(tutor._id, tutor.active)}
                        className="ml-3 text-sm text-slate-500 hover:text-slate-700"
                      >
                        {tutor.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        disabled={saving || tutor._id === adminId}
                        onClick={() => toggleAdminRole(tutor._id, tutor.roles)}
                        className="ml-3 text-sm text-slate-500 hover:text-slate-700"
                      >
                        {tutor.roles.includes("admin") ? "Revoke admin" : "Make admin"}
                      </button>
                      <button
                        onClick={() => handleDeleteTutor(tutor._id, tutor.name)}
                        disabled={deletingTutor === tutor._id || tutor._id === adminId}
                        className="ml-3 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        title={tutor._id === adminId ? "Cannot delete yourself" : ""}
                      >
                        {deletingTutor === tutor._id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {tutors === undefined ? "Loading tutors…" : "No tutor accounts yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTutor && (
        <EditTutorModal
          adminId={adminId}
          tutor={editingTutor}
          onClose={() => setEditingTutor(null)}
        />
      )}
    </div>
  );
}

export function AddTutorModal({ adminId, onClose }: { adminId: Id<"tutorAccounts">; onClose: () => void }) {
  const createTutor = useMutation(api.auth.createTutorAccount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hourlyRate, setHourlyRate] = useState("50");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createTutor({
        adminId,
        name,
        email,
        password,
        hourlyRate: Math.round(parseFloat(hourlyRate) * 100),
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(adminError(err, "Failed to create tutor. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDialog onClose={onClose} label="Add Tutor Account" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Tutor Account</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-25">Name</label>
            <input id="admin-field-25"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-26">Email</label>
            <input id="admin-field-26"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-27">Password</label>
            <input id="admin-field-27"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
              minLength={12}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-28">
              Hourly Rate ($)
            </label>
            <input id="admin-field-28"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
              min="0"
              step="0.01"
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Tutor"}
            </button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
}

export function EditTutorModal({
  adminId,
  tutor,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  tutor: {
    _id: Id<"tutorAccounts">;
    name: string;
    email: string;
    hourlyRate: number;
    tutorSlug?: string;
  };
  onClose: () => void;
}) {
  const updateTutor = useMutation(api.admin.updateTutorAccount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(tutor.name);
  const [email, setEmail] = useState(tutor.email);
  const [password, setPassword] = useState("");
  const [hourlyRate, setHourlyRate] = useState((tutor.hourlyRate / 100).toFixed(2));
  const [tutorSlug, setTutorSlug] = useState(tutor.tutorSlug || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await updateTutor({
        adminId,
        tutorId: tutor._id,
        name,
        email,
        ...(password && { password }),
        hourlyRate: Math.round(parseFloat(hourlyRate) * 100),
        tutorSlug: tutorSlug.trim(),
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to update tutor");
      }
    } catch (err) {
      setError(adminError(err, "Failed to update tutor. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDialog onClose={onClose} label="Edit Tutor Profile" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Edit Tutor Profile</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-29">Name</label>
            <input id="admin-field-29"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-30">Email</label>
            <input id="admin-field-30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-31">
              New Password <span className="font-normal text-slate-400">(leave blank to keep current)</span>
            </label>
            <input id="admin-field-31"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              minLength={12}
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-32">
              Hourly Rate ($)
            </label>
            <input id="admin-field-32"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-33">
              Tutor Slug <span className="font-normal text-slate-400">(for public profile link)</span>
            </label>
            <input id="admin-field-33"
              type="text"
              value={tutorSlug}
              onChange={(e) => setTutorSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="john-smith"
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
}
