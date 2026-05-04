"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Id } from "../../convex/_generated/dataModel";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type Tab = "overview" | "timetable" | "resources" | "billing";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [forceEditProfile, setForceEditProfile] = useState(false);

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
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img
                src="/images/simple-text-black.svg"
                alt="Simple Tuition"
                className="h-7 sm:h-10"
              />
            </Link>
            <span className="hidden text-slate-300 sm:inline">|</span>
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">Student Portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">Hi, {session.name}</span>
            <button
              onClick={() => {
                setActiveTab("overview");
                setForceEditProfile(true);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:text-sm"
            >
              Edit profile
            </button>
            <button
              onClick={() => {
                logout();
                router.push("/student/login");
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 sm:text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide sm:gap-2" style={{ WebkitOverflowScrolling: "touch" }}>
            {(["overview", "timetable", "resources", "billing"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium capitalize transition sm:px-4 sm:py-4 ${
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "overview" && (
          <OverviewTab
            studentId={studentId}
            forceEditProfile={forceEditProfile}
            onCloseEditProfile={() => setForceEditProfile(false)}
          />
        )}
        {activeTab === "timetable" && <TimetableTab studentId={studentId} />}
        {activeTab === "resources" && <ResourcesTab studentId={studentId} />}
        {activeTab === "billing" && <StudentBillingTab studentId={studentId} />}
      </main>
    </div>
  );
}

function OverviewTab({
  studentId,
  forceEditProfile,
  onCloseEditProfile,
}: {
  studentId: Id<"students">;
  forceEditProfile: boolean;
  onCloseEditProfile: () => void;
}) {
  const overview = useQuery(api.studentDashboard.getOverview, { studentId });
  const billingProfile = useQuery(api.billing.getBillingProfile, { studentId });
  const subjects = useQuery(api.subjects.listSubjects);
  const updateProfile = useMutation(api.studentDashboard.updateProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [yearLevel, setYearLevel] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Array<string>>([]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmailError, setParentEmailError] = useState("");
  const [parentPhoneError, setParentPhoneError] = useState("");
  const [showSaveTooltip, setShowSaveTooltip] = useState(false);
  const initialized = useRef(false);

  const student = overview?.student;

  // Initialise form fields once when student data first loads.
  // Using a ref prevents the effect from re-running when the user clears a field,
  // which would otherwise reset it back to the saved value.
  useEffect(() => {
    if (!student || initialized.current) return;
    initialized.current = true;
    setYearLevel(student.yearLevel !== "Not Set" ? student.yearLevel : "");
    setSelectedSubjects(student.subjects ?? []);
    setParentName(student.parentName ?? "");
    setParentEmail(student.parentEmail ?? "");
    setParentPhone(student.parentPhone ?? "");
  }, [student]);

  if (!overview) {
    return <div className="text-slate-500">Loading...</div>;
  }

  const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneValid = (v: string) => /^[0-9\s\+\-\(\)]{6,20}$/.test(v);

  const profileComplete =
    yearLevel.trim().length > 0 &&
    parentName.trim().length > 0 &&
    parentEmail.trim().length > 0 &&
    parentPhone.trim().length > 0;

  // Show card setup overlay when billing profile exists but no card saved yet
  const needsCardSetup =
    billingProfile !== undefined &&
    billingProfile !== null &&
    !billingProfile.stripePaymentMethodId;

  return (
    <div className="space-y-8">
      {/* Non-dismissable card setup overlay — shown until a card is added */}
      {needsCardSetup && stripePromise && (
        <Elements stripe={stripePromise}>
          <CardSetupOverlay studentId={studentId} />
        </Elements>
      )}
      {needsCardSetup && !stripePromise && (
        <div className="fixed inset-0 z-40 flex h-dvh items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center">
            <p className="text-sm text-red-600">
              Payment setup is unavailable. Please contact support.
            </p>
          </div>
        </div>
      )}

      {/* Edit profile modal — only shown via "Edit profile" button */}
      {forceEditProfile && (
        <div className="fixed inset-0 z-40 flex h-dvh items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-lg sm:max-w-xl max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Edit profile
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update your personal details.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                let valid = true;
                if (!emailValid(parentEmail)) {
                  setParentEmailError("Please enter a valid email address.");
                  valid = false;
                }
                if (!phoneValid(parentPhone)) {
                  setParentPhoneError("Please enter a valid phone number (digits, spaces, +, -, brackets).");
                  valid = false;
                }
                if (!valid) return;
                setSaving(true);
                try {
                  await updateProfile({
                    studentId,
                    yearLevel,
                    subjects: selectedSubjects,
                    parentName: parentName || undefined,
                    parentEmail: parentEmail || undefined,
                    parentPhone: parentPhone || undefined,
                  });
                  onCloseEditProfile();
                } catch {
                  setError("Failed to update your profile. Please try again.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Year Level{" "}
                  <span className="text-[#DE0000]">*</span>
                </label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="">Select year level</option>
                  {[
                    "Year 4",
                    "Year 5",
                    "Year 6",
                    "Year 7",
                    "Year 8",
                    "Year 9",
                    "Year 10",
                    "Year 11",
                    "Year 12",
                  ].map((level) => (
                    <option key={level} value={level}>
                      {level}
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
                <p className="text-sm font-medium text-slate-700">
                  Parent/Guardian Contact
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Parent Name{" "}
                  <span className="text-[#DE0000]">*</span>
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Parent Email{" "}
                  <span className="text-[#DE0000]">*</span>
                </label>
                <input
                  type="text"
                  value={parentEmail}
                  onChange={(e) => {
                    setParentEmail(e.target.value);
                    setParentEmailError(
                      e.target.value && !emailValid(e.target.value)
                        ? "Please enter a valid email address."
                        : "",
                    );
                  }}
                  className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${parentEmailError ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
                  required
                />
                {parentEmailError && (
                  <p className="mt-1 text-xs text-red-600">{parentEmailError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Parent Phone{" "}
                  <span className="text-[#DE0000]">*</span>
                </label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => {
                    setParentPhone(e.target.value);
                    setParentPhoneError(
                      e.target.value && !phoneValid(e.target.value)
                        ? "Please enter a valid phone number."
                        : "",
                    );
                  }}
                  className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${parentPhoneError ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-blue-500"}`}
                  required
                />
                {parentPhoneError && (
                  <p className="mt-1 text-xs text-red-600">{parentPhoneError}</p>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                <div
                  className="relative w-full sm:w-auto"
                  onMouseEnter={() => (!profileComplete || !!parentEmailError || !!parentPhoneError) && setShowSaveTooltip(true)}
                  onMouseLeave={() => setShowSaveTooltip(false)}
                  onTouchStart={() => (!profileComplete || !!parentEmailError || !!parentPhoneError) && setShowSaveTooltip(true)}
                  onTouchEnd={() => setTimeout(() => setShowSaveTooltip(false), 1500)}
                >
                  <button
                    type="submit"
                    disabled={saving || !profileComplete || !!parentEmailError || !!parentPhoneError}
                    className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {saving ? "Saving..." : "Save profile"}
                  </button>
                  {showSaveTooltip && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                      Please fill in all required fields
                      <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onCloseEditProfile}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Welcome back, {overview.student.name}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {overview.student.yearLevel} &middot; {overview.student.subjects.join(", ")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Your Tutors */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Your Tutors</h2>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Upcoming Classes</h2>
          <div className="mt-4 space-y-3">
            {overview.upcomingSessions.length > 0 ? (
              overview.upcomingSessions.slice(0, 5).map((session, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{session.className}</div>
                      <div className="text-xs text-slate-500 sm:text-sm">
                        {session.subject} &middot; {session.tutorName}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs sm:text-sm">
                      <div className="font-medium text-slate-700">{session.dayOfWeek}</div>
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Recent Resources</h2>
          <div className="mt-4 space-y-3">
            {overview.recentResources.map((resource) => (
              <div
                key={resource._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium text-slate-900">{resource.title}</div>
                  {resource.subject && (
                    <div className="text-xs text-slate-500 sm:text-sm">{resource.subject}</div>
                  )}
                </div>
                <div className="shrink-0 text-xs text-slate-400">
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
    <div className="space-y-5">
      {/* Title + week navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Weekly Timetable</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
            aria-label="Previous week"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-medium text-slate-700">
              {formatDate(monday)} – {formatDate(sunday)}
            </span>
            {isCurrentWeek && (
              <span className="mt-0.5 text-xs font-medium text-blue-600">This week</span>
            )}
          </div>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
            aria-label="Next week"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Day cards -- list on mobile, 7-column grid on desktop */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-7">
        {grouped.map((group) => {
          const hasClasses = group.classes.length > 0;
          return (
            <div
              key={group.day}
              className={`rounded-2xl border bg-white p-4 ${
                hasClasses ? "border-blue-200" : "border-slate-200"
              }`}
            >
              <div className="mb-2 flex items-baseline justify-between md:mb-3 md:block">
                <div className="text-sm font-semibold text-slate-700">{group.day}</div>
                <div className="text-xs text-slate-400">{group.date}</div>
              </div>
              {hasClasses ? (
                <div className="space-y-2">
                  {group.classes.map((cls) => (
                    <div
                      key={cls._id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="text-sm font-semibold text-slate-900">{cls.name}</div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {cls.subject} &middot; {cls.startTime}–{cls.endTime}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">with {cls.tutorName}</div>
                      {cls.location && (
                        <div className="text-xs text-slate-400">{cls.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400">No classes</div>
              )}
            </div>
          );
        })}
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
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-900">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="mt-1.5 text-sm text-slate-600">
                            {resource.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
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
                          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:bg-blue-800 sm:w-auto sm:rounded-lg sm:py-2"
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

function StudentBillingTab({ studentId }: { studentId: Id<"students"> }) {
  const profile = useQuery(api.billing.getBillingProfile, { studentId });
  const charges = useQuery(api.billing.getChargeHistory, { studentId });
  const pauseRequests = useQuery(api.billing.getMyPauseRequests, { studentId });
  const creditHistory = useQuery(api.billing.getCreditHistory, { studentId });
  const requestPause = useMutation(api.billing.requestClassPause);
  const cancelPause = useMutation(api.billing.cancelPauseRequest);
  const [showAddCard, setShowAddCard] = useState(false);
  const [pausingClassId, setPausingClassId] = useState<Id<"classes"> | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [pauseStartDate, setPauseStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pauseEndDate, setPauseEndDate] = useState("");
  const [pauseLoading, setPauseLoading] = useState(false);

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (profile === undefined) {
    return <div className="text-slate-500">Loading...</div>;
  }

  if (profile === null) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Billing</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">
            Billing has not been set up for your account yet. Please contact your tutor or
            admin.
          </p>
        </div>
      </div>
    );
  }

  const handleRequestPause = async () => {
    if (!pausingClassId || !pauseReason.trim()) return;
    setPauseLoading(true);
    try {
      await requestPause({
        studentId,
        classId: pausingClassId,
        reason: pauseReason.trim(),
        startDate: pauseStartDate,
        endDate: pauseEndDate || undefined,
      });
      setPausingClassId(null);
      setPauseReason("");
      setPauseEndDate("");
    } catch (err: any) {
      alert(err.message ?? "Failed to submit pause request");
    } finally {
      setPauseLoading(false);
    }
  };

  const getPauseStatusForClass = (classId: Id<"classes">) => {
    if (!pauseRequests) return null;
    return pauseRequests.find(
      (r) => r.classId === classId && (r.status === "pending" || r.status === "approved"),
    ) ?? null;
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
      <h2 className="text-xl font-semibold text-slate-900">Billing</h2>

      {/* Paused billing banner */}
      {profile.status === "paused" && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-200 text-yellow-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Billing is currently paused</p>
              <p className="mt-0.5 text-sm text-yellow-700">
                Your subscription has been paused by your admin. You will not be charged until billing is resumed.
              </p>
              {profile.pauseReason && (
                <p className="mt-1.5 text-sm text-yellow-600">
                  <span className="font-medium">Reason:</span> {profile.pauseReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 rounded-2xl border border-green-200 bg-green-50 p-4 sm:col-span-1 sm:p-5">
          <p className="text-xs font-medium text-green-700 sm:text-sm">Weekly Total</p>
          <p className="mt-1 text-xl font-semibold text-green-900 sm:text-2xl">
            {formatCurrency(profile.weeklyRate.totalCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
          <p className="text-xs font-medium text-blue-700 sm:text-sm">Credit Balance</p>
          <p className="mt-1 text-xl font-semibold text-blue-900 sm:text-2xl">
            {formatCurrency(profile.creditBalanceCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">Payment</p>
          <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
            {profile.paymentType === "cash"
              ? "Cash"
              : profile.cardLast4
                ? `•••• ${profile.cardLast4}`
                : "No card"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Weekly rate breakdown grouped by day */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
            Weekly Rate Breakdown
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Billed daily at 9am for that day&apos;s sessions
          </p>
          {profile.weeklyRate.breakdown.length > 0 ? (
            <div className="mt-4 space-y-4">
              {(() => {
                const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                const grouped = dayOrder
                  .map((day) => ({
                    day,
                    lines: profile.weeklyRate.breakdown.filter((l) => l.dayOfWeek === day),
                  }))
                  .filter((g) => g.lines.length > 0);

                return grouped.map(({ day, lines }) => {
                  const dayTotal = lines.reduce((s, l) => s + l.lineTotalCents, 0);
                  return (
                    <div key={day}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{day}</span>
                        <span className="text-sm font-medium text-slate-600">{formatCurrency(dayTotal)}</span>
                      </div>
                      <div className="space-y-2">
                        {lines.map((line) => {
                          const pauseStatus = getPauseStatusForClass(line.classId);
                          return (
                            <div
                              key={line.classId}
                              className={`rounded-xl border px-3 py-3 sm:px-4 ${
                                line.paused
                                  ? "border-yellow-200 bg-yellow-50"
                                  : "border-slate-100 bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className={`min-w-0 flex-1 ${line.paused ? "opacity-60" : ""}`}>
                                  <div className="font-medium text-slate-900">
                                    {line.className}
                                    {line.paused && (
                                      <span className="ml-1.5 rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                        Paused
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-0.5 text-xs leading-relaxed text-slate-500">
                                    {line.subject} &middot; {line.tutorName}
                                    <br className="sm:hidden" />
                                    <span className="hidden sm:inline"> &middot; </span>
                                    {line.startTime}–{line.endTime} ({line.durationMinutes}min) &middot;{" "}
                                    {formatCurrency(line.rateCents)}/hr
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className={`font-medium ${line.paused ? "text-slate-400 line-through" : "text-slate-900"}`}>
                                    {formatCurrency(line.paused ? Math.round((line.durationMinutes / 60) * line.rateCents) : line.lineTotalCents)}
                                  </div>
                                  {line.paused && (
                                    <div className="text-xs font-medium text-yellow-700">$0.00</div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2">
                                {pauseStatus ? (
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      pauseStatus.status === "pending"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                      {pauseStatus.status === "pending" ? "Pause Pending" : "Paused"}
                                      {pauseStatus.endDate ? ` until ${pauseStatus.endDate}` : ""}
                                    </span>
                                    <button
                                      onClick={() => cancelPause({ studentId, requestId: pauseStatus._id })}
                                      className="rounded-lg px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 active:bg-red-100"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : profile.status !== "paused" ? (
                                  <button
                                    onClick={() => setPausingClassId(line.classId)}
                                    className="rounded-lg px-2 py-1 text-xs text-yellow-700 transition hover:bg-yellow-100 active:bg-yellow-200"
                                  >
                                    Request pause
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-900">Weekly Total</span>
                <span className="text-lg font-semibold text-slate-900">
                  {formatCurrency(profile.weeklyRate.totalCents)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No classes enrolled — weekly rate is $0.00
            </p>
          )}
        </div>

        {/* Card on file */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Payment Method</h3>
          {profile.paymentType === "cash" ? (
            <div className="mt-4">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                Cash payments
              </span>
              <p className="mt-3 text-sm text-slate-500">
                Your billing is set to cash. Contact your tutor to switch to card payments.
              </p>
            </div>
          ) : profile.cardLast4 ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold uppercase text-slate-600">
                  {profile.cardBrand ?? "Card"}
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    &bull;&bull;&bull;&bull; {profile.cardLast4}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCard(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Update card
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-500">No card on file.</p>
              <button
                onClick={() => setShowAddCard(true)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add Card
              </button>
            </div>
          )}

          {/* Credit history summary */}
          {creditHistory && creditHistory.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-900">Recent Credits</h4>
              <div className="mt-2 space-y-1">
                {creditHistory.slice(0, 5).map((entry) => (
                  <div key={entry._id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{entry.description}</span>
                    <span className={entry.amountCents >= 0 ? "font-medium text-green-700" : "font-medium text-red-600"}>
                      {entry.amountCents >= 0 ? "+" : ""}{formatCurrency(entry.amountCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charge history */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Charge History</h3>
        <div className="mt-4 space-y-2">
          {charges && charges.length > 0 ? (
            charges.map((charge) => (
              <div
                key={charge._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3 text-sm sm:px-4"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {formatCurrency(charge.amountCents)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {charge.weekStartDate}
                  </p>
                  {charge.failureReason && (
                    <p className="text-xs text-red-500">{charge.failureReason}</p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${chargeStatusClass(charge.status)}`}>
                  {chargeStatusLabel(charge.status)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No charges yet.</p>
          )}
        </div>
      </div>

      {/* Pause request modal */}
      {pausingClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Request Class Pause</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Reason</label>
                <textarea
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="e.g. Family holiday, exam period..."
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={pauseStartDate}
                    onChange={(e) => setPauseStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    End Date <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={pauseEndDate}
                    onChange={(e) => setPauseEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Leave end date empty for an indefinite pause. Your request will be reviewed by an admin.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setPausingClassId(null); setPauseReason(""); setPauseEndDate(""); }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestPause}
                  disabled={pauseLoading || !pauseReason.trim()}
                  className="flex-1 rounded-xl bg-yellow-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-yellow-700 disabled:opacity-50"
                >
                  {pauseLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add card modal */}
      {showAddCard && stripePromise && (
        <Elements stripe={stripePromise}>
          <AddCardModal
            studentId={studentId}
            onClose={() => setShowAddCard(false)}
          />
        </Elements>
      )}
      {showAddCard && !stripePromise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <p className="text-sm text-red-600">
              Stripe is not configured. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
            </p>
            <button
              onClick={() => setShowAddCard(false)}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddCardModal({
  studentId,
  onClose,
}: {
  studentId: Id<"students">;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const createSetupIntent = useAction(api.stripeActions.createSetupIntent);
  const savePaymentMethod = useAction(api.stripeActions.savePaymentMethod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardError, setCardError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const initSetup = useCallback(async () => {
    try {
      const result = await createSetupIntent({ studentId });
      setClientSecret(result.clientSecret);
    } catch (err: any) {
      setError(err.message ?? "Failed to initialize card setup");
    }
  }, [createSetupIntent, studentId]);

  useEffect(() => {
    initSetup();
  }, [initSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      {
        payment_method: { card: cardElement },
      },
    );

    if (stripeError) {
      setError(stripeError.message ?? "Card setup failed");
      setLoading(false);
      return;
    }

    if (setupIntent?.payment_method) {
      const pmId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id;
      try {
        await savePaymentMethod({
          studentId,
          stripePaymentMethodId: pmId,
        });
        onClose();
      } catch (err: any) {
        setError(err.message ?? "Failed to save payment method");
      }
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {clientSecret ? "Add Your Card" : "Setting up..."}
        </h2>

        {!clientSecret && !error && (
          <p className="mt-4 text-sm text-slate-500">
            Preparing secure card form...
          </p>
        )}

        {clientSecret && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className={`rounded-xl border p-4 ${cardError ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#1e293b",
                      "::placeholder": { color: "#94a3b8" },
                    },
                    invalid: { color: "#dc2626" },
                  },
                }}
                onChange={(e) => {
                  setCardError(e.error?.message ?? "");
                  setCardComplete(e.complete);
                  if (error) setError("");
                }}
              />
            </div>

            {(cardError || error) && (
              <p className="text-sm text-red-600">{cardError || error}</p>
            )}

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
                disabled={loading || !stripe || !cardComplete}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Card"}
              </button>
            </div>
          </form>
        )}

        {error && !clientSecret && (
          <div className="mt-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Non-dismissable overlay shown on first login until a payment method is saved
function CardSetupOverlay({ studentId }: { studentId: Id<"students"> }) {
  const stripe = useStripe();
  const elements = useElements();
  const createSetupIntent = useAction(api.stripeActions.createSetupIntent);
  const savePaymentMethod = useAction(api.stripeActions.savePaymentMethod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardError, setCardError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const initSetup = useCallback(async () => {
    try {
      const result = await createSetupIntent({ studentId });
      setClientSecret(result.clientSecret);
    } catch (err: any) {
      setError(err.message ?? "Failed to initialize card setup");
    }
  }, [createSetupIntent, studentId]);

  useEffect(() => {
    initSetup();
  }, [initSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setLoading(true);
    setError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
      clientSecret,
      { payment_method: { card: cardElement } },
    );

    if (stripeError) {
      setError(stripeError.message ?? "Card setup failed");
      setLoading(false);
      return;
    }

    if (setupIntent?.payment_method) {
      const pmId =
        typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method.id;
      try {
        await savePaymentMethod({ studentId, stripePaymentMethodId: pmId });
        // Overlay auto-dismisses — billingProfile will refetch and stripePaymentMethodId will be set
      } catch (err: any) {
        setError(err.message ?? "Failed to save payment method");
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex h-dvh items-center justify-center bg-slate-900/60 p-4 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        {/* Header */}
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Add your payment method
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          A card on file is required to continue. You'll only be charged for classes you attend.
        </p>

        {!clientSecret && !error && (
          <p className="mt-6 text-sm text-slate-400">Preparing secure card form...</p>
        )}

        {error && !clientSecret && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={initSetup}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        )}

        {clientSecret && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className={`rounded-xl border p-4 ${cardError ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#1e293b",
                      "::placeholder": { color: "#94a3b8" },
                    },
                    invalid: { color: "#dc2626" },
                  },
                }}
                onChange={(e) => {
                  setCardError(e.error?.message ?? "");
                  setCardComplete(e.complete);
                  if (error) setError("");
                }}
              />
            </div>

            {(cardError || error) && (
              <p className="text-sm text-red-600">{cardError || error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !stripe || !cardComplete}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving card..." : "Save card & continue"}
            </button>

            <p className="text-center text-xs text-slate-400">
              Your card details are securely handled by Stripe. We never store your card number.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
