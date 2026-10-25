"use client";

import { useState } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LoadMore } from "./LoadMore";
import AdminDialog from "./AdminDialog";
import { adminError } from "./adminError";

export function ClassesTab({
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
                        <div className="flex flex-wrap gap-1.5">
                          {cls.tutors.map((t) => {
                            const colors = [
                              "bg-violet-100 text-violet-700",
                              "bg-blue-100 text-blue-700",
                              "bg-emerald-100 text-emerald-700",
                              "bg-amber-100 text-amber-700",
                              "bg-rose-100 text-rose-700",
                              "bg-cyan-100 text-cyan-700",
                              "bg-orange-100 text-orange-700",
                              "bg-teal-100 text-teal-700",
                            ];
                            const hash = t.tutorName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
                            const color = colors[hash % colors.length];
                            const initials = t.tutorName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                            return (
                              <span
                                key={t.tutorId}
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}
                              >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/60 text-[9px] font-bold leading-none">
                                  {initials}
                                </span>
                                {t.tutorName}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
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

export function AddClassModal({
  adminId,
  tutors: _initialTutors,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  tutors: Array<{ _id: Id<"tutorAccounts">; name: string }>;
  onClose: () => void;
}) {
  const tutorPage = usePaginatedQuery(api.adminLists.tutors, { adminId }, { initialNumItems: 50 });
  const tutors = tutorPage.results.filter(t => t.active);
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
  const [hourlyRate, setHourlyRate] = useState("");
  const [tutorId, setTutorId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const rateCents = hourlyRate ? Math.round(parseFloat(hourlyRate) * 100) : undefined;

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
        hourlyRateCents: rateCents && rateCents > 0 ? rateCents : undefined,
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
      setError(adminError(err, "Failed to create class. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDialog onClose={onClose} label="Add Class" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Add Class</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-1">
              Class name
            </label>
            <input id="admin-field-1"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-2">
              Subject
            </label>
            <select id="admin-field-2"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-3">
              Year level
            </label>
            <input id="admin-field-3"
              type="text"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-4">
                Day
              </label>
              <select id="admin-field-4"
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
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-5">
                Start time
              </label>
              <input id="admin-field-5"
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
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-6">
                End time
              </label>
              <input id="admin-field-6"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-7">
                Location
              </label>
              <input id="admin-field-7"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-8">
              Hourly Rate ($)
            </label>
            <input id="admin-field-8"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              step="0.01"
              min="0"
              placeholder="e.g. 50.00 (optional — overrides tutor rate)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-9">
              Assign tutor
            </label>
            <select id="admin-field-9"
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
              {loading ? "Creating..." : "Create Class"}
            </button>
          </div>
        </form>
        <LoadMore {...tutorPage} count={tutorPage.results.length} label="tutors" />
      </div>
    </AdminDialog>
  );
}

export function EditClassModal({
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
    hourlyRateCents?: number;
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
  const [hourlyRate, setHourlyRate] = useState(
    initialClass.hourlyRateCents ? (initialClass.hourlyRateCents / 100).toFixed(2) : "",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const rateCents = hourlyRate ? Math.round(parseFloat(hourlyRate) * 100) : undefined;
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
        hourlyRateCents: rateCents && rateCents > 0 ? rateCents : undefined,
      });
      onClose();
    } catch (err) {
      setError("Failed to update class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDialog onClose={onClose} label="Edit Class" width="max-w-md">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Edit Class</h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-10">
              Class name
            </label>
            <input id="admin-field-10"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-11">
              Subject
            </label>
            <select id="admin-field-11"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">Select subject</option>
              {subjects?.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-12">
              Year level
            </label>
            <input id="admin-field-12"
              type="text"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-13">
                Day
              </label>
              <select id="admin-field-13"
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
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-14">
                Start time
              </label>
              <input id="admin-field-14"
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
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-15">
                End time
              </label>
              <input id="admin-field-15"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-16">
                Location
              </label>
              <input id="admin-field-16"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700" htmlFor="admin-field-17">
              Hourly Rate ($)
            </label>
            <input id="admin-field-17"
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              step="0.01"
              min="0"
              placeholder="e.g. 50.00 (optional — overrides tutor rate)"
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

export function ManageClassStudentsModal({
  adminId,
  classItem,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  classItem: { _id: Id<"classes">; name: string };
  onClose: () => void;
}) {
  const studentPage = usePaginatedQuery(api.adminLists.students, { adminId }, { initialNumItems: 50 });
  const students = studentPage.status === "LoadingFirstPage" ? undefined : studentPage.results;
  const assigned = useQuery(api.classes.listClassStudents, {
    adminId,
    classId: classItem._id,
  });
  const assignStudent = useMutation(api.classes.assignStudentToClass);
  const unassignStudent = useMutation(api.classes.unassignStudentFromClass);

  const assignedIds = new Set((assigned ?? []).map((s) => s._id));

  return (
    <AdminDialog onClose={onClose} label={`Students for ${classItem.name}`} width="max-w-lg">
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

        <LoadMore {...studentPage} count={studentPage.results.length} label="students" />
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

export function ManageClassTutorsModal({
  adminId,
  classId,
  className,
  tutors: _initialTutors,
  onClose,
}: {
  adminId: Id<"tutorAccounts">;
  classId: Id<"classes">;
  className: string;
  tutors: Array<{ _id: Id<"tutorAccounts">; name: string }>;
  onClose: () => void;
}) {
  const tutorPage = usePaginatedQuery(api.adminLists.tutors, { adminId }, { initialNumItems: 50 });
  const tutors = tutorPage.results.filter(t => t.active);
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
    <AdminDialog onClose={onClose} label={`Tutors for ${className}`} width="max-w-md">
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
        <LoadMore {...tutorPage} count={tutorPage.results.length} label="tutors" />
      </div>
    </AdminDialog>
  );
}
