import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily at 23:30 UTC = 9:00 AM ACST (Adelaide standard time)
crons.cron(
  "daily billing charge",
  "30 23 * * *",
  internal.stripeActions.chargeAllActive,
  {},
);

export default crons;
