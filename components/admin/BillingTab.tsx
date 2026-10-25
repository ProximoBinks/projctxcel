"use client";

import { useState, useEffect } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { useMutation } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { adminError } from "./adminError";
import { LoadMore } from "./LoadMore";
import { UnresolvedCharges } from "./UnresolvedCharges";
import { DailyBillingReview } from "./DailyBillingReview";
import { RevenueChart } from "./RevenueChart";
import { BulkPauseModal } from "./BulkPauseModal";
import { BulkUnpauseModal } from "./BulkUnpauseModal";
import { SetupBillingModal } from "./SetupBillingModal";
import { ChargeHistoryModal } from "./ChargeHistoryModal";
import { ManualChargeModal } from "./ManualChargeModal";
import { AddCreditModal } from "./AddCreditModal";

export function BillingTab({
  adminId,
}: {
  adminId: Id<"tutorAccounts">;
}) {
  const [actionError, setActionError] = useState("");
  const [billingSubTab, setBillingSubTab] = useState<"review" | "profiles" | "upcoming" | "history" | "pauses">("review");
  const [showSetup, setShowSetup] = useState(false);
  const [historyRetrying, setHistoryRetrying] = useState<string | null>(null);
  const [historyRetryResult, setHistoryRetryResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | "succeeded" | "failed" | "cash" | "credit_applied">("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | "auto" | "manual">("all");
  const [historyVisibility, setHistoryVisibility] = useState<"visible" | "hidden">("visible");
  const [hideMode, setHideMode] = useState(false);
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
  const [showBulkPause, setShowBulkPause] = useState(false);
  const [showBulkUnpause, setShowBulkUnpause] = useState(false);

  const profilePage = usePaginatedQuery(api.adminLists.billingProfiles, { adminId }, { initialNumItems: 25 });
  const pausePage = usePaginatedQuery(api.adminLists.pauseRequests, billingSubTab === "pauses" ? { adminId } : "skip", { initialNumItems: 50 });
  const upcomingPage = usePaginatedQuery(api.adminLists.upcomingCharges, billingSubTab === "upcoming" ? { adminId } : "skip", { initialNumItems: 10 });
  const historyPage = usePaginatedQuery(api.adminLists.chargeHistory, billingSubTab === "history" ? { adminId } : "skip", { initialNumItems: 50 });
  const eligiblePage = usePaginatedQuery(api.adminLists.studentsWithoutBilling, showSetup ? { adminId } : "skip", { initialNumItems: 50 });
  const chartPage = usePaginatedQuery(api.billingRevenue.chart, billingSubTab === "review" ? "skip" : {}, { initialNumItems: 50 });
  const billingProfiles = profilePage.status === "LoadingFirstPage" ? undefined : profilePage.results;
  const pauseRequests = pausePage.status === "LoadingFirstPage" ? undefined : pausePage.results;
  const upcomingCharges = upcomingPage.status === "LoadingFirstPage" ? undefined : upcomingPage.results.flatMap(p => p.charges).sort((a,b) => a.date.localeCompare(b.date));
  const allChargeHistory = historyPage.status === "LoadingFirstPage" ? undefined : historyPage.results;
  const revenueStats = useQuery(api.billingRevenue.stats, billingSubTab === "review" ? "skip" : {});
  const ensureRevenue = useMutation(api.billingRevenue.ensure);
  useEffect(() => { if (billingSubTab === "review") return; void ensureRevenue().catch(error => setActionError(adminError(error, "Unable to prepare revenue totals."))); }, [ensureRevenue, billingSubTab]);
  const createBillingProfile = useMutation(api.billing.createBillingProfile);
  const reviewPause = useMutation(api.billing.reviewPauseRequest);
  const adminUnpause = useMutation(api.billing.adminUnpause);
  const addCredit = useMutation(api.billing.addCredit);
  const updatePaymentType = useMutation(api.billing.updatePaymentType);
  const deleteBillingProfile = useMutation(api.billing.deleteBillingProfile);
  const updateBillingStatus = useMutation(api.billing.updateBillingStatus);
  const retryChargeAction = useAction(api.stripeActions.retryCharge);
  const toggleChargeHidden = useMutation(api.billing.toggleChargeHidden);
  const adminBulkPause = useMutation(api.billing.adminBulkPause);
  const adminBulkUnpause = useMutation(api.billing.adminBulkUnpause);

  const handleDeleteProfile = async (billingProfileId: Id<"billingProfiles">, studentName: string) => {
    if (!confirm(`Delete billing profile for ${studentName}? Profiles with charge history must be paused instead.`)) return;
    setActionError("");
    try {
      const success = await deleteBillingProfile({ adminId, billingProfileId });
      if (!success) setActionError("Billing profile no longer exists.");
    } catch (error) { setActionError(adminError(error, "Unable to delete billing profile.")); }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const studentsWithoutBilling = eligiblePage.results;

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
      {actionError && <p role="alert" className="text-sm text-red-600">{actionError}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Billing</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowSetup(true)}
            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed sm:px-4 sm:text-sm"
          >
            + Set Up Billing
          </button>
          <button
            onClick={() => setShowBulkPause(true)}
            disabled={!billingProfiles}
            className="rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed sm:px-4 sm:text-sm"
          >
            Pause Billing
          </button>
          <button
            onClick={() => setShowBulkUnpause(true)}
            disabled={!billingProfiles}
            className="rounded-xl border border-green-300 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed sm:px-4 sm:text-sm"
          >
            Unpause
          </button>
        </div>
      </div>

      {billingSubTab !== "review" && <>
      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Loaded Active Profiles</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{billingProfiles ? totalActive : "—"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Loaded Pending Pauses</p>
          <p className={`mt-1 text-2xl font-semibold ${pendingPauses > 0 ? "text-yellow-600" : "text-slate-900"}`}>
            {billingSubTab === "pauses" && pauseRequests ? pendingPauses : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Weekly Estimate (Loaded)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {billingProfiles ? formatCurrency(totalWeeklyRevenue) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">Recorded Revenue This Month</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">
            {revenueStats?.ready ? formatCurrency(revenueStats.thisMonthCents) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-green-600">
            {revenueStats?.ready ? `${revenueStats.chargeCount} total charges` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm text-green-700">All-Time Recorded Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-green-800">
            {revenueStats?.ready ? formatCurrency(revenueStats.allTimeCents) : "—"}
          </p>
          <p className="mt-0.5 text-xs text-green-600">
            {revenueStats?.ready ? `This week: ${formatCurrency(revenueStats.thisWeekCents)}` : ""}
          </p>
        </div>
      </div>

      {!!revenueStats?.legacyChargeCount && <p className="text-sm text-slate-600">
        {revenueStats.legacyChargeCount} legacy charges use their recorded totals, which may include credit.
        New charges record the actual card payment separately.
      </p>}
      {/* Revenue chart */}
      {revenueStats?.ready ? <RevenueChart data={chartPage.results} /> : <p role="status">Preparing revenue totals…</p>}
      <LoadMore status={chartPage.status} loadMore={chartPage.loadMore} count={chartPage.results.length} label="revenue days" />
      <UnresolvedCharges adminId={adminId} />

      </>}
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        <button onClick={() => setBillingSubTab("review")} className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${billingSubTab === "review" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"}`}>Daily review</button>
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
          Payment Schedule
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
              {billingSubTab === "pauses" && pauseRequests ? pendingPauses : "—"}
            </span>
          )}
        </button>
      </div>

      {billingSubTab === "review" && <><DailyBillingReview /><UnresolvedCharges adminId={adminId} /></>}

      {billingSubTab === "profiles" && (
        <>
          {/* Desktop table */}
          <div className="hidden rounded-2xl border border-slate-200 bg-white lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-sm text-slate-500">
                    <th className="px-6 py-3 font-medium">Student</th>
                    <th className="px-6 py-3 font-medium">Payment Type</th>
                    <th className="px-6 py-3 font-medium">Per week (avg)</th>
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
                          {profile.cadenceIntervalWeeks && (
                            <span className="ml-1.5 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              {profile.cadenceIntervalWeeks === 2 ? "Fortnightly" : `Every ${profile.cadenceIntervalWeeks} wks`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${profile.creditBalanceCents > 0 ? "text-blue-700" : "text-slate-400"}`}>
                            {formatCurrency(profile.creditBalanceCents)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
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
                              {profile.status === "active" && (
                                <button
                                  onClick={async () => {
                                    const reason = window.prompt(
                                      `Pause auto-charging for ${profile.studentName}? They will NOT be auto-charged until unpaused (you can still use "Charge" manually). Optional note:`,
                                      "",
                                    );
                                    if (reason === null) return;
                                    await updateBillingStatus({
                                      adminId,
                                      billingProfileId: profile._id,
                                      status: "paused",
                                      pauseReason: reason || undefined,
                                    });
                                  }}
                                  className="text-xs text-yellow-600 hover:text-yellow-700"
                                >
                                  Pause
                                </button>
                              )}
                            </div>
                            {profile.status === "paused" && profile.pauseReason && (
                              <p className="text-xs text-yellow-600 max-w-[200px] truncate" title={profile.pauseReason}>
                                {profile.pauseReason}
                              </p>
                            )}
                            {profile.status === "paused" && profile.pausedAt && (
                              <p className="text-xs text-slate-400">
                                Since {new Date(profile.pausedAt).toLocaleDateString()}
                              </p>
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
                              onClick={() => void handleDeleteProfile(profile._id, profile.studentName)}
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
                        {billingProfiles ? "No billing profiles in loaded results" : "Loading billing profiles…"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="space-y-3 lg:hidden">
            {billingProfiles && billingProfiles.length > 0 ? (
              billingProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className={`rounded-2xl border p-4 ${
                    profile.status === "paused"
                      ? "border-yellow-200 bg-yellow-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{profile.studentName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            profile.paymentType === "card"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {profile.paymentType === "card"
                            ? profile.cardLast4
                              ? `•••• ${profile.cardLast4}`
                              : "No card"
                            : "Cash"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            profile.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {profile.status === "active" ? "Active" : "Paused"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(profile.weeklyRateCents)}/wk
                      </p>
                      {profile.cadenceIntervalWeeks && (
                        <p className="text-xs font-medium text-purple-700">
                          {profile.cadenceIntervalWeeks === 2 ? "Fortnightly" : `Every ${profile.cadenceIntervalWeeks} wks`}
                        </p>
                      )}
                      {profile.creditBalanceCents > 0 && (
                        <p className="text-xs font-medium text-blue-700">
                          {formatCurrency(profile.creditBalanceCents)} credit
                        </p>
                      )}
                    </div>
                  </div>

                  {profile.status === "paused" && (
                    <div className="mt-2 space-y-0.5">
                      {profile.pauseReason && (
                        <p className="text-xs text-yellow-700">{profile.pauseReason}</p>
                      )}
                      {profile.pausedAt && (
                        <p className="text-xs text-slate-400">
                          Since {new Date(profile.pausedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
                    {profile.status !== "active" && (
                      <button
                        onClick={() =>
                          updateBillingStatus({
                            adminId,
                            billingProfileId: profile._id,
                            status: "active",
                          })
                        }
                        className="text-xs font-medium text-blue-600"
                      >
                        Unpause
                      </button>
                    )}
                    {profile.status === "active" && (
                      <button
                        onClick={async () => {
                          const reason = window.prompt(
                            `Pause auto-charging for ${profile.studentName}? They will NOT be auto-charged until unpaused (you can still use "Charge" manually). Optional note:`,
                            "",
                          );
                          if (reason === null) return;
                          await updateBillingStatus({
                            adminId,
                            billingProfileId: profile._id,
                            status: "paused",
                            pauseReason: reason || undefined,
                          });
                        }}
                        className="text-xs font-medium text-yellow-600"
                      >
                        Pause
                      </button>
                    )}
                    {profile.paymentType === "card" && profile.cardLast4 && (
                      <button
                        onClick={() => setChargingStudent({ studentId: profile.studentId, studentName: profile.studentName })}
                        className="text-xs font-medium text-purple-600"
                      >
                        Charge
                      </button>
                    )}
                    <button
                      onClick={() => setAddingCredit({ studentId: profile.studentId, studentName: profile.studentName })}
                      className="text-xs font-medium text-green-600"
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
                      className="text-xs font-medium text-blue-600"
                    >
                      History
                    </button>
                    <button
                      onClick={() =>
                        updatePaymentType({
                          adminId,
                          studentId: profile.studentId,
                          paymentType: profile.paymentType === "card" ? "cash" : "card",
                        })
                      }
                      className="text-xs text-slate-500"
                    >
                      Switch to {profile.paymentType === "card" ? "cash" : "card"}
                    </button>
                    <button
                      onClick={() => void handleDeleteProfile(profile._id, profile.studentName)}
                      className="text-xs text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-slate-500">
                {billingProfiles ? "No billing profiles in loaded results" : "Loading billing profiles…"}
              </div>
            )}
          </div>
        </>
      )}

      {billingSubTab === "upcoming" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Forecast for loaded billing profiles over the next 4 weeks. Card
            charges run at 7pm Adelaide time only after daily review approval; cash
            is collected manually. Forecast amounts are net of available credit and are not approval to charge.
          </p>
          {upcomingCharges && upcomingCharges.length > 0 ? (
            (() => {
              type UC = (typeof upcomingCharges)[number];
              const groups: Record<string, UC[]> = {};
              for (const c of upcomingCharges) {
                (groups[c.date] ??= []).push(c);
              }
              return Object.keys(groups)
                .sort()
                .map((date) => {
                  const rows = groups[date];
                  const dateTotalNet = rows.reduce((s, r) => s + r.netChargeCents, 0);
                  return (
                    <div key={date} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {rows[0].dayOfWeek}, {date}
                          </span>
                          {rows[0].isToday && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Today
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {formatCurrency(dateTotalNet)}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {rows.map((r, i) => (
                          <div
                            key={`${r.studentId}-${i}`}
                            className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900">{r.studentName}</div>
                              <div className="truncate text-xs text-slate-500">
                                {r.classesSummary || "—"}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {r.creditAppliedCents > 0 && (
                                <span className="text-xs text-blue-600">
                                  −{formatCurrency(r.creditAppliedCents)} credit
                                </span>
                              )}
                              <span className="font-medium text-slate-900">
                                {formatCurrency(r.netChargeCents)}
                              </span>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  r.paymentType === "card"
                                    ? r.hasCard
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {r.paymentType === "card"
                                  ? r.hasCard
                                    ? "Stripe"
                                    : "No card!"
                                  : "Cash"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
            })()
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-slate-500">
              {upcomingCharges ? "No upcoming charges for loaded profiles in the next 4 weeks" : "Loading upcoming charges…"}
            </div>
          )}
          {upcomingCharges && upcomingCharges.length > 0 && (
            <div className="rounded-xl bg-slate-900 px-5 py-3 text-right text-sm font-medium text-white">
              Total to be charged (next 4 weeks):{" "}
              {formatCurrency(upcomingCharges.reduce((s, c) => s + c.netChargeCents, 0))}
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Show:</span>
              {(["visible", "hidden"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryVisibility(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    historyVisibility === f
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "visible" ? "Visible" : "Hidden"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHideMode((prev) => !prev)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                hideMode
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {hideMode ? "Done Hiding" : "Manage Hidden"}
            </button>
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
                        const isHidden = c.hidden === true;
                        if (historyVisibility === "visible" && isHidden) return false;
                        if (historyVisibility === "hidden" && !isHidden) return false;
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
                            {!!charge.creditAppliedCents && <span className="block text-xs text-slate-500">{formatCurrency(charge.paidCents ?? 0)} payment · {formatCurrency(charge.creditAppliedCents)} credit</span>}
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
                                        chargeId: charge._id,
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
                                  {historyRetrying === charge._id ? "Checking…" : charge.retryOperationId ? "Check retry" : "Retry"}
                                </button>
                              </div>
                            )}
                            {charge.stripePaymentIntentId && charge.status === "succeeded" && !hideMode && (
                              <span className="font-mono text-xs text-slate-400">
                                {charge.stripePaymentIntentId.slice(0, 14)}...
                              </span>
                            )}
                            {hideMode && (
                              <button
                                onClick={() => toggleChargeHidden({ adminId, chargeId: charge._id, hidden: !charge.hidden })}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                  charge.hidden
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600"
                                }`}
                              >
                                {charge.hidden ? "Unhide" : "Hide"}
                              </button>
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
                      const isHidden = c.hidden === true;
                      if (historyVisibility === "visible" && isHidden) return false;
                      if (historyVisibility === "hidden" && !isHidden) return false;
                      if (historyStatusFilter !== "all" && c.status !== historyStatusFilter) return false;
                      if (historyTypeFilter === "auto" && !isAuto(c.description)) return false;
                      if (historyTypeFilter === "manual" && isAuto(c.description)) return false;
                      return true;
                    }).length;
                    const hasFilter = historyStatusFilter !== "all" || historyTypeFilter !== "all" || historyVisibility !== "visible";
                    return hasFilter
                      ? `${count} of ${allChargeHistory.length} loaded charges`
                      : `${allChargeHistory.length} loaded charges`;
                  })()}
                </span>
                <span className="font-medium text-green-700">
                  Recorded payments in loaded history: {formatCurrency(
                    allChargeHistory
                      .filter((c) => c.status === "succeeded")
                      .reduce((sum, c) => sum + (c.paidCents ?? c.amountCents), 0),
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
                      {pauseRequests ? "No pause requests in loaded results" : "Loading pause requests…"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {billingSubTab === "profiles" && <LoadMore status={profilePage.status} loadMore={profilePage.loadMore} count={profilePage.results.length} label="profiles" pageSize={25} />}
      {billingSubTab === "pauses" && <LoadMore status={pausePage.status} loadMore={pausePage.loadMore} count={pausePage.results.length} label="pause requests" />}
      {billingSubTab === "history" && <LoadMore status={historyPage.status} loadMore={historyPage.loadMore} count={historyPage.results.length} label="charges" />}
      {billingSubTab === "upcoming" && <LoadMore status={upcomingPage.status} loadMore={upcomingPage.loadMore} count={upcomingPage.results.length} label="profiles in forecast" pageSize={10} />}
      {/* Setup modal */}
      {showSetup && (
        <SetupBillingModal
          pagination={<LoadMore status={eligiblePage.status} loadMore={eligiblePage.loadMore} count={eligiblePage.results.length} label="eligible students" />}
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

      {/* Bulk pause modal */}
      {showBulkPause && billingProfiles && (
        <BulkPauseModal
          pagination={<LoadMore status={profilePage.status} loadMore={profilePage.loadMore} count={profilePage.results.length} label="profiles" pageSize={25} />}
          profiles={billingProfiles.filter((p) => p.status === "active")}
          onSubmit={async (ids, reason) => {
            await adminBulkPause({ adminId, billingProfileIds: ids, pauseReason: reason || undefined });
            setShowBulkPause(false);
          }}
          onClose={() => setShowBulkPause(false)}
        />
      )}

      {/* Bulk unpause modal */}
      {showBulkUnpause && billingProfiles && (
        <BulkUnpauseModal
          pagination={<LoadMore status={profilePage.status} loadMore={profilePage.loadMore} count={profilePage.results.length} label="profiles" pageSize={25} />}
          profiles={billingProfiles.filter((p) => p.status === "paused")}
          onSubmit={async (ids) => {
            await adminBulkUnpause({ adminId, billingProfileIds: ids });
            setShowBulkUnpause(false);
          }}
          onClose={() => setShowBulkUnpause(false)}
        />
      )}
    </div>
  );
}
