"use client";

import type { PaginationStatus } from "convex/react";

export function LoadMore({ status, loadMore, count, label, pageSize = 50 }: {
  status: PaginationStatus; loadMore: (count: number) => void; count: number; label: string; pageSize?: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm text-slate-600">
      <p role="status">{status === "LoadingFirstPage" ? `Loading ${label}…` : `${count} ${label} loaded${status === "Exhausted" ? " · All loaded" : " · Filters apply to loaded records"}`}</p>
      {status !== "Exhausted" && (
        <button type="button" disabled={status !== "CanLoadMore"} onClick={() => loadMore(pageSize)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50">
          {status === "CanLoadMore" ? `Load more ${label}` : "Loading…"}
        </button>
      )}
    </div>
  );
}
