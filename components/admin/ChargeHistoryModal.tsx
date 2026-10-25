"use client";

import { useState } from "react";
import { usePaginatedQuery } from "convex/react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { LoadMore } from "./LoadMore";
import AdminDialog from "./AdminDialog";

export function ChargeHistoryModal({
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
  const chargePage = usePaginatedQuery(api.adminLists.chargeHistory, { adminId, studentId }, { initialNumItems: 50 });
  const charges = chargePage.results;
  const creditPage = usePaginatedQuery(api.adminLists.creditHistory, { adminId, studentId }, { initialNumItems: 50 });
  const credits = creditPage.results;
  const retryCharge = useAction(api.stripeActions.retryCharge);
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

  const handleRetry = async (chargeId: string) => {
    setRetrying(chargeId);
    setRetryResult(null);
    try {
      const result = await retryCharge({
        chargeId: chargeId as Id<"billingCharges">,
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
    .reduce((sum, c) => sum + (c.paidCents ?? c.amountCents), 0) ?? 0;

  return (
    <AdminDialog onClose={onClose} label={`Charge history for ${studentName}`} width="max-w-xl">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Charge History — {studentName}
            </h2>
            {charges && charges.length > 0 && (
              <div className="mt-1 flex gap-4 text-xs text-slate-500">
                <span>{charges.length} loaded charges</span>
                <span className="text-green-600">
                  {formatCurrency(totalCharged)} recorded in loaded history
                </span>
                {failedCount > 0 && (
                  <span className="text-red-500">{failedCount} failed</span>
                )}
              </div>
            )}
          </div>
          <button
            aria-label="Close charge history"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {charges.some(charge => charge.status === "succeeded" && charge.paidCents === undefined) && <p className="mt-2 text-xs text-slate-500">Legacy totals may include credit; separate card amounts were not recorded.</p>}
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
                          {!!charge.creditAppliedCents && <span className="block text-xs text-slate-500">{formatCurrency(charge.paidCents ?? 0)} payment · {formatCurrency(charge.creditAppliedCents)} credit</span>}
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
                          onClick={() => handleRetry(charge._id)}
                          disabled={retrying === charge._id}
                          className="ml-auto rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          {retrying === charge._id ? "Checking…" : charge.retryOperationId ? "Check retry" : "Retry Charge"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">{chargePage.status === "LoadingFirstPage" ? "Loading charges…" : "No charges in loaded history."}</p>
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
              <p className="py-8 text-center text-sm text-slate-500">{creditPage.status === "LoadingFirstPage" ? "Loading credits…" : "No credits in loaded history."}</p>
            )}
          </div>
        )}

        <LoadMore status={viewTab === "charges" ? chargePage.status : creditPage.status} loadMore={viewTab === "charges" ? chargePage.loadMore : creditPage.loadMore} count={viewTab === "charges" ? charges.length : credits.length} label={viewTab} />
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
    </AdminDialog>
  );
}
