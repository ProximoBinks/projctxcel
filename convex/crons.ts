import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Use Adelaide's local clock inside the mutation so daylight saving is handled.
// The five-minute tick prepares the review from 6pm and dispatches from 7pm.
crons.cron(
  "daily billing review and approved charges",
  "*/5 * * * *",
  internal.billingReview.tick,
  {},
);

// Purge stale rate-limit counters once a day.
crons.cron(
  "cleanup rate limits",
  "0 1 * * *",
  internal.rateLimit.cleanupRateLimits,
  {},
);

export default crons;
