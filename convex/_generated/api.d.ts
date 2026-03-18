/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as clients from "../clients.js";
import type * as expenses from "../expenses.js";
import type * as invoices from "../invoices.js";
import type * as itemPresets from "../itemPresets.js";
import type * as memberships from "../memberships.js";
import type * as onboarding from "../onboarding.js";
import type * as organizations from "../organizations.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  clients: typeof clients;
  expenses: typeof expenses;
  invoices: typeof invoices;
  itemPresets: typeof itemPresets;
  memberships: typeof memberships;
  onboarding: typeof onboarding;
  organizations: typeof organizations;
  users: typeof users;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
