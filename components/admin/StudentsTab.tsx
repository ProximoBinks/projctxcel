"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import AdminDialog from "./AdminDialog";
import { adelaideDate } from "../../lib/adelaideDate";
import { adminError } from "./adminError";

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

export function StudentsTab({
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

  const [actionError, setActionError] = useState("");

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
    setActionError("");
    try {
      const success = await updateStudent({ adminId, studentId, active: !currentActive });
      if (!success) setActionError("Student no longer exists.");
    } catch (error) { setActionError(adminError(error, "Unable to change student status.")); }
  };

  const handleDeleteStudent = async (studentId: Id<"students">, studentName: string) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"? This will also delete all their sessions, class enrollments, and resources. This cannot be undone.`)) {
      return;
    }
    setDeletingStudent(studentId);
    try {
      const result = await deleteStudent({ adminId, studentId });
      if (!result.success) {
        setActionError(result.error || "Failed to delete student");
      }
    } catch {
      setActionError("Failed to delete student");
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
      {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
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

export function ManageStudentClassesModal({
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
  const setCadence = useMutation(api.classes.setEnrollmentCadence);

  const assignedIds = new Set((assigned ?? []).map((c) => c._id));
  const cadenceByClass = new Map(
    (assigned ?? []).map((c) => [
      c._id,
      { interval: c.billingIntervalWeeks ?? 1, anchor: c.billingAnchorDate },
    ]),
  );
  const today = adelaideDate();

  return (
    <AdminDialog onClose={onClose} label={`Classes for ${student.name}`} width="max-w-lg">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Classes for {student.name}
        </h2>

        <div className="mt-4 space-y-2">
          {classes && classes.length > 0 ? (
            classes.map((cls) => {
              const cadence = cadenceByClass.get(cls._id) ?? { interval: 1, anchor: undefined };
              const isAssigned = assignedIds.has(cls._id);
              return (
                <div
                  key={cls._id}
                  className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700"
                >
                  <label className="flex cursor-pointer items-center justify-between">
                    <div>
                      <div className="font-medium">{cls.name}</div>
                      <div className="text-xs text-slate-400">
                        {cls.dayOfWeek} • {cls.startTime}–{cls.endTime}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAssigned}
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

                  {isAssigned && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500">Billing</span>
                      <select
                        value={cadence.interval}
                        onChange={(e) => {
                          const interval = parseInt(e.target.value, 10);
                          if (interval <= 1) {
                            void setCadence({
                              adminId,
                              classId: cls._id,
                              studentId: student._id,
                              intervalWeeks: 1,
                            });
                          } else {
                            void setCadence({
                              adminId,
                              classId: cls._id,
                              studentId: student._id,
                              intervalWeeks: interval,
                              anchorDate: cadence.anchor || today,
                            });
                          }
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value={1}>Weekly</option>
                        <option value={2}>Fortnightly</option>
                        <option value={3}>Every 3 weeks</option>
                        <option value={4}>Every 4 weeks</option>
                      </select>
                      {cadence.interval > 1 && (
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          starting
                          <input
                            type="date"
                            value={cadence.anchor || today}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              void setCadence({
                                adminId,
                                classId: cls._id,
                                studentId: student._id,
                                intervalWeeks: cadence.interval,
                                anchorDate: e.target.value,
                              });
                            }}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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
    </AdminDialog>
  );
}

export function EditStudentModal({
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
    <AdminDialog onClose={onClose} label="Edit Student" width="max-w-md">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Edit Student</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-18">
              Student Name
            </label>
            <input id="admin-field-18"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-19">
              Year Level
            </label>
            <select id="admin-field-19"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Not Set</option>
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
                  key={subject.label}
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
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-20">
              Parent Name
            </label>
            <input id="admin-field-20"
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-21">
              Parent Email
            </label>
            <input id="admin-field-21"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-22">
              Parent Phone
            </label>
            <input id="admin-field-22"
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Optional"
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

export function AddStudentModal({
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
    <AdminDialog onClose={onClose} label="Add Student" width="max-w-md">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Student</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-34">
              Student Name
            </label>
            <input id="admin-field-34"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-35">
              Year Level
            </label>
            <select id="admin-field-35"
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
                  key={subject.label}
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
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-36">
              Parent Name
            </label>
            <input id="admin-field-36"
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-37">
              Parent Email
            </label>
            <input id="admin-field-37"
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-38">
              Parent Phone
            </label>
            <input id="admin-field-38"
              type="tel"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
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
              {loading ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </AdminDialog>
  );
}
