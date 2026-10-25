# Admin maintainability and query scaling

Split the dashboard into independently maintained sections and make large datasets load incrementally without silently truncating records or presenting partial totals as complete.

## Implementation plan

1. Extract tutor, student, class, session, subject, enquiry, help and billing sections into focused components. Extract dialogs and shared formatting/types where they are reused. Keep the route responsible for authentication and section navigation; load sections on demand.
2. Add cursor-paginated administrative queries for growing record lists, with visible loading and load-more controls. Apply filters on the server where supported and explicitly identify loaded-result filtering where a relational filter cannot use an index.
3. Use the session date index for date-range queries. Keep earnings summaries separate from paginated rows so displayed totals cover the selected range. Make account selectors incrementally load available choices.
4. Replace full-history revenue scans with transactional daily/lifetime aggregates and an idempotent, resumable historical backfill. Display an explicit preparation state until totals are complete.
5. Restrict expensive billing subscriptions to their visible subtab. Paginate billing profiles, upcoming-charge profile batches, pause requests and charge history; preserve access to older records.

## Acceptance checks

- No admin route-sized monolithic component remains.
- Pagination reaches older records without duplicates, and missing/loading data is distinguished from an empty list.
- Earnings and revenue totals remain complete and agree with the ledger.
- Backfill can be rerun and can overlap new charges without double-counting.
- Existing permissions, forms and section behavior remain intact.
- TypeScript, lint, regression tests and production build pass.

Reference: [Convex paginated queries](https://docs.convex.dev/database/pagination).

## Implementation completed — 25 October 2026

- Reduced `app/admin/page.tsx` from roughly 5,600 lines to roughly 230, with dynamically loaded section components and extracted billing dialogs in `components/admin/`.
- Added authenticated cursor pagination for students, tutors, enquiries, sessions, profiles, histories, pause requests and upcoming-profile batches in `convex/adminLists.ts`.
- Selectors have load-more controls, including pages with no eligible students. Local filters and selection apply to explicitly labeled loaded records. Session earnings remain a separate total for the entire selected date range.
- Added indexed enquiry type/date ordering and session date-range reads. Forecast/history/pause queries subscribe when their subtab is selected; the limited profile page also supplies billing summary cards and bulk dialogs.
- Added transactionally maintained daily/lifetime revenue, with a resumable 100-record backfill and contribution deduplication in `convex/billingRevenue.ts`. Opening Billing starts the backfill, and the UI shows preparation until it finishes. Charts label loaded history separately from the lifetime total.
- Pagination tests traverse multiple pages, test empty selector pages, permissions, indexed filters, and revenue backfill overlapping new writes without duplicate contributions.

### Historical revenue meaning

Older successful charges stored the gross lesson amount without reliably linking applied credit. Their exact card payment cannot be reconstructed from those records alone. Aggregates preserve those recorded values and flag the number of legacy entries; the UI calls them **recorded revenue**, not verified cash receipts. New operations store gross amount, credit applied and actual payment separately. Cash billing is excluded from recorded card revenue, preserving the previous metric. Auditing historical card receipts requires reconciliation with Stripe.

### Verification boundary

TypeScript and the production build verify component integration. No browser surface was available in this environment, so authenticated visual, keyboard and mobile interaction checks have not been performed.
