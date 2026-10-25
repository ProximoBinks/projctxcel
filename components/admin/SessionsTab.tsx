"use client";

import { useState } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LoadMore } from "./LoadMore";
import { adelaideDate } from "../../lib/adelaideDate";

type SessionRangeKey = "week" | "2weeks" | "month" | "90days" | "year" | "custom";

const SESSION_RANGES: { key: SessionRangeKey; label: string; days?: number }[] = [
  { key: "week", label: "Last 7 days", days: 7 },
  { key: "2weeks", label: "2 Weeks", days: 14 },
  { key: "month", label: "Last 30 days", days: 30 },
  { key: "90days", label: "90 Days", days: 90 },
  { key: "year", label: "Last 365 days", days: 365 },
  { key: "custom", label: "Custom" },
];

function getDateNDaysAgo(n: number): string {
  const d = new Date(`${adelaideDate()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

export function SessionsTab({ adminId }: { adminId: Id<"tutorAccounts"> }) {
  type SummaryList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getEarningsSummary>>
  >;
  type SummaryRow = SummaryList[number];
  const [activeRange, setActiveRange] = useState<SessionRangeKey>("week");
  const [startDate, setStartDate] = useState(() => getDateNDaysAgo(6));
  const [endDate, setEndDate] = useState(() => adelaideDate());

  const selectRange = (key: SessionRangeKey) => {
    setActiveRange(key);
    const range = SESSION_RANGES.find((r) => r.key === key);
    if (range?.days) {
      setStartDate(getDateNDaysAgo(range.days - 1));
      setEndDate(adelaideDate());
    }
  };

  const validRange = Boolean(startDate && endDate && startDate <= endDate);
  const page = usePaginatedQuery(api.adminLists.sessions, validRange ? { adminId, startDate, endDate } : "skip", { initialNumItems: 50 });
  const sessions = page.status === "LoadingFirstPage" ? undefined : page.results;
  const summary = useQuery(
    api.admin.getEarningsSummary,
    validRange ? { adminId, startDate, endDate } : "skip"
  );

  const totalEarnings = summary?.reduce((s, i) => s + i.totalEarnings, 0) ?? 0;
  const totalSessions = summary?.reduce((s, i) => s + i.sessionCount, 0) ?? 0;
  const totalMinutes = summary?.reduce((s, i) => s + i.totalMinutes, 0) ?? 0;

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Sessions & Earnings</h2>
      </div>

      {/* Range buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {SESSION_RANGES.map((range) => (
          <button
            key={range.key}
            onClick={() => selectRange(range.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeRange === range.key
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Custom date pickers */}
      {activeRange === "custom" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600" htmlFor="admin-field-23">From</label>
            <input id="admin-field-23"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600" htmlFor="admin-field-24">To</label>
            <input id="admin-field-24"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Earnings</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary ? formatCurrency(totalEarnings) : "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Sessions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary ? totalSessions : "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Hours</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{summary ? formatDuration(totalMinutes) : "—"}</p>
        </div>
      </div>

      {/* Summary by Tutor */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Earnings by Tutor</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {summary && summary.length > 0 ? (
            summary.map((item: SummaryRow) => (
              <div
                key={item.tutorId}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.tutorName}</p>
                  <p className="text-sm text-slate-500">
                    {item.sessionCount} sessions • {formatDuration(item.totalMinutes)}
                  </p>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(item.totalEarnings)}
                </p>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No sessions in this period
            </div>
          )}
        </div>
      </div>

      {/* All Sessions */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">
            All Sessions
            {sessions && sessions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                {sessions.length} records
              </span>
            )}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Tutor</th>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Subject</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions && sessions.length > 0 ? (
                sessions.map((session) => (
                  <tr key={session._id} className="text-sm">
                    <td className="px-6 py-4 text-slate-900">{session.date}</td>
                    <td className="px-6 py-4 text-slate-600">{session.tutorName}</td>
                    <td className="px-6 py-4 text-slate-600">{session.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{session.subject}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDuration(session.durationMinutes)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(session.earnings)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!validRange ? <p role="alert">Choose a valid start and end date.</p> : <LoadMore {...page} count={page.results.length} label="sessions" />}
    </div>
  );
}
