"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { LoadMore } from "./LoadMore";
import type { Id } from "../../convex/_generated/dataModel";

export function EnquiriesTab({ adminId }: { adminId: Id<"tutorAccounts"> }) {
  const deleteEnquiry = useMutation(api.enquiries.remove);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const page = usePaginatedQuery(api.adminLists.enquiries, { adminId, type: typeFilter === "all" ? undefined : typeFilter, order: sortBy === "newest" ? "desc" : "asc" }, { initialNumItems: 50 });
  const enquiries = page.status === "LoadingFirstPage" ? undefined : page.results;

  if (!enquiries) {
    return <p className="py-12 text-center text-sm text-slate-500">Loading enquiries...</p>;
  }

  const filtered = enquiries
    .filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.message.toLowerCase().includes(q) ||
          (e.phone ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) =>
      sortBy === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
    );

  const filteredIds = filtered.map((e) => e._id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id));
  const someSelected = filteredIds.some((id) => selected.has(id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...filteredIds]));
    }
  };

  const typeOptions = ["all", "student", "tutor", "general"];

  const handleDelete = async (enquiryId: Id<"enquiries">, name: string) => {
    if (!confirm(`Delete enquiry from "${name}"? This cannot be undone.`)) return;
    setDeletingId(enquiryId);
    try {
      await deleteEnquiry({ adminId, enquiryId });
      setSelected((prev) => { const n = new Set(prev); n.delete(enquiryId); return n; });
    } catch {
      alert("Failed to delete enquiry");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const count = selected.size;
    if (!confirm(`Delete ${count} selected enquir${count === 1 ? "y" : "ies"}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          deleteEnquiry({ adminId, enquiryId: id as Id<"enquiries"> })
        )
      );
      setSelected(new Set());
    } catch {
      alert("Some enquiries could not be deleted");
    } finally {
      setBulkDeleting(false);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeBadge = (type?: string) => {
    const styles: Record<string, string> = {
      student: "bg-blue-50 text-blue-700",
      tutor: "bg-purple-50 text-purple-700",
      general: "bg-slate-100 text-slate-700",
    };
    const label = type ?? "unknown";
    return (
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[label] ?? "bg-slate-100 text-slate-600"}`}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Enquiries{" "}
          <span className="text-base font-normal text-slate-500">({filtered.length})</span>
        </h2>
        {someSelected && (
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto"
          >
            {bulkDeleting ? "Deleting..." : `Delete selected (${selected.size})`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or message..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Enquiry cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">
            {search || typeFilter !== "all" ? "No enquiries match your filters." : "No enquiries yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select all row */}
          <div className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              onChange={toggleAll}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-900"
            />
            <span className="text-sm text-slate-500">
              {allSelected ? "Deselect all" : "Select all"}
            </span>
          </div>

          {filtered.map((e) => {
            const isExpanded = expandedId === e._id;
            const isSelected = selected.has(e._id);
            return (
              <div
                key={e._id}
                className={`rounded-2xl border bg-white transition ${isSelected ? "border-slate-400 ring-1 ring-slate-300" : "border-slate-200 hover:border-slate-300"}`}
              >
                {/* Summary row */}
                <div className="flex items-start gap-3 px-4 py-4 sm:items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(e._id)}
                    onClick={(ev) => ev.stopPropagation()}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-slate-900 sm:mt-0"
                  />
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : e._id)}
                    className="flex min-w-0 flex-1 items-start gap-4 text-left sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{e.name}</span>
                        {typeBadge(e.type)}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{e.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{formatDate(e.createdAt)}</span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-500">Phone</dt>
                        <dd className="text-slate-900">{e.phone || "—"}</dd>
                      </div>
                      {e.type === "student" && (
                        <>
                          <div>
                            <dt className="font-medium text-slate-500">Year Level</dt>
                            <dd className="text-slate-900">{e.yearLevel || "—"}</dd>
                          </div>
                          <div>
                            <dt className="font-medium text-slate-500">Subjects</dt>
                            <dd className="text-slate-900">{e.subjects || "—"}</dd>
                          </div>
                          {e.school && (
                            <div>
                              <dt className="font-medium text-slate-500">School</dt>
                              <dd className="text-slate-900">{e.school}</dd>
                            </div>
                          )}
                          {e.targetAtar && (
                            <div>
                              <dt className="font-medium text-slate-500">Target ATAR</dt>
                              <dd className="text-slate-900">{e.targetAtar}</dd>
                            </div>
                          )}
                          {e.plannedCourse && (
                            <div>
                              <dt className="font-medium text-slate-500">Planned Course</dt>
                              <dd className="text-slate-900">{e.plannedCourse}</dd>
                            </div>
                          )}
                          {e.interests && (
                            <div>
                              <dt className="font-medium text-slate-500">Interests</dt>
                              <dd className="text-slate-900">{e.interests}</dd>
                            </div>
                          )}
                        </>
                      )}
                      {e.type === "tutor" && (
                        <>
                          {e.experience && (
                            <div>
                              <dt className="font-medium text-slate-500">Experience</dt>
                              <dd className="text-slate-900">{e.experience}</dd>
                            </div>
                          )}
                          {e.expertise && (
                            <div>
                              <dt className="font-medium text-slate-500">Expertise</dt>
                              <dd className="text-slate-900">{e.expertise}</dd>
                            </div>
                          )}
                          {e.cvFileName && (
                            <div>
                              <dt className="font-medium text-slate-500">CV</dt>
                              <dd className="text-slate-900">{e.cvFileName}</dd>
                            </div>
                          )}
                        </>
                      )}
                      {e.sourcePage && (
                        <div>
                          <dt className="font-medium text-slate-500">Source Page</dt>
                          <dd className="text-slate-900">{e.sourcePage}</dd>
                        </div>
                      )}
                    </dl>

                    {e.message && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-500">Message</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{e.message}</p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDelete(e._id, e.name)}
                        disabled={deletingId === e._id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === e._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <LoadMore {...page} count={page.results.length} label="enquiries" />
    </div>
  );
}
