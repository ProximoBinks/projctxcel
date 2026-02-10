"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Id } from "../../convex/_generated/dataModel";

export default function TutorDashboardPage() {
  const router = useRouter();
  const { session, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (
      !authLoading &&
      (!session || session.type !== "tutor" || !session.roles.includes("tutor"))
    ) {
      router.push("/tutor/login");
    }
  }, [session, authLoading, router]);

  if (
    authLoading ||
    !session ||
    session.type !== "tutor" ||
    !session.roles.includes("tutor")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <TutorDashboard
      tutorId={session.id as Id<"tutorAccounts">}
      tutorName={session.name}
      onLogout={logout}
    />
  );
}

function TutorDashboard({
  tutorId,
  tutorName,
  onLogout,
}: {
  tutorId: Id<"tutorAccounts">;
  tutorName: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "sessions" | "students" | "timetable"
  >("overview");
  const [showLogSession, setShowLogSession] = useState(false);

  const students = useQuery(api.dashboard.getMyStudents, { tutorId });
  const earnings = useQuery(api.dashboard.getWeeklyEarnings, { tutorId });
  const sessions = useQuery(api.dashboard.getMySessions, { tutorId });
  const weeklyClasses = useQuery(api.dashboard.getMyWeeklyClasses, { tutorId });

  const handleLogout = () => {
    onLogout();
    router.push("/tutor/login");
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img
                src="/images/simple-text-black.svg"
                alt="Simple Tuition"
                className="h-10 sm:h-[50px]"
              />
            </Link>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">Tutor Dashboard</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-sm text-slate-600">Hi, {tutorName}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 sm:gap-6 sm:px-6">
          {(["overview", "sessions", "students", "timetable"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "overview" && (
          <OverviewTab
            earnings={earnings}
            recentSessions={sessions?.slice(0, 5)}
            studentCount={students?.length ?? 0}
            onLogSession={() => setShowLogSession(true)}
          />
        )}
        {activeTab === "sessions" && (
          <SessionsTab
            tutorId={tutorId}
            sessions={sessions}
            students={students}
            onLogSession={() => setShowLogSession(true)}
          />
        )}
        {activeTab === "students" && (
          <StudentsTab tutorId={tutorId} students={students} />
        )}
        {activeTab === "timetable" && (
          <TimetableTab classes={weeklyClasses} />
        )}
      </main>

      {/* Log Session Modal */}
      {showLogSession && (
        <LogSessionModal
          tutorId={tutorId}
          students={students ?? []}
          onClose={() => setShowLogSession(false)}
        />
      )}
    </div>
  );
}

function OverviewTab({
  earnings,
  recentSessions,
  studentCount,
  onLogSession,
}: {
  earnings: ReturnType<typeof useQuery<typeof api.dashboard.getWeeklyEarnings>>;
  recentSessions: Array<{
    _id: Id<"sessions">;
    studentName: string;
    date: string;
    durationMinutes: number;
    subject: string;
    earnings: number;
  }> | undefined;
  studentCount: number;
  onLogSession: () => void;
}) {
  const formatCurrency = (cents: number) =>
    `$${(cents / 100).toFixed(2)}`;

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <button
          onClick={onLogSession}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          + Log Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">This Week</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {earnings ? formatCurrency(earnings.currentWeek.totalEarnings) : "..."}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {earnings ? formatDuration(earnings.currentWeek.totalMinutes) : "..."} •{" "}
            {earnings?.currentWeek.sessionCount ?? 0} sessions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Last Week</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {earnings ? formatCurrency(earnings.lastWeek.totalEarnings) : "..."}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {earnings ? formatDuration(earnings.lastWeek.totalMinutes) : "..."} •{" "}
            {earnings?.lastWeek.sessionCount ?? 0} sessions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Active Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {studentCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">Assigned to you</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Recent Sessions</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentSessions && recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{session.studentName}</p>
                  <p className="text-sm text-slate-500">
                    {session.subject} • {formatDuration(session.durationMinutes)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">
                    {formatCurrency(session.earnings)}
                  </p>
                  <p className="text-sm text-slate-500">{session.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No sessions logged yet. Click &quot;Log Session&quot; to add your first!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimetableTab({
  classes,
}: {
  classes: ReturnType<typeof useQuery<typeof api.dashboard.getMyWeeklyClasses>>;
}) {
  type ClassList = NonNullable<
    ReturnType<typeof useQuery<typeof api.dashboard.getMyWeeklyClasses>>
  >;
  type ClassRow = ClassList[number];

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
    // Adjust so Monday is day 0 (getDay() returns 0 for Sunday)
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
                group.classes.map((cls: ClassRow) => (
                  <div
                    key={cls._id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {cls.name}
                    </div>
                    <div>
                      {cls.subject} • {cls.yearLevel}
                    </div>
                    <div>
                      {cls.startTime}–{cls.endTime}
                    </div>
                    {cls.location && <div>{cls.location}</div>}
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

function SessionsTab({
  tutorId,
  sessions,
  students,
  onLogSession,
}: {
  tutorId: Id<"tutorAccounts">;
  sessions: ReturnType<typeof useQuery<typeof api.dashboard.getMySessions>>;
  students: ReturnType<typeof useQuery<typeof api.dashboard.getMyStudents>>;
  onLogSession: () => void;
}) {
  type SessionList = NonNullable<
    ReturnType<typeof useQuery<typeof api.dashboard.getMySessions>>
  >;
  type SessionRow = SessionList[number];

  const deleteSession = useMutation(api.dashboard.deleteSession);
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const handleDelete = async (sessionId: Id<"sessions">) => {
    if (!confirm("Delete this session?")) return;
    setDeleting(sessionId);
    await deleteSession({ tutorId, sessionId });
    setDeleting(null);
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">All Sessions</h2>
        <button
          onClick={onLogSession}
            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          + Log Session
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Student</th>
                <th className="px-6 py-3 font-medium">Subject</th>
                <th className="px-6 py-3 font-medium">Duration</th>
                <th className="px-6 py-3 font-medium">Earnings</th>
                <th className="px-6 py-3 font-medium">Notes</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions && sessions.length > 0 ? (
                sessions.map((session: SessionRow) => (
                  <tr key={session._id} className="text-sm">
                    <td className="px-6 py-4 text-slate-900">{session.date}</td>
                    <td className="px-6 py-4 text-slate-900">{session.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{session.subject}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDuration(session.durationMinutes)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(session.earnings)}
                    </td>
                    <td className="max-w-xs truncate px-6 py-4 text-slate-500">
                      {session.notes || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(session._id)}
                        disabled={deleting === session._id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleting === session._id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StudentsTab({
  tutorId,
  students,
}: {
  tutorId: Id<"tutorAccounts">;
  students: ReturnType<typeof useQuery<typeof api.dashboard.getMyStudents>>;
}) {
  type StudentList = NonNullable<
    ReturnType<typeof useQuery<typeof api.dashboard.getMyStudents>>
  >;
  type StudentRow = StudentList[number];

  const updateNotes = useMutation(api.dashboard.updateStudentNotes);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [managingResources, setManagingResources] = useState<{ _id: Id<"students">; name: string } | null>(null);

  const startEditNotes = (studentId: string, currentNotes: string) => {
    setEditingNotes(studentId);
    setNotesValue(currentNotes || "");
  };

  const saveNotes = async (studentId: Id<"students">) => {
    await updateNotes({ tutorId, studentId, notes: notesValue });
    setEditingNotes(null);
    setNotesValue("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">My Students</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {students && students.length > 0 ? (
          students.map((student: StudentRow) => (
            <div
              key={student._id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <StudentClasses tutorId={tutorId} studentId={student._id} />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{student.name}</h3>
                  <p className="text-sm text-slate-500">{student.yearLevel}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    student.active
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {student.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {student.subjects.map((subject: string) => (
                  <span
                    key={subject}
                    className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                  >
                    {subject}
                  </span>
                ))}
              </div>

              {(student.parentName || student.parentEmail || student.parentPhone) && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-slate-500">Parent/Guardian</p>
                  {student.parentName && (
                    <p className="text-sm text-slate-700">{student.parentName}</p>
                  )}
                  {student.parentEmail && (
                    <p className="text-sm text-slate-500">{student.parentEmail}</p>
                  )}
                  {student.parentPhone && (
                    <p className="text-sm text-slate-500">{student.parentPhone}</p>
                  )}
                </div>
              )}

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Notes</p>
                  {editingNotes !== student._id && (
                    <button
                      onClick={() => startEditNotes(student._id, student.notes ?? "")}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingNotes === student._id ? (
                  <div className="mt-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      rows={3}
                      placeholder="Add notes about this student..."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => saveNotes(student._id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    {student.notes || "No notes yet"}
                  </p>
                )}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setManagingResources({ _id: student._id, name: student.name })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Manage Resources
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-500">No students assigned yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Contact admin to get students assigned to you
            </p>
          </div>
        )}
      </div>

      {managingResources && (
        <ManageResourcesModal
          tutorId={tutorId}
          student={managingResources}
          onClose={() => setManagingResources(null)}
        />
      )}
    </div>
  );
}

function ManageResourcesModal({
  tutorId,
  student,
  onClose,
}: {
  tutorId: Id<"tutorAccounts">;
  student: { _id: Id<"students">; name: string };
  onClose: () => void;
}) {
  const resources = useQuery(api.studentDashboard.getResources, { studentId: student._id });
  const addResource = useMutation(api.studentDashboard.addResource);
  const deleteResource = useMutation(api.studentDashboard.deleteResource);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addResource({
        creatorId: tutorId,
        studentId: student._id,
        title,
        description: description || undefined,
        url: url || undefined,
        subject: subject || undefined,
      });
      setTitle("");
      setDescription("");
      setUrl("");
      setSubject("");
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId: Id<"studentResources">) => {
    if (!confirm("Delete this resource?")) return;
    await deleteResource({ creatorId: tutorId, resourceId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Resources for {student.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Add Resource
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Link (Google Drive, etc.)</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Maths Methods"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Resource"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 space-y-3">
          {resources && resources.length > 0 ? (
            resources.map((resource) => (
              <div
                key={resource._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{resource.title}</h4>
                    {resource.subject && (
                      <span className="mt-1 inline-block rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        {resource.subject}
                      </span>
                    )}
                    {resource.description && (
                      <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
                    )}
                    <div className="mt-2 text-xs text-slate-400">
                      Added {new Date(resource.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                      >
                        Open
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(resource._id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-500">
              No resources added yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentClasses({
  tutorId,
  studentId,
}: {
  tutorId: Id<"tutorAccounts">;
  studentId: Id<"students">;
}) {
  const classes = useQuery(api.dashboard.getStudentClasses, {
    tutorId,
    studentId,
  });

  if (!classes || classes.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Classes
      </p>
      <div className="mt-2 space-y-2">
        {classes.map((cls) => (
          <div
            key={cls._id}
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
          >
            <div className="font-semibold text-slate-900">{cls.name}</div>
            <div>
              {cls.dayOfWeek} • {cls.startTime}–{cls.endTime}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogSessionModal({
  tutorId,
  students,
  onClose,
}: {
  tutorId: Id<"tutorAccounts">;
  students: Array<{
    _id: Id<"students">;
    name: string;
    subjects: string[];
    active: boolean;
  }>;
  onClose: () => void;
}) {
  const logSession = useMutation(api.dashboard.logSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");

  const selectedStudent = students.find((s) => s._id === studentId);
  const activeStudents = students.filter((s) => s.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !subject) {
      setError("Please select a student and subject");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await logSession({
        tutorId,
        studentId: studentId as Id<"students">,
        date,
        durationMinutes,
        subject,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError("Failed to log session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Log Session</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Student
            </label>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setSubject("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select student</option>
              {activeStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
              disabled={!selectedStudent}
            >
              <option value="">Select subject</option>
              {selectedStudent?.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              min={15}
              step={15}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="What did you cover? Any homework assigned?"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

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
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
