/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as authActions from "../authActions.js";
import type * as classes from "../classes.js";
import type * as dashboard from "../dashboard.js";
import type * as enquiries from "../enquiries.js";
import type * as enquiryNotifications from "../enquiryNotifications.js";
import type * as seed from "../seed.js";
import type * as seedAdmin from "../seedAdmin.js";
import type * as studentDashboard from "../studentDashboard.js";
import type * as subjects from "../subjects.js";
import type * as testimonials from "../testimonials.js";
import type * as tutors from "../tutors.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  authActions: typeof authActions;
  classes: typeof classes;
  dashboard: typeof dashboard;
  enquiries: typeof enquiries;
  enquiryNotifications: typeof enquiryNotifications;
  seed: typeof seed;
  seedAdmin: typeof seedAdmin;
  studentDashboard: typeof studentDashboard;
  subjects: typeof subjects;
  testimonials: typeof testimonials;
  tutors: typeof tutors;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
