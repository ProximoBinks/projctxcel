"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Id } from "../../convex/_generated/dataModel";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { session, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (
      !authLoading &&
      (!session || session.type !== "admin" || !session.roles.includes("admin"))
    ) {
      router.push("/admin/login");
    }
  }, [session, authLoading, router]);

  if (
    authLoading ||
    !session ||
    session.type !== "admin" ||
    !session.roles.includes("admin")
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <AdminDashboard
      adminId={session.id as Id<"tutorAccounts">}
      adminName={session.name}
      onLogout={logout}
    />
  );
}

function AdminDashboard({
  adminId,
  adminName,
  onLogout,
}: {
  adminId: Id<"tutorAccounts">;
  adminName: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "tutors" | "students" | "sessions" | "classes" | "billing"
  >("tutors");
  const [showAddTutor, setShowAddTutor] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);

  const tutors = useQuery(
    api.admin.listTutorAccounts,
    { adminId }
  );
  const students = useQuery(
    api.admin.listStudents,
    { adminId }
  );

  const handleLogout = () => {
    onLogout();
    router.push("/admin/login");
  };

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
                className="h-10 sm:h-[50px]"
              />
            </Link>
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-600">Admin</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="text-sm text-slate-600">Hi, {adminName}</span>
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
          {(["tutors", "students", "sessions", "classes", "billing"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900"
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
        {activeTab === "tutors" && (
          <TutorsTab
            adminId={adminId}
            tutors={tutors}
            onAddTutor={() => setShowAddTutor(true)}
          />
        )}
        {activeTab === "students" && (
          <StudentsTab
            adminId={adminId}
            students={students}
            onAddStudent={() => setShowAddStudent(true)}
          />
        )}
        {activeTab === "sessions" && <SessionsTab adminId={adminId} />}
        {activeTab === "classes" && (
          <ClassesTab
            adminId={adminId}
            tutors={tutors}
            onAddClass={() => setShowAddClass(true)}
          />
        )}
        {activeTab === "billing" && (
          <BillingTab adminId={adminId} students={students} />
        )}
      </main>

      {/* Modals */}
      {showAddTutor && <AddTutorModal onClose={() => setShowAddTutor(false)} />}
      {showAddStudent && adminId && (
        <AddStudentModal
          adminId={adminId}
          onClose={() => setShowAddStudent(false)}
        />
      )}
      {showAddClass && tutors && adminId && (
        <AddClassModal
          adminId={adminId}
          tutors={tutors}
          onClose={() => setShowAddClass(false)}
        />
      )}
    </div>
  );
}

function TutorsTab({
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

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const saveRate = async (tutorId: Id<"tutorAccounts">) => {
    const cents = Math.round(parseFloat(rateValue) * 100);
    if (isNaN(cents)) return;
    await updateTutor({ adminId, tutorId, hourlyRate: cents });
    setEditingRate(null);
  };

  const toggleActive = async (tutorId: Id<"tutorAccounts">, currentActive: boolean) => {
    await updateTutor({ adminId, tutorId, active: !currentActive });
  };

  const toggleAdminRole = async (
    tutorId: Id<"tutorAccounts">,
    roles: string[]
  ) => {
    const hasAdmin = roles.includes("admin");
    const nextRoles = hasAdmin
      ? roles.filter((role) => role !== "admin")
      : [...roles, "admin"];
    await updateTutor({ adminId, tutorId, roles: nextRoles });
  };

  const handleDeleteTutor = async (tutorId: Id<"tutorAccounts">, tutorName: string) => {
    if (!confirm(`Are you sure you want to delete "${tutorName}"? This will also delete all their sessions and class assignments. This cannot be undone.`)) {
      return;
    }
    setDeletingTutor(tutorId);
    try {
      const result = await deleteTutor({ adminId, tutorId });
      if (!result.success) {
        alert(result.error || "Failed to delete tutor");
      }
    } catch {
      alert("Failed to delete tutor");
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
                        onClick={() => toggleActive(tutor._id, tutor.active)}
                        className="ml-3 text-sm text-slate-500 hover:text-slate-700"
                      >
                        {tutor.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
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
                    No tutor accounts yet
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

type StudentColumnKey = "name" | "email" | "yearLevel" | "subjects" | "classes" | "tutors" | "status";
const STUDENT_COLUMNS: { key: StudentColumnKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "yearLevel", label: "Year Level" },
  { key: "subjects", label: "Subjects" },
  { key: "classes", label: "Classes" },
  { key: "tutors", label: "Tutors" },
  { key: "status", label: "Status" },
];

function StudentsTab({
  adminId,
  students,
  onAddStudent,
}: {
  adminId: Id<"tutorAccounts">;
  students: ReturnType<typeof useQuery<typeof api.admin.listStudents>>;
  onAddStudent: () => void;
}) {
  type StudentList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.listStudents>>
  >;
  type StudentRow = StudentList[number];

  const classes = useQuery(api.classes.listClasses, { adminId });
  const updateStudent = useMutation(api.admin.updateStudent);
  const deleteStudent = useMutation(api.admin.deleteStudent);
  const [managingClasses, setManagingClasses] = useState<{
    _id: Id<"students">;
    name: string;
  } | null>(null);
  const [editingStudent, setEditingStudent] = useState<{
    _id: Id<"students">;
    name: string;
    yearLevel: string;
    subjects: string[];
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    active: boolean;
  } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<string | null>(null);

  // Column visibility
  const [visibleCols, setVisibleCols] = useState<Set<StudentColumnKey>>(
    new Set(STUDENT_COLUMNS.map((c) => c.key)),
  );
  const [showColPicker, setShowColPicker] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState<"all" | "enrolled" | "no_classes">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCol = (key: StudentColumnKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 2) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleActive = async (studentId: Id<"students">, currentActive: boolean) => {
    await updateStudent({ adminId, studentId, active: !currentActive });
  };

  const handleDeleteStudent = async (studentId: Id<"students">, studentName: string) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"? This will also delete all their sessions, class enrollments, and resources. This cannot be undone.`)) {
      return;
    }
    setDeletingStudent(studentId);
    try {
      const result = await deleteStudent({ adminId, studentId });
      if (!result.success) {
        alert(result.error || "Failed to delete student");
      }
    } catch {
      alert("Failed to delete student");
    } finally {
      setDeletingStudent(null);
    }
  };

  const filteredStudents = (students ?? []).filter((s: StudentRow) => {
    if (statusFilter === "active" && !s.active) return false;
    if (statusFilter === "inactive" && s.active) return false;
    if (enrollmentFilter === "enrolled" && s.enrolledClasses.length === 0) return false;
    if (enrollmentFilter === "no_classes" && s.enrolledClasses.length > 0) return false;
    if (classFilter !== "all" && !s.enrolledClasses.some((c) => c.classId === classFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.yearLevel.toLowerCase().includes(q) &&
        !s.subjects.some((sub: string) => sub.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const activeClasses = (classes ?? []).filter((c) => c.active);
  const colCount = visibleCols.size + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Students
          <span className="ml-2 text-sm font-normal text-slate-400">
            {filteredStudents.length}{students && filteredStudents.length !== students.length ? ` / ${students.length}` : ""}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              Columns
            </button>
            {showColPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowColPicker(false)} />
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {STUDENT_COLUMNS.map((col) => (
                    <label
                      key={col.key}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={() => toggleCol(col.key)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onAddStudent}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students..."
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none sm:w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <select
          value={enrollmentFilter}
          onChange={(e) => setEnrollmentFilter(e.target.value as typeof enrollmentFilter)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
        >
          <option value="all">All enrollment</option>
          <option value="enrolled">Has classes</option>
          <option value="no_classes">No classes</option>
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600"
        >
          <option value="all">All classes</option>
          {activeClasses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        {(statusFilter !== "all" || enrollmentFilter !== "all" || classFilter !== "all" || searchQuery) && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setEnrollmentFilter("all");
              setClassFilter("all");
              setSearchQuery("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                {visibleCols.has("name") && <th className="px-6 py-3 font-medium">Name</th>}
                {visibleCols.has("email") && <th className="px-6 py-3 font-medium">Email</th>}
                {visibleCols.has("yearLevel") && <th className="px-6 py-3 font-medium">Year Level</th>}
                {visibleCols.has("subjects") && <th className="px-6 py-3 font-medium">Subjects</th>}
                {visibleCols.has("classes") && <th className="px-6 py-3 font-medium">Classes</th>}
                {visibleCols.has("tutors") && <th className="px-6 py-3 font-medium">Tutors</th>}
                {visibleCols.has("status") && <th className="px-6 py-3 font-medium">Status</th>}
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student: StudentRow) => (
                  <tr key={student._id} className="text-sm">
                    {visibleCols.has("name") && (
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {student.name}
                      </td>
                    )}
                    {visibleCols.has("email") && (
                      <td className="px-6 py-4 text-slate-600">
                        {student.email || "—"}
                      </td>
                    )}
                    {visibleCols.has("yearLevel") && (
                      <td className="px-6 py-4 text-slate-600">{student.yearLevel}</td>
                    )}
                    {visibleCols.has("subjects") && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.subjects.slice(0, 3).map((s: string) => (
                            <span
                              key={s}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                            >
                              {s}
                            </span>
                          ))}
                          {student.subjects.length > 3 && (
                            <span className="text-xs text-slate-400">
                              +{student.subjects.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleCols.has("classes") && (
                      <td className="px-6 py-4">
                        {student.enrolledClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {student.enrolledClasses.slice(0, 3).map((c) => (
                              <span
                                key={c.classId}
                                className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                              >
                                {c.className}
                              </span>
                            ))}
                            {student.enrolledClasses.length > 3 && (
                              <span className="text-xs text-slate-400">
                                +{student.enrolledClasses.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </td>
                    )}
                    {visibleCols.has("tutors") && (
                      <td className="px-6 py-4 text-slate-600">
                        {student.assignedTutorNames.length > 0
                          ? student.assignedTutorNames.join(", ")
                          : "Unassigned"}
                      </td>
                    )}
                    {visibleCols.has("status") && (
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            student.active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {student.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => toggleActive(student._id, student.active)}
                          className="text-sm text-slate-500 hover:text-slate-700"
                        >
                          {student.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setManagingClasses(student)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Classes
                        </button>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="text-sm text-slate-500 hover:text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student._id, student.name)}
                          disabled={deletingStudent === student._id}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          {deletingStudent === student._id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={colCount} className="px-6 py-8 text-center text-slate-500">
                    {students && students.length > 0 ? "No students match filters" : "No students yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {managingClasses && (
        <ManageStudentClassesModal
          adminId={adminId}
          student={managingClasses}
          onClose={() => setManagingClasses(null)}
        />
      )}
      {editingStudent && (
        <EditStudentModal
          adminId={adminId}
          initialStudent={editingStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}
    </div>
  );
}

function ClassesTab({
  adminId,
  tutors,
  onAddClass,
}: {
  adminId: Id<"tutorAccounts">;
  tutors: ReturnType<typeof useQuery<typeof api.admin.listTutorAccounts>>;
  onAddClass: () => void;
}) {
  type ClassList = NonNullable<
    ReturnType<typeof useQuery<typeof api.classes.listClasses>>
  >;
  type ClassRow = ClassList[number];

  const classes = useQuery(
    api.classes.listClasses,
    { adminId }
  );
  const archiveClass = useMutation(api.classes.archiveClass);
  const unarchiveClass = useMutation(api.classes.unarchiveClass);
  const deleteClass = useMutation(api.classes.deleteClass);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [managingStudents, setManagingStudents] = useState<ClassRow | null>(null);
  const [managingTutors, setManagingTutors] = useState<ClassRow | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<Id<"classes"> | null>(null);
  const [classView, setClassView] = useState<"active" | "archived">("active");

  const handleDelete = async (classId: Id<"classes">) => {
    await deleteClass({ adminId, classId });
    setDeletingClassId(null);
  };

  const activeClasses = classes?.filter((c: ClassRow) => c.active) ?? [];
  const archivedClasses = classes?.filter((c: ClassRow) => !c.active) ?? [];
  const displayedClasses = classView === "active" ? activeClasses : archivedClasses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Classes</h2>
        <button
          onClick={onAddClass}
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          + Add Class
        </button>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setClassView("active")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            classView === "active"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Active{activeClasses.length > 0 && ` (${activeClasses.length})`}
        </button>
        <button
          onClick={() => setClassView("archived")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            classView === "archived"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Archived{archivedClasses.length > 0 && ` (${archivedClasses.length})`}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">Class</th>
                <th className="px-6 py-3 font-medium">Schedule</th>
                <th className="px-6 py-3 font-medium">Tutor</th>
                {classView === "active" && (
                  <th className="px-6 py-3 font-medium">Status</th>
                )}
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedClasses.length > 0 ? (
                displayedClasses.map((cls: ClassRow) => (
                  <tr key={cls._id} className="text-sm">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{cls.name}</div>
                      <div className="text-slate-500">
                        {cls.subject} • {cls.yearLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {cls.dayOfWeek} • {cls.startTime}–{cls.endTime}
                      {cls.location ? ` • ${cls.location}` : ""}
                    </td>
                    <td className="px-6 py-4">
                      {cls.tutors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cls.tutors.map((t) => (
                            <span
                              key={t.tutorId}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {t.tutorName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">Unassigned</span>
                      )}
                    </td>
                    {classView === "active" && (
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Active
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {classView === "active" ? (
                          <>
                            <button
                              onClick={() => setEditingClass(cls)}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setManagingTutors(cls)}
                              className="text-sm text-purple-600 hover:text-purple-700"
                            >
                              Tutors
                            </button>
                            <button
                              onClick={() => setManagingStudents(cls)}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Students
                            </button>
                            <button
                              onClick={() => archiveClass({ adminId, classId: cls._id })}
                              className="text-sm text-amber-600 hover:text-amber-700"
                            >
                              Archive
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => unarchiveClass({ adminId, classId: cls._id })}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              Unarchive
                            </button>
                            {deletingClassId === cls._id ? (
                              <span className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(cls._id)}
                                  className="text-sm font-medium text-red-700 hover:text-red-800"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingClassId(null)}
                                  className="text-sm text-slate-400 hover:text-slate-600"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setDeletingClassId(cls._id)}
                                className="text-sm text-red-500 hover:text-red-600"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={classView === "active" ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                    {classView === "active" ? "No active classes" : "No archived classes"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingClass && (
        <EditClassModal
          adminId={adminId}
          initialClass={editingClass}
          onClose={() => setEditingClass(null)}
        />
      )}
      {managingTutors && (
        <ManageClassTutorsModal
          adminId={adminId}
          classId={managingTutors._id}
          className={managingTutors.name}
          tutors={tutors ?? []}
          onClose={() => setManagingTutors(null)}
        />
      )}
      {managingStudents && (
        <ManageClassStudentsModal
          adminId={adminId}
          classItem={managingStudents}
          onClose={() => setManagingStudents(null)}
        />
      )}
    </div>
  );
}

function AddClassModal({
  adminId,
  tutors,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  tutors: Array<{ _id: Id<"tutorAccounts">; name: string }>;
  onClose: () => void;
}) {
  const createClass = useMutation(api.classes.createClass);
  const assignTutor = useMutation(api.classes.assignTutorToClass);
  const subjects = useQuery(api.subjects.listSubjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [location, setLocation] = useState("");
  const [tutorId, setTutorId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const classId = await createClass({
        adminId,
        name,
        subject,
        yearLevel,
        dayOfWeek,
        startTime,
        endTime,
        location: location || undefined,
      });
      if (tutorId) {
        await assignTutor({
          adminId,
          classId,
          tutorId: tutorId as Id<"tutorAccounts">,
        });
      }
      onClose();
    } catch (err) {
      setError("Failed to create class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Class</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Class name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
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
            >
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Year level
            </label>
            <input
              type="text"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Day
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assign tutor
            </label>
            <select
              value={tutorId}
              onChange={(e) => setTutorId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {tutors.map((tutor) => (
                <option key={tutor._id} value={tutor._id}>
                  {tutor.name}
                </option>
              ))}
            </select>
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditClassModal({
  adminId,
  initialClass,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  initialClass: {
    _id: Id<"classes">;
    name: string;
    subject: string;
    yearLevel: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    location?: string;
  };
  onClose: () => void;
}) {
  const updateClass = useMutation(api.classes.updateClass);
  const subjects = useQuery(api.subjects.listSubjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialClass.name);
  const [subject, setSubject] = useState(initialClass.subject);
  const [yearLevel, setYearLevel] = useState(initialClass.yearLevel);
  const [dayOfWeek, setDayOfWeek] = useState(initialClass.dayOfWeek);
  const [startTime, setStartTime] = useState(initialClass.startTime);
  const [endTime, setEndTime] = useState(initialClass.endTime);
  const [location, setLocation] = useState(initialClass.location ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateClass({
        adminId,
        classId: initialClass._id,
        name,
        subject,
        yearLevel,
        dayOfWeek,
        startTime,
        endTime,
        location: location || undefined,
      });
      onClose();
    } catch (err) {
      setError("Failed to update class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Edit Class</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Class name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
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
            >
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s._id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Year level
            </label>
            <input
              type="text"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Day
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageClassStudentsModal({
  adminId,
  classItem,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  classItem: { _id: Id<"classes">; name: string };
  onClose: () => void;
}) {
  const students = useQuery(api.admin.listStudents, { adminId });
  const assigned = useQuery(api.classes.listClassStudents, {
    adminId,
    classId: classItem._id,
  });
  const assignStudent = useMutation(api.classes.assignStudentToClass);
  const unassignStudent = useMutation(api.classes.unassignStudentFromClass);

  const assignedIds = new Set((assigned ?? []).map((s) => s._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Students for {classItem.name}
        </h2>

        <div className="mt-4 space-y-2">
          {students && students.length > 0 ? (
            students.map((student) => (
              <label
                key={student._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-xs text-slate-400">{student.yearLevel}</div>
                </div>
                <input
                  type="checkbox"
                  checked={assignedIds.has(student._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      void assignStudent({
                        adminId,
                        classId: classItem._id,
                        studentId: student._id,
                      });
                    } else {
                      void unassignStudent({
                        adminId,
                        classId: classItem._id,
                        studentId: student._id,
                      });
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </label>
            ))
          ) : (
            <p className="text-sm text-slate-500">No students available.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageClassTutorsModal({
  adminId,
  classId,
  className,
  tutors,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  classId: Id<"classes">;
  className: string;
  tutors: Array<{ _id: Id<"tutorAccounts">; name: string }>;
  onClose: () => void;
}) {
  const currentTutors = useQuery(api.classes.listClassTutors, {
    adminId,
    classId,
  });
  const assignTutor = useMutation(api.classes.assignTutorToClass);
  const unassignTutor = useMutation(api.classes.unassignTutorFromClass);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [loading, setLoading] = useState(false);

  const assignedIds = new Set((currentTutors ?? []).map((t) => t.tutorId));
  const availableTutors = tutors.filter((t) => !assignedIds.has(t._id));

  const handleAdd = async () => {
    if (!selectedTutorId) return;
    setLoading(true);
    try {
      await assignTutor({
        adminId,
        classId,
        tutorId: selectedTutorId as Id<"tutorAccounts">,
      });
      setSelectedTutorId("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Tutors for {className}
        </h2>

        <div className="mt-4 space-y-2">
          {currentTutors && currentTutors.length > 0 ? (
            currentTutors.map((t) => (
              <div
                key={t.tutorId}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <span className="text-sm font-medium text-slate-700">
                  {t.tutorName}
                </span>
                <button
                  onClick={() =>
                    unassignTutor({ adminId, classId, tutorId: t.tutorId })
                  }
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No tutors assigned.</p>
          )}
        </div>

        {availableTutors.length > 0 && (
          <div className="mt-4 flex gap-2">
            <select
              value={selectedTutorId}
              onChange={(e) => setSelectedTutorId(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Add tutor...</option>
              {availableTutors.map((tutor) => (
                <option key={tutor._id} value={tutor._id}>
                  {tutor.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedTutorId || loading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ManageStudentClassesModal({
  adminId,
  student,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  student: { _id: Id<"students">; name: string };
  onClose: () => void;
}) {
  const classes = useQuery(api.classes.listClasses, { adminId });
  const assigned = useQuery(api.classes.listStudentClasses, {
    adminId,
    studentId: student._id,
  });
  const assignStudent = useMutation(api.classes.assignStudentToClass);
  const unassignStudent = useMutation(api.classes.unassignStudentFromClass);

  const assignedIds = new Set((assigned ?? []).map((c) => c._id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Classes for {student.name}
        </h2>

        <div className="mt-4 space-y-2">
          {classes && classes.length > 0 ? (
            classes.map((cls) => (
              <label
                key={cls._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                <div>
                  <div className="font-medium">{cls.name}</div>
                  <div className="text-xs text-slate-400">
                    {cls.dayOfWeek} • {cls.startTime}–{cls.endTime}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={assignedIds.has(cls._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      void assignStudent({
                        adminId,
                        classId: cls._id,
                        studentId: student._id,
                      });
                    } else {
                      void unassignStudent({
                        adminId,
                        classId: cls._id,
                        studentId: student._id,
                      });
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
              </label>
            ))
          ) : (
            <p className="text-sm text-slate-500">No classes available.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function EditStudentModal({
  adminId,
  initialStudent,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  initialStudent: {
    _id: Id<"students">;
    name: string;
    yearLevel: string;
    subjects: string[];
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    active: boolean;
  };
  onClose: () => void;
}) {
  const updateStudent = useMutation(api.admin.updateStudent);
  const subjects = useQuery(api.subjects.listSubjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(initialStudent.name);
  const [yearLevel, setYearLevel] = useState(initialStudent.yearLevel);
  const [selectedSubjects, setSelectedSubjects] = useState<Array<string>>(
    initialStudent.subjects ?? []
  );
  const [parentName, setParentName] = useState(initialStudent.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initialStudent.parentEmail ?? "");
  const [parentPhone, setParentPhone] = useState(initialStudent.parentPhone ?? "");
  const [active, setActive] = useState(initialStudent.active);

  const yearLevels = [
    "Year 4", "Year 5", "Year 6", "Year 7", "Year 8",
    "Year 9", "Year 10", "Year 11", "Year 12",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateStudent({
        adminId,
        studentId: initialStudent._id,
        name,
        yearLevel,
        subjects: selectedSubjects,
        parentName: parentName || undefined,
        parentEmail: parentEmail || undefined,
        parentPhone: parentPhone || undefined,
        active,
      });
      onClose();
    } catch (err) {
      setError("Failed to update student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Edit Student</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Year Level
            </label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select year level</option>
              {yearLevels.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Subjects
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {subjects?.map((subject) => (
                <label
                  key={subject._id}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.label)}
                    onChange={(e) => {
                      setSelectedSubjects((prev) =>
                        e.target.checked
                          ? [...prev, subject.label]
                          : prev.filter((s) => s !== subject.label)
                      );
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {subject.label}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Parent/Guardian</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Name
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Email
            </label>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Phone
            </label>
            <input
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <input
              id="student-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="student-active">Active</label>
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type SessionRangeKey = "week" | "2weeks" | "month" | "90days" | "year" | "custom";
const SESSION_RANGES: { key: SessionRangeKey; label: string; days?: number }[] = [
  { key: "week", label: "This Week", days: 7 },
  { key: "2weeks", label: "2 Weeks", days: 14 },
  { key: "month", label: "This Month", days: 30 },
  { key: "90days", label: "90 Days", days: 90 },
  { key: "year", label: "This Year", days: 365 },
  { key: "custom", label: "Custom" },
];

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function SessionsTab({ adminId }: { adminId: Id<"tutorAccounts"> }) {
  type SummaryList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getEarningsSummary>>
  >;
  type SummaryRow = SummaryList[number];
  type SessionList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getAllSessions>>
  >;
  type SessionRow = SessionList[number];

  const [activeRange, setActiveRange] = useState<SessionRangeKey>("week");
  const [startDate, setStartDate] = useState(() => getDateNDaysAgo(7));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const selectRange = (key: SessionRangeKey) => {
    setActiveRange(key);
    const range = SESSION_RANGES.find((r) => r.key === key);
    if (range?.days) {
      setStartDate(getDateNDaysAgo(range.days));
      setEndDate(new Date().toISOString().split("T")[0]);
    }
  };

  const sessions = useQuery(
    api.admin.getAllSessions,
    { adminId, startDate, endDate }
  );
  const summary = useQuery(
    api.admin.getEarningsSummary,
    { adminId, startDate, endDate }
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
            <label className="text-sm text-slate-600">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">To</label>
            <input
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
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totalEarnings)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Sessions</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalSessions}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Hours</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatDuration(totalMinutes)}</p>
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
                sessions.map((session: SessionRow) => (
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
    </div>
  );
}

function AddTutorModal({ onClose }: { onClose: () => void }) {
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
      setError("Failed to create tutor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Tutor Account</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Hourly Rate ($)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
              min="0"
              step="0.01"
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Tutor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTutorModal({
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
      // Hash password if provided
      let passwordHash: string | undefined;
      if (password) {
        // Use the same hashing as the create function
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        passwordHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
      }

      const result = await updateTutor({
        adminId,
        tutorId: tutor._id,
        name,
        email,
        ...(passwordHash && { passwordHash }),
        hourlyRate: Math.round(parseFloat(hourlyRate) * 100),
        tutorSlug: tutorSlug || undefined,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to update tutor");
      }
    } catch (err) {
      setError("Failed to update tutor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Edit Tutor Profile</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              New Password <span className="font-normal text-slate-400">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Hourly Rate ($)
            </label>
            <input
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
            <label className="block text-sm font-medium text-slate-700">
              Tutor Slug <span className="font-normal text-slate-400">(for public profile link)</span>
            </label>
            <input
              type="text"
              value={tutorSlug}
              onChange={(e) => setTutorSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="john-smith"
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddStudentModal({
  adminId,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  onClose: () => void;
}) {
  const createStudent = useMutation(api.admin.createStudent);
  const subjects = useQuery(api.subjects.listSubjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Array<string>>([]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const yearLevels = [
    "Year 4", "Year 5", "Year 6", "Year 7", "Year 8",
    "Year 9", "Year 10", "Year 11", "Year 12",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjects.length === 0) {
      setError("Please select at least one subject");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createStudent({
        adminId,
        name,
        yearLevel,
        subjects: selectedSubjects,
        parentName: parentName || undefined,
        parentEmail: parentEmail || undefined,
        parentPhone: parentPhone || undefined,
      });
      onClose();
    } catch (err) {
      setError("Failed to create student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Student</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Student Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Year Level
            </label>
            <select
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select year level</option>
              {yearLevels.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Subjects
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {subjects?.map((subject) => (
                <label
                  key={subject._id}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.label)}
                    onChange={(e) => {
                      setSelectedSubjects((prev) =>
                        e.target.checked
                          ? [...prev, subject.label]
                          : prev.filter((s) => s !== subject.label)
                      );
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {subject.label}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Parent/Guardian (optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Name
            </label>
            <input
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Email
            </label>
            <input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Parent Phone
            </label>
            <input
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
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
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BillingTab({
  adminId,
  students,
}: {
  adminId: Id<"tutorAccounts">;
  students: ReturnType<typeof useQuery<typeof api.admin.listStudents>>;
}) {
  const [billingSubTab, setBillingSubTab] = useState<"profiles" | "upcoming" | "history" | "pauses">("profiles");
  const [showSetup, setShowSetup] = useState(false);
  const [historyRetrying, setHistoryRetrying] = useState<string | null>(null);
  const [historyRetryResult, setHistoryRetryResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "succeeded" | "failed" | "cash" | "credit_applied">("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "auto" | "manual">("all");
  const [viewingHistory, setViewingHistory] = useState<{
    studentId: Id<"students">;
    studentName: string;
  } | null>(null);
  const [addingCredit, setAddingCredit] = useState<{
    studentId: Id<"students">;
    studentName: string;
  } | null>(null);
  const [chargingStudent, setChargingStudent] = useState<{
    studentId: Id<"students">;
    studentName: string;
  } | null>(null);

  const billingProfiles = useQuery(api.billing.listAllBillingProfiles, { adminId });
  const pauseRequests = useQuery(api.billing.listPauseRequests, { adminId });
  const upcomingCharges = useQuery(api.billing.getUpcomingCharges, { adminId });
  const revenueStats = useQuery(api.billing.getRevenueStats, { adminId });
  const allChargeHistory = useQuery(api.billing.getAllChargeHistory, billingSubTab === "history" ? { adminId } : "skip");
  const createBillingProfile = useMutation(api.billing.createBillingProfile);
  const reviewPause = useMutation(api.billing.reviewPauseRequest);
  const adminUnpause = useMutation(api.billing.adminUnpause);
  const addCredit = useMutation(api.billing.addCredit);
  const updatePaymentType = useMutation(api.billing.updatePaymentType);
  const deleteBillingProfile = useMutation(api.billing.deleteBillingProfile);
  const updateBillingStatus = useMutation(api.billing.updateBillingStatus);
  const retryChargeAction = useAction(api.stripeActions.manualCharge);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const studentsWithoutBilling = (students ?? []).filter(
    (s) => !billingProfiles?.some((bp) => bp.studentId === s._id),
  );

  const totalActive = billingProfiles?.filter((p) => p.status === "active").length ?? 0;
  const pendingPauses = pauseRequests?.filter((r) => r.status === "pending").length ?? 0;
  const totalWeeklyRevenue =
    billingProfiles
      ?.filter((p) => p.status === "active")
      .reduce((sum, p) => sum + p.weeklyRateCents, 0) ?? 0;

  const handleSetup = async (studentId: Id<"students">, paymentType: string) => {
    await createBillingProfile({ adminId, studentId, paymentType });
    setShowSetup(false);
  };

  const chargeStatusLabel = (status: string) => {
    switch (status) {
      case "succeeded": return "Paid";
      case "cash": return "Cash";
      case "credit_applied": return "Credit";
      default: return "Failed";
    }
  };

  const chargeStatusClass = (status: string) => {
    switch (status) {
      case "succeeded": return "bg-green-100 text-green-700";
      case "cash": return "bg-amber-100 text-amber-700";
      case "credit_applied": return "bg-blue-100 text-blue-700";
      default: return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Billing</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSetup(true)}
            disabled={studentsWithoutBilling.length === 0}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            title={studentsWithoutBilling.length === 0 ? "All students already have billing profiles" : ""}
          >
            + Set Up Billing
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active Profiles</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totalActive}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pending Pauses</p>
          <p className={`mt-1 text-2xl font-semibold ${pendingPauses > 0 ? "text-yellow-600" : "text-slate-900"}`}>
            {pendingPauses}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Est. Weekly Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatCurrency(totalWeeklyRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">Revenue This Month</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">
            {revenueStats ? formatCurrency(revenueStats.thisMonthCents) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-green-600">
            {revenueStats ? `${revenueStats.chargeCount} total charges` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">All-Time Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">
            {revenueStats ? formatCurrency(revenueStats.allTimeCents) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-green-600">
            {revenueStats ? `This week: ${formatCurrency(revenueStats.thisWeekCents)}` : ""}
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setBillingSubTab("profiles")}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            billingSubTab === "profiles"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Billing Profiles
        </button>
        <button
          onClick={() => setBillingSubTab("upcoming")}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            billingSubTab === "upcoming"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Upcoming Charges
          {upcomingCharges && upcomingCharges.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {upcomingCharges.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setBillingSubTab("history")}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            billingSubTab === "history"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setBillingSubTab("pauses")}
          className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            billingSubTab === "pauses"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Pause Requests
          {pendingPauses > 0 && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              {pendingPauses}
            </span>
          )}
        </button>
      </div>

      {billingSubTab === "profiles" && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                  <th className="px-6 py-3 font-medium">Student</th>
                  <th className="px-6 py-3 font-medium">Payment Type</th>
                  <th className="px-6 py-3 font-medium">Weekly Rate</th>
                  <th className="px-6 py-3 font-medium">Credit</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingProfiles && billingProfiles.length > 0 ? (
                  billingProfiles.map((profile) => (
                    <tr key={profile._id} className="text-sm">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {profile.studentName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              profile.paymentType === "card"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {profile.paymentType === "card"
                              ? profile.cardLast4
                                ? `Card •••• ${profile.cardLast4}`
                                : "Card (no card yet)"
                              : "Cash"}
                          </span>
                          <button
                            onClick={() =>
                              updatePaymentType({
                                adminId,
                                studentId: profile.studentId,
                                paymentType: profile.paymentType === "card" ? "cash" : "card",
                              })
                            }
                            className="text-xs text-slate-500 hover:text-slate-700"
                            title={`Switch to ${profile.paymentType === "card" ? "cash" : "card"}`}
                          >
                            Switch
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900">
                        {formatCurrency(profile.weeklyRateCents)}/wk
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium ${profile.creditBalanceCents > 0 ? "text-blue-700" : "text-slate-400"}`}>
                          {formatCurrency(profile.creditBalanceCents)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              profile.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {profile.status === "active" ? "Active" : "Paused"}
                          </span>
                          {profile.status !== "active" && (
                            <button
                              onClick={() =>
                                updateBillingStatus({
                                  adminId,
                                  billingProfileId: profile._id,
                                  status: "active",
                                })
                              }
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Unpause
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          {profile.paymentType === "card" && profile.cardLast4 && (
                            <button
                              onClick={() => setChargingStudent({ studentId: profile.studentId, studentName: profile.studentName })}
                              className="text-sm font-medium text-purple-600 hover:text-purple-700"
                            >
                              Charge
                            </button>
                          )}
                          <button
                            onClick={() => setAddingCredit({ studentId: profile.studentId, studentName: profile.studentName })}
                            className="text-sm text-green-600 hover:text-green-700"
                          >
                            Credit
                          </button>
                          <button
                            onClick={() =>
                              setViewingHistory({
                                studentId: profile.studentId,
                                studentName: profile.studentName,
                              })
                            }
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            History
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete billing profile for ${profile.studentName}? This cannot be undone.`)) {
                                deleteBillingProfile({ adminId, billingProfileId: profile._id });
                              }
                            }}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No billing profiles yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {billingSubTab === "upcoming" && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                  <th className="px-6 py-3 font-medium">Student</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium">Day</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingCharges && upcomingCharges.length > 0 ? (
                  upcomingCharges.map((charge, i) => (
                    <tr key={`${charge.studentId}-${charge.status}-${charge.className}-${i}`} className="text-sm">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {charge.studentName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{charge.className}</div>
                        <div className="text-xs text-slate-500">
                          {charge.subject} &middot; {charge.tutorName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {charge.startTime} – {charge.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{charge.dayOfWeek}</td>
                      <td className="px-6 py-4">
                        {charge.status === "Today" ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Today
                          </span>
                        ) : (
                          <span className="text-slate-600">{charge.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatCurrency(charge.estimatedCents)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            charge.paymentType === "card" && charge.hasCard
                              ? "bg-blue-100 text-blue-700"
                              : charge.paymentType === "cash"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {charge.paymentType === "card"
                            ? charge.hasCard
                              ? "Card"
                              : "Card (missing)"
                            : "Cash"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No upcoming charges this week
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {upcomingCharges && upcomingCharges.length > 0 && (
            <div className="border-t border-slate-100 px-6 py-3 text-right text-sm font-medium text-slate-700">
              Total:{" "}
              {formatCurrency(
                upcomingCharges.reduce((sum, c) => sum + c.estimatedCents, 0),
              )}
            </div>
          )}
        </div>
      )}

      {billingSubTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Status:</span>
              {(["all", "succeeded", "failed", "cash", "credit_applied"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryStatusFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    historyStatusFilter === f
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "succeeded" ? "Paid" : f === "credit_applied" ? "Credit" : f === "cash" ? "Cash" : "Failed"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Type:</span>
              {(["all", "auto", "manual"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryTypeFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    historyTypeFilter === f
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? "All" : f === "auto" ? "Auto" : "Manual"}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                    <th className="px-6 py-3 font-medium">Student</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allChargeHistory && allChargeHistory.length > 0 ? (
                    (() => {
                      const isAuto = (desc?: string) => !desc || desc.startsWith("Auto:");
                      const filtered = allChargeHistory.filter((c) => {
                        if (historyStatusFilter !== "all" && c.status !== historyStatusFilter) return false;
                        if (historyTypeFilter === "auto" && !isAuto(c.description)) return false;
                        if (historyTypeFilter === "manual" && isAuto(c.description)) return false;
                        return true;
                      });
                      return filtered.length > 0 ? filtered.map((charge) => (
                        <tr
                          key={charge._id}
                          className={`text-sm ${charge.status === "failed" ? "bg-red-50/40" : ""}`}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {charge.studentName}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              !charge.description || charge.description.startsWith("Auto:")
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-violet-100 text-violet-700"
                            }`}>
                              {!charge.description || charge.description.startsWith("Auto:") ? "Auto" : "Manual"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div>{charge.weekStartDate}</div>
                            <div className="text-xs text-slate-400">
                              {new Date(charge.createdAt).toLocaleString("en-AU", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 max-w-[240px]">
                            <div className="truncate">{charge.description || "—"}</div>
                            {charge.failureReason && (
                              <div className="mt-0.5 truncate text-xs text-red-500">
                                {charge.failureReason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {formatCurrency(charge.amountCents)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${chargeStatusClass(charge.status)}`}
                            >
                              {chargeStatusLabel(charge.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {charge.status === "failed" && (
                              <div className="flex items-center gap-2">
                                {historyRetryResult?.id === charge._id && (
                                  <span className={`text-xs font-medium ${historyRetryResult.success ? "text-green-600" : "text-red-600"}`}>
                                    {historyRetryResult.success ? "Success!" : historyRetryResult.error}
                                  </span>
                                )}
                                <button
                                  onClick={async () => {
                                    setHistoryRetrying(charge._id);
                                    setHistoryRetryResult(null);
                                    try {
                                      const result = await retryChargeAction({
                                        adminId,
                                        studentId: charge.studentId,
                                        amountCents: charge.amountCents,
                                        description: `Retry: ${charge.description ?? "Previous failed charge"}`,
                                      });
                                      setHistoryRetryResult({ id: charge._id, success: result.success, error: result.error });
                                    } catch (err: any) {
                                      setHistoryRetryResult({ id: charge._id, success: false, error: err.message ?? "Retry failed" });
                                    } finally {
                                      setHistoryRetrying(null);
                                    }
                                  }}
                                  disabled={historyRetrying === charge._id}
                                  className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                  {historyRetrying === charge._id ? "Retrying..." : "Retry"}
                                </button>
                              </div>
                            )}
                            {charge.stripePaymentIntentId && charge.status === "succeeded" && (
                              <span className="font-mono text-xs text-slate-400">
                                {charge.stripePaymentIntentId.slice(0, 14)}...
                              </span>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                            No {historyStatusFilter === "all" && historyTypeFilter === "all" ? "" : `matching`} charges found
                          </td>
                        </tr>
                      );
                    })()
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        {allChargeHistory ? "No charge history yet" : "Loading..."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {allChargeHistory && allChargeHistory.length > 0 && (
              <div className="flex justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-700">
                <span className="font-medium">
                  {(() => {
                    const isAuto = (desc?: string) => !desc || desc.startsWith("Auto:");
                    const count = allChargeHistory.filter((c) => {
                      if (historyStatusFilter !== "all" && c.status !== historyStatusFilter) return false;
                      if (historyTypeFilter === "auto" && !isAuto(c.description)) return false;
                      if (historyTypeFilter === "manual" && isAuto(c.description)) return false;
                      return true;
                    }).length;
                    return historyStatusFilter === "all" && historyTypeFilter === "all"
                      ? `${allChargeHistory.length} charges`
                      : `${count} of ${allChargeHistory.length} charges`;
                  })()}
                </span>
                <span className="font-medium text-green-700">
                  Total collected: {formatCurrency(
                    allChargeHistory
                      .filter((c) => c.status === "succeeded")
                      .reduce((sum, c) => sum + c.amountCents, 0),
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {billingSubTab === "pauses" && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                  <th className="px-6 py-3 font-medium">Student</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium">Reason</th>
                  <th className="px-6 py-3 font-medium">Dates</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pauseRequests && pauseRequests.length > 0 ? (
                  pauseRequests.map((req) => (
                    <tr key={req._id} className="text-sm">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {req.studentName}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{req.className}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                        {req.reason}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {req.startDate}
                        {req.endDate ? ` — ${req.endDate}` : " — Indefinite"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            req.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : req.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : req.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => reviewPause({ adminId, requestId: req._id, decision: "approved" })}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt("Rejection reason (optional):");
                                reviewPause({ adminId, requestId: req._id, decision: "rejected", reviewNote: note || undefined });
                              }}
                              className="ml-3 text-sm text-red-600 hover:text-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <button
                            onClick={() => adminUnpause({ adminId, requestId: req._id })}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Unpause
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No pause requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup modal */}
      {showSetup && (
        <SetupBillingModal
          students={studentsWithoutBilling}
          onSetup={handleSetup}
          onClose={() => setShowSetup(false)}
        />
      )}

      {/* Charge history modal */}
      {viewingHistory && (
        <ChargeHistoryModal
          adminId={adminId}
          studentId={viewingHistory.studentId}
          studentName={viewingHistory.studentName}
          onClose={() => setViewingHistory(null)}
        />
      )}

      {/* Manual charge modal */}
      {chargingStudent && (
        <ManualChargeModal
          adminId={adminId}
          studentId={chargingStudent.studentId}
          studentName={chargingStudent.studentName}
          onClose={() => setChargingStudent(null)}
        />
      )}

      {/* Add credit modal */}
      {addingCredit && (
        <AddCreditModal
          adminId={adminId}
          studentId={addingCredit.studentId}
          studentName={addingCredit.studentName}
          onClose={() => setAddingCredit(null)}
        />
      )}
    </div>
  );
}

function SetupBillingModal({
  students,
  onSetup,
  onClose,
}: {
  students: Array<{ _id: Id<"students">; name: string }>;
  onSetup: (studentId: Id<"students">, paymentType: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [paymentType, setPaymentType] = useState<"card" | "cash">("card");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await onSetup(selectedStudent as Id<"students">, paymentType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Set Up Billing</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Student</label>
            <select
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
    </div>
  );
}

function ChargeHistoryModal({
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
  const charges = useQuery(api.billing.getChargeHistoryAdmin, { adminId, studentId });
  const credits = useQuery(api.billing.getCreditHistoryAdmin, { adminId, studentId });
  const retryCharge = useAction(api.stripeActions.manualCharge);
  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const [viewTab, setViewTab] = useState<"charges" | "credits">("charges");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);

  const chargeStatusLabel = (status: string) => {
    switch (status) {
      case "succeeded": return "Paid";
      case "cash": return "Cash";
      case "credit_applied": return "Credit";
      default: return "Failed";
    }
  };

  const chargeStatusClass = (status: string) => {
    switch (status) {
      case "succeeded": return "bg-green-100 text-green-700";
      case "cash": return "bg-amber-100 text-amber-700";
      case "credit_applied": return "bg-blue-100 text-blue-700";
      default: return "bg-red-100 text-red-700";
    }
  };

  const chargeStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return (
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "failed":
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleRetry = async (chargeId: string, amountCents: number, originalDesc?: string) => {
    setRetrying(chargeId);
    setRetryResult(null);
    try {
      const result = await retryCharge({
        adminId,
        studentId,
        amountCents,
        description: `Retry: ${originalDesc ?? "Previous failed charge"}`,
      });
      setRetryResult({ id: chargeId, success: result.success, error: result.error });
    } catch (err: any) {
      setRetryResult({ id: chargeId, success: false, error: err.message ?? "Retry failed" });
    } finally {
      setRetrying(null);
    }
  };

  const failedCount = charges?.filter((c) => c.status === "failed").length ?? 0;
  const totalCharged = charges
    ?.filter((c) => c.status === "succeeded")
    .reduce((sum, c) => sum + c.amountCents, 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Charge History — {studentName}
            </h2>
            {charges && charges.length > 0 && (
              <div className="mt-1 flex gap-4 text-xs text-slate-500">
                <span>{charges.length} total charges</span>
                <span className="text-green-600">
                  {formatCurrency(totalCharged)} collected
                </span>
                {failedCount > 0 && (
                  <span className="text-red-500">{failedCount} failed</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setViewTab("charges")}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              viewTab === "charges" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"
            }`}
          >
            Charges
          </button>
          <button
            onClick={() => setViewTab("credits")}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              viewTab === "credits" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"
            }`}
          >
            Credits
          </button>
        </div>

        {viewTab === "charges" && (
          <div className="mt-4 space-y-3">
            {charges && charges.length > 0 ? (
              charges.map((charge) => (
                <div
                  key={charge._id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    charge.status === "failed"
                      ? "border-red-200 bg-red-50/50"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {chargeStatusIcon(charge.status)}
                      <div>
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(charge.amountCents)}
                        </div>
                        {charge.description && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {charge.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chargeStatusClass(charge.status)}`}>
                      {chargeStatusLabel(charge.status)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      {new Date(charge.createdAt).toLocaleString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span>Date: {charge.weekStartDate}</span>
                    {charge.stripePaymentIntentId && (
                      <span className="font-mono">
                        {charge.stripePaymentIntentId.slice(0, 20)}...
                      </span>
                    )}
                  </div>

                  {charge.status === "failed" && (
                    <div className="mt-2">
                      {charge.failureReason && (
                        <div className="flex items-start gap-1.5 rounded-lg bg-red-100/60 px-3 py-2 text-xs text-red-700">
                          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                          </svg>
                          <span>{charge.failureReason}</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        {retryResult?.id === charge._id && (
                          <span className={`text-xs font-medium ${retryResult.success ? "text-green-600" : "text-red-600"}`}>
                            {retryResult.success ? "Retry succeeded!" : retryResult.error}
                          </span>
                        )}
                        <button
                          onClick={() => handleRetry(charge._id, charge.amountCents, charge.description)}
                          disabled={retrying === charge._id}
                          className="ml-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          {retrying === charge._id ? "Retrying..." : "Retry Charge"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No charges yet.</p>
            )}
          </div>
        )}

        {viewTab === "credits" && (
          <div className="mt-4 space-y-2">
            {credits && credits.length > 0 ? (
              credits.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{entry.description}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.createdAt).toLocaleString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                  <span className={`font-medium ${entry.amountCents >= 0 ? "text-green-700" : "text-red-600"}`}>
                    {entry.amountCents >= 0 ? "+" : ""}{formatCurrency(entry.amountCents)}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No credit history.</p>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ManualChargeModal({
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
  const manualCharge = useAction(api.stripeActions.manualCharge);
  const billingProfile = useQuery(api.billing.getBillingProfile, { studentId });
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [singleDate, setSingleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rangeStart, setRangeStart] = useState(() => new Date().toISOString().split("T")[0]);
  const [rangeEnd, setRangeEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const presets = billingProfile?.weeklyRate.breakdown.filter((l) => !l.paused && l.lineTotalCents > 0) ?? [];

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };

  const buildFullDescription = () => {
    const base = description.trim();
    const datePart =
      dateMode === "single"
        ? formatDateLabel(singleDate)
        : `${formatDateLabel(rangeStart)} – ${formatDateLabel(rangeEnd)}`;
    return base ? `${base} (${datePart})` : datePart;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (dateMode === "range" && rangeEnd < rangeStart) {
      setError("End date must be on or after start date");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await manualCharge({
        adminId,
        studentId,
        amountCents: cents,
        description: buildFullDescription(),
      });
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Charge failed");
      }
    } catch (err: any) {
      setError(err.message ?? "Charge failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Charge Successful</h2>
          <p className="mt-1 text-sm text-slate-500">
            ${parseFloat(amount).toFixed(2)} has been charged to {studentName}&apos;s card.
          </p>
          <p className="mt-1 text-xs text-slate-400">{buildFullDescription()}</p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Charge Card — {studentName}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          This will immediately charge the student&apos;s card on file.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {presets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Quick Presets</label>
              <div className="mt-2 space-y-1.5">
                {presets.map((p) => (
                  <button
                    key={`${p.classId}-${p.dayOfWeek}`}
                    type="button"
                    onClick={() => {
                      setAmount((p.lineTotalCents / 100).toFixed(2));
                      setDescription(`${p.subject} — ${p.tutorName} (${p.dayOfWeek} ${p.startTime}–${p.endTime})`);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <div>
                      <span className="font-medium text-slate-900">{p.className}</span>
                      <span className="ml-2 text-slate-500">{p.subject} &middot; {p.tutorName}</span>
                      <div className="text-xs text-slate-400">
                        {p.dayOfWeek} {p.startTime}–{p.endTime} &middot; {p.durationMinutes}min @ ${(p.rateCents / 100).toFixed(0)}/hr
                      </div>
                    </div>
                    <span className="ml-3 whitespace-nowrap font-semibold text-slate-900">
                      ${(p.lineTotalCents / 100).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
              step="0.01"
              min="0.01"
              placeholder="e.g. 75.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
              placeholder="e.g. Extra lesson, Materials fee"
            />
          </div>

          {/* Date selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Charge Period</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDateMode("single")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  dateMode === "single"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  dateMode === "range"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Date Range
              </button>
            </div>
            {dateMode === "single" ? (
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                required
              />
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
                <span className="text-sm text-slate-400">to</span>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>
            )}
            <p className="mt-1.5 text-xs text-slate-400">
              Saved as: {buildFullDescription() || "—"}
            </p>
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
              className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Charging..." : "Charge Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCreditModal({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Add Credit — {studentName}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Amount ($)</label>
            <input
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
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Refund for cancelled class, Goodwill credit"
              required
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
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Credit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
