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
