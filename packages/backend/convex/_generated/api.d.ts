/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_email from "../actions/email.js";
import type * as actions_emailTemplate from "../actions/emailTemplate.js";
import type * as actions_pdf from "../actions/pdf.js";
import type * as actions_pdfTemplate from "../actions/pdfTemplate.js";
import type * as actions_stripe from "../actions/stripe.js";
import type * as clients from "../clients.js";
import type * as expenses from "../expenses.js";
import type * as internal_ from "../internal.js";
import type * as invoices from "../invoices.js";
import type * as itemPresets from "../itemPresets.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_validators from "../lib/validators.js";
import type * as memberships from "../memberships.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as payments from "../payments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/email": typeof actions_email;
  "actions/emailTemplate": typeof actions_emailTemplate;
  "actions/pdf": typeof actions_pdf;
  "actions/pdfTemplate": typeof actions_pdfTemplate;
  "actions/stripe": typeof actions_stripe;
  clients: typeof clients;
  expenses: typeof expenses;
  internal: typeof internal_;
  invoices: typeof invoices;
  itemPresets: typeof itemPresets;
  "lib/auth": typeof lib_auth;
  "lib/validators": typeof lib_validators;
  memberships: typeof memberships;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  payments: typeof payments;
  users: typeof users;
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
