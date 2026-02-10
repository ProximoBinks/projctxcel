"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
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
    "tutors" | "students" | "sessions" | "classes"
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
          {(["tutors", "students", "sessions", "classes"] as const).map((tab) => (
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
            tutors={tutors}
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
      </main>

      {/* Modals */}
      {showAddTutor && <AddTutorModal onClose={() => setShowAddTutor(false)} />}
      {showAddStudent && tutors && adminId && (
        <AddStudentModal
          adminId={adminId}
          tutors={tutors}
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

function StudentsTab({
  adminId,
  students,
  tutors,
  onAddStudent,
}: {
  adminId: Id<"tutorAccounts">;
  students: ReturnType<typeof useQuery<typeof api.admin.listStudents>>;
  tutors: ReturnType<typeof useQuery<typeof api.admin.listTutorAccounts>>;
  onAddStudent: () => void;
}) {
  type StudentList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.listStudents>>
  >;
  type StudentRow = StudentList[number];

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
    assignedTutorId: Id<"tutorAccounts"> | null;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    active: boolean;
  } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Students</h2>
        <button
          onClick={onAddStudent}
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
        >
          + Add Student
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Year Level</th>
                <th className="px-6 py-3 font-medium">Subjects</th>
                <th className="px-6 py-3 font-medium">Assigned Tutor</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students && students.length > 0 ? (
                students.map((student: StudentRow) => (
                  <tr key={student._id} className="text-sm">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{student.yearLevel}</td>
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
                    <td className="px-6 py-4 text-slate-600">
                      {student.assignedTutorName}
                    </td>
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
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(student._id, student.active)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        {student.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setManagingClasses(student)}
                        className="ml-3 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Classes
                      </button>
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="ml-3 text-sm text-slate-500 hover:text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id, student.name)}
                        disabled={deletingStudent === student._id}
                        className="ml-3 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingStudent === student._id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No students yet
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
          tutors={tutors}
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
  type TutorList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.listTutorAccounts>>
  >;
  type TutorRow = TutorList[number];

  const classes = useQuery(
    api.classes.listClasses,
    { adminId }
  );
  const assignTutor = useMutation(api.classes.assignTutorToClass);
  const unassignTutor = useMutation(api.classes.unassignTutorFromClass);
  const archiveClass = useMutation(api.classes.archiveClass);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [managingStudents, setManagingStudents] = useState<ClassRow | null>(null);

  const handleAssign = async (classId: Id<"classes">, tutorId: string) => {
    if (!tutorId) {
      await unassignTutor({ adminId, classId });
      return;
    }
    await assignTutor({
      adminId,
      classId,
      tutorId: tutorId as Id<"tutorAccounts">,
    });
  };

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

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                <th className="px-6 py-3 font-medium">Class</th>
                <th className="px-6 py-3 font-medium">Schedule</th>
                <th className="px-6 py-3 font-medium">Tutor</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes && classes.length > 0 ? (
                classes.map((cls: ClassRow) => (
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
                      <select
                        value={cls.tutorId ?? ""}
                        onChange={(e) => handleAssign(cls._id, e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {tutors?.map((tutor: TutorRow) => (
                          <option key={tutor._id} value={tutor._id}>
                            {tutor.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          cls.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {cls.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditingClass(cls)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setManagingStudents(cls)}
                        className="ml-3 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Students
                      </button>
                      <button
                        onClick={() => archiveClass({ adminId, classId: cls._id })}
                        className="ml-3 text-sm text-red-600 hover:text-red-700"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No classes yet
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
  tutors,
  initialStudent,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  tutors: ReturnType<typeof useQuery<typeof api.admin.listTutorAccounts>>;
  initialStudent: {
    _id: Id<"students">;
    name: string;
    yearLevel: string;
    subjects: string[];
    assignedTutorId: Id<"tutorAccounts"> | null;
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
  const [assignedTutorId, setAssignedTutorId] = useState<
    Id<"tutorAccounts"> | null
  >(initialStudent.assignedTutorId ?? null);
  const [parentName, setParentName] = useState(initialStudent.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initialStudent.parentEmail ?? "");
  const [parentPhone, setParentPhone] = useState(initialStudent.parentPhone ?? "");
  const [active, setActive] = useState(initialStudent.active);

  const activeTutors = (tutors ?? []).filter((t) => t.active);

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
        assignedTutorId,
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

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assign to Tutor
            </label>
            <select
              value={assignedTutorId ?? ""}
              onChange={(e) =>
                setAssignedTutorId(
                  e.target.value ? (e.target.value as Id<"tutorAccounts">) : null
                )
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {activeTutors.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
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

function SessionsTab({ adminId }: { adminId: Id<"tutorAccounts"> }) {
  type SummaryList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getEarningsSummary>>
  >;
  type SummaryRow = SummaryList[number];
  type SessionList = NonNullable<
    ReturnType<typeof useQuery<typeof api.admin.getAllSessions>>
  >;
  type SessionRow = SessionList[number];

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const sessions = useQuery(
    api.admin.getAllSessions,
    { adminId, startDate, endDate }
  );
  const summary = useQuery(
    api.admin.getEarningsSummary,
    { adminId, startDate, endDate }
  );

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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
          <h3 className="font-semibold text-slate-900">All Sessions</h3>
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
  tutors,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  tutors: Array<{ _id: Id<"tutorAccounts">; name: string; active: boolean }>;
  onClose: () => void;
}) {
  const createStudent = useMutation(api.admin.createStudent);
  const subjects = useQuery(api.subjects.listSubjects);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Array<string>>([]);
  const [assignedTutorId, setAssignedTutorId] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const activeTutors = tutors.filter((t) => t.active);

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
        assignedTutorId: assignedTutorId
          ? (assignedTutorId as Id<"tutorAccounts">)
          : null,
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

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assign to Tutor
            </label>
            <select
              value={assignedTutorId}
              onChange={(e) => setAssignedTutorId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {activeTutors.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
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
