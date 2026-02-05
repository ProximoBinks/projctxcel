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
    if (!authLoading && (!session || session.type !== "tutor")) {
      router.push("/tutor/login");
    }
  }, [session, authLoading, router]);

  if (authLoading || !session || session.type !== "tutor") {
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
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "students">("overview");
  const [showLogSession, setShowLogSession] = useState(false);

  const students = useQuery(api.dashboard.getMyStudents, { tutorId });
  const earnings = useQuery(api.dashboard.getWeeklyEarnings, { tutorId });
  const sessions = useQuery(api.dashboard.getMySessions, { tutorId });

  const handleLogout = () => {
    onLogout();
    router.push("/tutor/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold text-slate-900">
              SIMPLE <span className="text-sm font-semibold lowercase">tuition</span>
            </Link>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">Tutor Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
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
        <div className="mx-auto flex max-w-6xl gap-6 px-6">
          {(["overview", "sessions", "students"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
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
      <div className="flex gap-4">
        <button
          onClick={onLogSession}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Log Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">All Sessions</h2>
        <button
          onClick={onLogSession}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          + Log Session
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                sessions.map((session) => (
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
  const updateNotes = useMutation(api.dashboard.updateStudentNotes);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

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

      <div className="grid gap-6 md:grid-cols-2">
        {students && students.length > 0 ? (
          students.map((student) => (
            <div
              key={student._id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
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
                {student.subjects.map((subject) => (
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
                      className="text-xs text-indigo-600 hover:underline"
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
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      rows={3}
                      placeholder="Add notes about this student..."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => saveNotes(student._id)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
