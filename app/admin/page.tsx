"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamicImport from "next/dynamic";
const EmailComposer = dynamicImport(() => import("../../components/admin/EmailComposer"));
import { usePaginatedQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import type { Id } from "../../convex/_generated/dataModel";



const TutorsTab = dynamicImport(() => import("../../components/admin/TutorsTab").then(module => module.TutorsTab));
const StudentsTab = dynamicImport(() => import("../../components/admin/StudentsTab").then(module => module.StudentsTab));
const ClassesTab = dynamicImport(() => import("../../components/admin/ClassesTab").then(module => module.ClassesTab));
const SessionsTab = dynamicImport(() => import("../../components/admin/SessionsTab").then(module => module.SessionsTab));
const BillingTab = dynamicImport(() => import("../../components/admin/BillingTab").then(module => module.BillingTab));
const SubjectsTab = dynamicImport(() => import("../../components/admin/SubjectsTab").then(module => module.SubjectsTab));
const EnquiriesTab = dynamicImport(() => import("../../components/admin/EnquiriesTab").then(module => module.EnquiriesTab));
const HelpTab = dynamicImport(() => import("../../components/admin/HelpTab").then(module => module.HelpTab));
const AddTutorModal = dynamicImport(() => import("../../components/admin/TutorsTab").then(module => module.AddTutorModal));
const AddStudentModal = dynamicImport(() => import("../../components/admin/StudentsTab").then(module => module.AddStudentModal));
const AddClassModal = dynamicImport(() => import("../../components/admin/ClassesTab").then(module => module.AddClassModal));
import { LoadMore } from "../../components/admin/LoadMore";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { session, isLoading: authLoading, logout } = useAuth();
  // Gate on Convex auth too, so admin queries only fire once the Convex token
  // is attached (otherwise requireAdmin would reject the first requests).
  const { isAuthenticated: convexAuthed, isLoading: convexLoading } = useConvexAuth();

  useEffect(() => {
    if (
      !authLoading &&
      (!session || session.type !== "admin" || !session.roles.includes("admin"))
    ) {
      router.replace("/admin/login");
    }
  }, [session, authLoading, router]);

  if (!authLoading && session?.type === "admin" && !convexLoading && !convexAuthed) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <p role="alert">Unable to connect to the admin dashboard. Please sign in again.</p>
        <Link className="rounded-lg bg-slate-900 px-4 py-2 text-white" href="/admin/login">Sign in</Link>
      </main>
    );
  }

  if (
    authLoading ||
    !session ||
    session.type !== "admin" ||
    !session.roles.includes("admin") ||
    !convexAuthed
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
    "tutors" | "students" | "sessions" | "classes" | "subjects" | "billing" | "enquiries" | "email" | "help"
  >("tutors");
  const [showAddTutor, setShowAddTutor] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);

  const tutorPage = usePaginatedQuery(api.adminLists.tutors,
    (["tutors", "classes"].includes(activeTab) || showAddClass) ? { adminId } : "skip", { initialNumItems: 50 });
  const studentPage = usePaginatedQuery(api.adminLists.students,
    (activeTab === "students" || showAddStudent) ? { adminId } : "skip", { initialNumItems: 50 });
  const tutors = tutorPage.status === "LoadingFirstPage" ? undefined : tutorPage.results;
  const students = studentPage.status === "LoadingFirstPage" ? undefined : studentPage.results;

  const handleLogout = () => {
    onLogout();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-dvh bg-slate-50 tabular-nums [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-2 [&_:focus-visible]:outline-blue-600">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:block focus:p-3">Skip to admin content</a>
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label="Admin sections" className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide sm:gap-4" style={{ WebkitOverflowScrolling: "touch" }}>
            {(["tutors", "students", "classes", "subjects", "sessions", "billing", "enquiries", "email", "help"] as const).map((tab) => (
              <button
                key={tab}
                aria-current={activeTab === tab ? "page" : undefined}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-2 py-3 text-xs font-medium transition sm:px-3 sm:py-4 sm:text-sm ${
                  activeTab === tab
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main id="admin-content" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
          <BillingTab adminId={adminId} />
        )}
        {activeTab === "enquiries" && <EnquiriesTab adminId={adminId} />}
        {activeTab === "help" && <HelpTab />}
        {activeTab === "email" && <EmailComposer />}
        {activeTab === "subjects" && <SubjectsTab />}
        {activeTab === "tutors" && <LoadMore {...tutorPage} count={tutorPage.results.length} label="tutors" />}
        {activeTab === "students" && <LoadMore {...studentPage} count={studentPage.results.length} label="students" />}
      </main>

      {/* Modals */}
      {showAddTutor && <AddTutorModal adminId={adminId} onClose={() => setShowAddTutor(false)} />}
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
