# Admin billing retry safety

Prevent duplicate charges and inconsistent credit balances when requests overlap, time out, or stop between Stripe and the database.

## Implementation plan

1. Persist a billing operation before contacting Stripe. Give manual submissions a stable request ID, daily billing a profile/date key, and retries a key tied to the original charge. Freeze the amount, payment method, receipt address and description for each operation.
2. Reserve credit transactionally when preparing daily billing. Finalize the charge, credit debit and operation together in one Convex mutation. Failed operations release reservations; uncertain results retain reservations until reconciliation.
3. Use the operation ID as Stripe's idempotency key. Reconcile an existing PaymentIntent instead of creating another. Never resend an unknown create request after Stripe's minimum 24-hour retention window; surface it for review. Keep provider failures separate from database and notification failures.
4. Recover interrupted operations with scheduled reconciliation and verified payment webhooks. Show pending/uncertain operations in the admin interface and provide a safe check-status action. Retry failed charges through a dedicated endpoint, with server-side checks against duplicate retries and stale history.
5. Process daily profiles in bounded batches, with stable dates across continuation jobs. Preserve legacy charge history and prevent the new daily runner from charging dates already handled by the old runner.

## Acceptance checks

- Concurrent submissions and cron reruns result in one provider charge and one local charge.
- A successful provider payment followed by a local failure recovers without charging again.
- Duplicate webhook/finalization calls debit credit once.
- Overlapping operations cannot reserve the same credit.
- Declines release reserved credit; timeouts do not turn into confirmed failures.
- Retrying old failures cannot charge an already settled obligation again.
- Tests use a mocked Stripe SDK and no external notifications.

## Deployment

Deploy additive schema and Convex functions with the matching frontend. Existing records remain valid. Unknown legacy outcomes require Stripe reconciliation rather than an automatic new charge. No live deployment or payments are part of this implementation task.

References: [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests), [Convex action transaction boundaries](https://docs.convex.dev/functions/actions).

## Implementation completed — 25 October 2026

- Added durable operations, immutable payment snapshots, transactional credit reservations and settlement in `convex/billingOperations.ts`.
- Manual submissions retain their request across retries/reloads in the same browser session. Dedicated failed-charge retries are tied to the original record; repeat clicks return the existing retry.
- Stripe requests reuse the operation key. Scheduled recovery and signed webhooks reconcile outcomes; unknown results never become a new charge after the recovery window expires.
- The admin panel exposes pending/uncertain operations and can verify an existing Stripe payment reference against its operation, amount, currency and customer.
- Daily billing processes 25 profiles per continuation. Financial records and credit debits commit together; notification delivery is scheduled separately.
- The payment suite covers concurrency, lost responses, interrupted work, stale keys, duplicate/stale settlement, credit reservations, cancellation failure, legacy failures, signed/forged webhooks and mismatched references. All payment tests use a mocked provider; no live payments or messages were sent.

### Rollout notes

Deploy the matching Convex schema/functions and frontend together. Keep the existing Stripe signing secret and configure the existing `/stripe/webhook` endpoint to receive billing PaymentIntent events as well as its course checkout events. A new production deployment and Stripe endpoint configuration were not performed.

Legacy failed charges still need their Stripe history checked before a deliberate new payment. For unresolved new operations whose automatic recovery window has expired, use a matching PaymentIntent reference in the status panel. The system does not assume an unknown payment failed.

## Daily approval workflow

Implemented as a follow-up to the initial deployment:

- At 6pm Adelaide time, prepare a per-student lesson summary from scheduled, billable enrolments. Admins may also prepare or refresh today's summary manually. Paused/off-cycle enrolments are excluded; tutor session logs remain separate from customer billing.
- In Billing → Daily review, confirm completed lessons, adjust charges with a reason, or hold cancelled lessons. Approval records the verified administrator, time, payment type and exact review revision.
- At 7pm Adelaide time, group approved lessons per student and reserve credit transactionally before handing payments to the existing durable Stripe processor. The cron uses Adelaide's timezone and handles daylight saving.
- Only approvals saved before the cutoff qualify for the automatic run. Late approvals and lessons finishing at or after 7pm require the explicit Charge approved action. Nothing unapproved is charged.
- Editing a review clears approval. Changed rates, enrolment/pause state, payment type or revoked admin access prevent automatic submission. Repeated dispatches and repeated charge actions cannot charge the same reviewed lesson twice.
- Daily summary preparation and payment dispatch are bounded batches. Current-day refreshes preserve unchanged decisions and never rewrite submitted payments.
- The old morning cron is removed. Compatibility entry points for previously queued morning jobs are no-ops. Existing payment operations continue their original recovery flow; dates already handled by legacy billing are blocked from review-based re-billing.

### Rollout

Deploy the matching Convex functions/schema and frontend together. The new cron replaces the old morning charge job. There is no approval backfill: newly generated reviews start unapproved. Existing payment/credit history remains unchanged.

### Verification of daily review

95 tests pass across the full suite, including approval permissions, daylight saving, 7pm gating, concurrent dispatches, late approvals, stale review versions, cash billing, retry reconciliation, historical duplicate protection and multi-page summary generation. ESLint (zero warnings), TypeScript, Convex code generation/typechecking, the Node 24 production build and interview SEO verification pass. Interactive browser testing was unavailable. No live charges or notifications were sent during verification.

### Discord daily summary

- When the complete daily review is ready at or after 6pm Adelaide time, queue one summary to the existing server-side `DISCORD_WEBHOOK_URL`. Preparing a review earlier does not send early; refreshing it does not send another message.
- Include whole-day lesson counts, review statuses, totals before credit, up to 15 lesson lines, the 7pm approval deadline, and a link to Admin → Billing → Daily review. Large days point to the full list in admin. Empty days send a no-lessons summary. The message describes scheduled lessons and does not claim attendance is confirmed.
- Persist delivery state on the review day and show it in admin. Concurrent deliveries claim the day transactionally. Discord confirmation uses `wait=true` and records the message ID; explicit rate limits retry up to three attempts while respecting the retry delay. Network failures, server errors, and interrupted sends remain unconfirmed rather than blindly reposting. Missing configuration and rejected requests are visible failures. Check Discord before manually resending an unconfirmed message.
- Disable mentions and bound/sanitize lesson names. The webhook secret never appears in messages or saved errors. Notification delivery never approves lessons or invokes the payment processor.
- Deploy this addition with the daily approval workflow, retaining the existing webhook environment variable. No live test messages were sent during verification.

The full suite now passes 105 tests, including notification timing, duplicate prevention, preparation/refresh races, large summaries, rate-limit retries, missing configuration and interrupted/ambiguous delivery. TypeScript, ESLint with zero warnings, Convex code generation/typechecking, and the Node 24 production build also pass.
