"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "overview" | "timetable" | "resources";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!isLoading && (!session || session.type !== "student")) {
      router.push("/student/login");
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!session || session.type !== "student") {
    return null;
  }

  const studentId = session.studentId as Id<"students">;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img
                src="/images/simple-text-black.svg"
                alt="Simple Tuition"
                className="h-8 sm:h-10"
              />
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-600">Student Portal</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-sm text-slate-600">Hi, {session.name}</span>
            <button
              onClick={() => {
                logout();
                router.push("/student/login");
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="flex gap-4 overflow-x-auto sm:gap-6">
            {(["overview", "timetable", "resources"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "overview" && <OverviewTab studentId={studentId} />}
        {activeTab === "timetable" && <TimetableTab studentId={studentId} />}
        {activeTab === "resources" && <ResourcesTab studentId={studentId} />}
      </main>
    </div>
  );
}

function OverviewTab({ studentId }: { studentId: Id<"students"> }) {
  const overview = useQuery(api.studentDashboard.getOverview, { studentId });

  if (!overview) {
    return <div className="text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {overview.student.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {overview.student.yearLevel} • {overview.student.subjects.join(", ")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Your Tutors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Your Tutors</h2>
          <div className="mt-4 space-y-3">
            {overview.tutors.length > 0 ? (
              overview.tutors.map((tutor) => (
                <div
                  key={tutor._id}
                  className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">{tutor.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{tutor.email}</div>
                    {tutor.subjects.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tutor.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No tutors assigned yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Classes</h2>
          <div className="mt-4 space-y-3">
            {overview.upcomingSessions.length > 0 ? (
              overview.upcomingSessions.slice(0, 5).map((session, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {session.className}
                      </div>
                      <div className="text-sm text-slate-500">
                        {session.subject} • {session.tutorName}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-slate-700">
                        {session.dayOfWeek}
                      </div>
                      <div className="text-slate-500">
                        {session.startTime}–{session.endTime}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No upcoming classes</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Resources */}
      {overview.recentResources.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Recent Resources</h2>
          <div className="mt-4 space-y-3">
            {overview.recentResources.map((resource) => (
              <div
                key={resource._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <div>
                  <div className="font-medium text-slate-900">{resource.title}</div>
                  {resource.subject && (
                    <div className="text-sm text-slate-500">{resource.subject}</div>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(resource.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimetableTab({ studentId }: { studentId: Id<"students"> }) {
  const classes = useQuery(api.studentDashboard.getTimetable, { studentId });
  const [weekOffset, setWeekOffset] = useState(0);

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Calculate the week's date range based on offset
  const getWeekDates = (offset: number) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + offset * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { monday, sunday };
  };

  const { monday, sunday } = getWeekDates(weekOffset);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  };

  const getDateForDay = (dayIndex: number) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    return date.getDate();
  };

  const grouped = days.map((day, index) => {
    const dayClasses = (classes ?? [])
      .filter((cls) => cls.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    return { day, date: getDateForDay(index), classes: dayClasses };
  });

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Weekly Timetable</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Previous week"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-[140px] text-center">
            <span className="text-sm font-medium text-slate-700">
              {formatDate(monday)} – {formatDate(sunday)}
            </span>
            {isCurrentWeek && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                This week
              </span>
            )}
          </div>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Next week"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Today
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {grouped.map((group) => (
          <div
            key={group.day}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-3">
              <div className="text-sm font-semibold text-slate-700">{group.day}</div>
              <div className="text-xs text-slate-400">{group.date}</div>
            </div>
            <div className="space-y-3">
              {group.classes.length > 0 ? (
                group.classes.map((cls) => (
                  <div
                    key={cls._id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {cls.name}
                    </div>
                    <div>{cls.subject}</div>
                    <div>
                      {cls.startTime}–{cls.endTime}
                    </div>
                    <div className="mt-1 text-slate-500">with {cls.tutorName}</div>
                    {cls.location && (
                      <div className="text-slate-400">{cls.location}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No classes</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourcesTab({ studentId }: { studentId: Id<"students"> }) {
  const resources = useQuery(api.studentDashboard.getResources, { studentId });

  if (!resources) {
    return <div className="text-slate-500">Loading...</div>;
  }

  // Group resources by subject
  const grouped = resources.reduce(
    (acc, resource) => {
      const subject = resource.subject || "General";
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(resource);
      return acc;
    },
    {} as Record<string, typeof resources>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Homework & Resources
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Resources and homework shared by your tutors
        </p>
      </div>

      {resources.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([subject, items]) => (
            <div key={subject}>
              <h3 className="mb-4 text-lg font-medium text-slate-800">{subject}</h3>
              <div className="space-y-3">
                {items.map((resource) => (
                  <div
                    key={resource._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="mt-2 text-sm text-slate-600">
                            {resource.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                          <span>Added by {resource.createdByName}</span>
                          <span>
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Open Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="text-slate-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-4 font-medium text-slate-900">No resources yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Your tutors will add homework and resources here
          </p>
        </div>
      )}
    </div>
  );
}
