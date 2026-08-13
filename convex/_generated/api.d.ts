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
import type * as billing from "../billing.js";
import type * as classes from "../classes.js";
import type * as courseCheckout from "../courseCheckout.js";
import type * as courseEnrollments from "../courseEnrollments.js";
import type * as courseWebhook from "../courseWebhook.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as discord from "../discord.js";
import type * as enquiries from "../enquiries.js";
import type * as enquiryNotifications from "../enquiryNotifications.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as migrations from "../migrations.js";
import type * as passwords from "../passwords.js";
import type * as rateLimit from "../rateLimit.js";
import type * as seed from "../seed.js";
import type * as seedAdmin from "../seedAdmin.js";
import type * as serverOnly from "../serverOnly.js";
import type * as stripeActions from "../stripeActions.js";
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
  billing: typeof billing;
  classes: typeof classes;
  courseCheckout: typeof courseCheckout;
  courseEnrollments: typeof courseEnrollments;
  courseWebhook: typeof courseWebhook;
  crons: typeof crons;
  dashboard: typeof dashboard;
  discord: typeof discord;
  enquiries: typeof enquiries;
  enquiryNotifications: typeof enquiryNotifications;
  http: typeof http;
  identity: typeof identity;
  migrations: typeof migrations;
  passwords: typeof passwords;
  rateLimit: typeof rateLimit;
  seed: typeof seed;
  seedAdmin: typeof seedAdmin;
  serverOnly: typeof serverOnly;
  stripeActions: typeof stripeActions;
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
