# Mobile Authentication and Authorization Plan (TASKS.md sections 3.1, 3.4)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A User must sign in (email + password, Google, or Apple) before reaching any `(tabs)` screen in the mobile app. On first sign-in the internal User record is created via Bootstrap. Convex functions verify the Clerk session so existing `requireAuth` / `requireOrgMember` guards actually work. The User can sign out from the More tab.

**Architecture:** expo-router route groups: `(auth)` for sign-in/sign-up, `(tabs)` for the app. The root layout stays provider-only; a new `(app)`-level gate in `_layout.tsx` uses Clerk's `isLoaded` / `isSignedIn` plus a `useQuery(api.users.currentUser)` check to redirect. Bootstrap runs once in a small hook when Clerk is signed in and `currentUser` returns `null`. Backend change is limited to adding `auth.config.ts` so Convex accepts Clerk JWTs.

**Tech Stack:** `@clerk/clerk-expo` (already installed), `expo-web-browser` + `expo-auth-session` (already installed, needed for OAuth), Convex `auth.config.ts`, existing `FormField` / `FormButton` / `ThemedView` / `ScreenHeader` components.

---

## Current state (verified)

| Piece | Status |
|-------|--------|
| `ClerkProvider` + SecureStore token cache in `apps/mobile/src/app/_layout.tsx` | Done |
| `ConvexProviderWithClerk` | Done |
| `packages/backend/convex/auth.config.ts` | **Missing.** Without it Convex rejects every Clerk token; `ctx.auth.getUserIdentity()` is always `null`. |
| `users.bootstrap` mutation | Exists, **never called** from any app |
| `users.currentUser` query | Exists |
| `requireAuth`, `requireAdmin`, `requireOrgMember` in `convex/lib/auth.ts` | Exist, used by all domain functions |
| Sign-in / sign-up screens | **Missing** |
| Route protection on `(tabs)` | **Missing** |
| Sign out | **Missing** |
| Clerk Dashboard: auth methods + Convex JWT template | **Not configured** (manual, outside repo) |

## Existing pieces reused

| Need | Already exists |
|------|----------------|
| Token cache | `tokenCache` in `_layout.tsx` |
| Text input / button | `FormField`, `FormButton` (`@/components/form`) |
| Screen chrome | `ThemedView`, `ThemedText`, `ScreenHeader` |
| Loading placeholder | `ActivityIndicator` pattern in `(tabs)/index.tsx` |
| Error surfacing | `Alert.alert` (composer-shell pattern) |
| Org selection after sign-in | `useCurrentOrg` (unchanged) |
| Audit log event types | `LogEventType.USER_SIGNUP` (optional, see Task 3) |

---

## Files likely to change

| File | Change |
|------|--------|
| `packages/backend/convex/auth.config.ts` | **New.** Clerk issuer domain + `applicationID: "convex"` |
| `packages/backend/.env.example` or root `.env.example` | Add `CLERK_JWT_ISSUER_DOMAIN` |
| `packages/backend/convex/users.ts` | `bootstrap`: derive `clerkId`/`email` from `ctx.auth.getUserIdentity()` instead of trusting client args (security fix, see Risks) |
| `apps/mobile/src/hooks/use-bootstrap-user.ts` | **New.** Calls `users.bootstrap` once when signed in and `currentUser === null` |
| `apps/mobile/src/app/_layout.tsx` | Add `AuthGate` child component that redirects between `(auth)` and `(tabs)` |
| `apps/mobile/src/app/(auth)/_layout.tsx` | **New.** Stack layout; redirect to `(tabs)` if already signed in |
| `apps/mobile/src/app/(auth)/sign-in.tsx` | **New.** Email + password form, Google and Apple buttons, link to sign-up |
| `apps/mobile/src/app/(auth)/sign-up.tsx` | **New.** Email + password + email-code verification step, link to sign-in |
| `apps/mobile/src/components/auth/oauth-buttons.tsx` | **New.** Google / Apple buttons using `useSSO` from `@clerk/clerk-expo` |
| `apps/mobile/src/app/(tabs)/_layout.tsx` | No change (gate lives above it) |
| `apps/mobile/src/app/(tabs)/more/index.tsx` | Add "Sign out" row calling `useAuth().signOut()` |
| `apps/mobile/app.json` | Verify `scheme: "mobile"` is acceptable for OAuth redirect (see Assumptions) |
| `.claude/TASKS.md` | Check off 3.1 mobile items and 3.4 verify item |
| `.claude/CLAUDE.md` | Move "Clerk dashboard config and sign-in screens" from In progress to Complete |

Out of scope (separate TASKS items, not touched): marketing auth entry points, admin panel Clerk integration, invite acceptance page, biometric unlock (SPEC 35), `logs` write on login.

---

## Chunk 1: Backend

### Task 1: Convex accepts Clerk tokens

**Files:**
- Create: `packages/backend/convex/auth.config.ts`
- Modify: env example file(s)

- [ ] **Step 1:** Create `auth.config.ts`:

```ts
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

- [ ] **Step 2:** Document `CLERK_JWT_ISSUER_DOMAIN` in the env example and set it in the Convex deployment (dashboard or `npx convex env set`). Value is the Clerk Frontend API URL (`https://<slug>.clerk.accounts.dev` for dev).
- [ ] **Step 3:** Commit.

### Task 2: Harden `bootstrap`

**Files:**
- Modify: `packages/backend/convex/users.ts`

- [ ] **Step 1:** Change `bootstrap` to `args: {}`; read `identity = await ctx.auth.getUserIdentity()`, throw `ConvexError({ code: "UNAUTHENTICATED" })` if null; use `identity.subject` as `clerkId` and `identity.email ?? ""` as `email`. Keep idempotent behaviour.
- [ ] **Step 2:** Update the doc comment. `getByClerkId` and `currentUser` unchanged.
- [ ] **Step 3:** Commit.

Rationale: today any signed-in caller could bootstrap an arbitrary `clerkId`. Since `requireAuth` keys on `identity.subject`, the server already knows the correct value.

---

## Chunk 2: Mobile

### Task 3: Bootstrap hook

**Files:**
- Create: `apps/mobile/src/hooks/use-bootstrap-user.ts`

- [ ] **Step 1:** Hook: `const { isSignedIn } = useAuth(); const user = useQuery(api.users.currentUser, isSignedIn ? {} : 'skip'); const bootstrap = useMutation(api.users.bootstrap);` In an effect, when `isSignedIn && user === null`, call `bootstrap()` once (guard with a ref). Return `{ isReady: !isSignedIn || !!user }`.
- [ ] **Step 2:** Commit.

### Task 4: Auth gate in root layout

**Files:**
- Modify: `apps/mobile/src/app/_layout.tsx`

- [ ] **Step 1:** Add `AuthGate` component rendered inside `ConvexProviderWithClerk` in place of bare `<Slot />`:
  - `const { isLoaded, isSignedIn } = useAuth(); const segments = useSegments(); const router = useRouter(); const { isReady } = useBootstrapUser();`
  - While `!isLoaded` or (`isSignedIn && !isReady`): render `ActivityIndicator` full-screen (keeps `AnimatedSplashOverlay` behaviour).
  - Effect: `inAuthGroup = segments[0] === '(auth)'`. If `!isSignedIn && !inAuthGroup` → `router.replace('/(auth)/sign-in')`. If `isSignedIn && inAuthGroup` → `router.replace('/(tabs)')`.
  - Otherwise `<Slot />`.
- [ ] **Step 2:** Commit.

### Task 5: Sign-in screen

**Files:**
- Create: `apps/mobile/src/app/(auth)/_layout.tsx` (plain `Stack` with `headerShown: false`)
- Create: `apps/mobile/src/app/(auth)/sign-in.tsx`
- Create: `apps/mobile/src/components/auth/oauth-buttons.tsx`

- [ ] **Step 1:** `sign-in.tsx`: `useSignIn()`; email + password `FormField`s; on submit `signIn.create({ identifier, password })`, if `status === 'complete'` call `setActive({ session: createdSessionId })`; else `Alert.alert` with Clerk error `errors[0].longMessage`. Disable button while submitting. Link to `/(auth)/sign-up`.
- [ ] **Step 2:** `oauth-buttons.tsx`: call `WebBrowser.maybeCompleteAuthSession()` at module level; `useSSO()`; two `FormButton`s calling `startSSOFlow({ strategy: 'oauth_google' | 'oauth_apple', redirectUrl: AuthSession.makeRedirectUri() })`, then `setActive` if `createdSessionId`. Apple button rendered only on iOS.
- [ ] **Step 3:** Commit.

### Task 6: Sign-up screen

**Files:**
- Create: `apps/mobile/src/app/(auth)/sign-up.tsx`

- [ ] **Step 1:** `useSignUp()`; step 1: email + password → `signUp.create({ emailAddress, password })` then `prepareEmailAddressVerification({ strategy: 'email_code' })`; step 2: code field → `attemptEmailAddressVerification({ code })`; on `complete` → `setActive`. Same error handling as sign-in. Reuse `OAuthButtons`. Link to `/(auth)/sign-in`.
- [ ] **Step 2:** Commit.

### Task 7: Sign out

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/more/index.tsx`

- [ ] **Step 1:** Add a `Pressable` row "Sign out" at the bottom of the list calling `signOut()` from `useAuth()`. The gate in Task 4 handles redirect. Also clear `invo:currentOrgId` from AsyncStorage so the next user does not inherit a stale org id (one-liner, `useCurrentOrg` already handles invalid ids, so this is hygiene only).
- [ ] **Step 2:** Commit.

### Task 8: Docs

- [ ] Check off TASKS 3.1 "Integrate Clerk in mobile app", 3.1 "Configure Clerk Dashboard" (once done manually), 3.4 "Verify authenticated route protection".
- [ ] Update CLAUDE.md status line.
- [ ] Commit.

---

## Manual steps (outside repo, required before verification)

1. Clerk Dashboard → User & Authentication: enable Email + Password, Google, Apple.
2. Clerk Dashboard → JWT Templates: create template named `convex` (default claims are sufficient; add `isAdmin: {{user.public_metadata.isAdmin}}` so `requireAdmin` keeps working).
3. Copy Frontend API URL → `CLERK_JWT_ISSUER_DOMAIN` in Convex env.
4. Google / Apple OAuth credentials configured in Clerk (dev instances can use Clerk's shared dev credentials for Google; Apple requires a real Services ID).

---

## Assumptions

| # | Assumption | If wrong |
|---|-----------|----------|
| A1 | Expo dev client or Expo Go with `scheme: "mobile"` is sufficient for the OAuth redirect. | Custom scheme may need changing in `app.json`; see `docs/plans/expo-go-compat.md`. |
| A2 | Email verification via code is acceptable for sign-up (Clerk default). | Could switch to email link; more routing complexity. |
| A3 | Apple Sign-In can be deferred on Android / non-production builds; button shown on iOS only. | Add cross-platform variant. |
| A4 | `identity.email` is present for email/password and Google users; Apple relay email is acceptable as `users.email`. | Per 005-clerk.md, downstream must tolerate relay addresses. No change needed now. |
| A5 | No `logs` entry on login in this pass (TASKS lists `USER_LOGIN` event but no consumer exists). | Add an insert in `bootstrap` later. |

## Risks

| Risk | Mitigation |
|------|-----------|
| Existing `bootstrap` args change is a breaking API change. | No caller exists anywhere in the repo; verified by grep. |
| Without `auth.config.ts`, every existing screen currently fails with `UNAUTHENTICATED` once Clerk is actually signed in; adding it may surface latent bugs in guarded functions that were never exercised against real identities. | Verification plan walks each tab after sign-in. |
| Redirect loop if `currentUser` stays `null` (e.g. bootstrap throws). | Gate only redirects on `isSignedIn`, not on `currentUser`; bootstrap errors go to `Alert.alert` and the spinner stays up rather than looping. |
| Persisted Clerk session across reinstalls via SecureStore. | Expected ("persistent login", SPEC 35). |
| Biometric unlock (SPEC 35) not included. | Flagged as out of scope; separate task. |

---

## Acceptance criteria

1. Fresh install opens on the sign-in screen; no `(tabs)` screen is reachable unauthenticated (deep link to `/invoices` redirects to sign-in).
2. Email + password sign-up creates a Clerk user, verifies via code, lands on Home, and a `users` row exists in Convex with the Clerk `subject` as `clerkId`.
3. Email + password sign-in with an existing account lands on Home; no duplicate `users` row is created.
4. Google OAuth sign-in completes in the in-app browser and lands on Home.
5. Apple Sign-In completes on an iOS device and lands on Home.
6. Killing and relaunching the app keeps the User signed in.
7. "Sign out" in More returns to the sign-in screen; relaunch stays signed out.
8. After sign-in, Home, Invoices, Clients, and More all load data (proves Convex accepted the JWT and `requireAuth` resolves the user).
9. Wrong password shows a Clerk error message via `Alert.alert`; no crash.
10. `pnpm typecheck` and `pnpm lint` pass.

## Verification plan

| Step | How |
|------|-----|
| Convex JWT accepted | In Convex dashboard logs, call `users.currentUser` from the app; returns a document, not `null`. |
| Bootstrap idempotent | Sign in, sign out, sign in again; `users` table count unchanged. |
| Route protection | `npx uri-scheme open mobile://invoices --ios` while signed out → lands on sign-in. |
| OAuth | Manual on simulator (Google) and physical iPhone (Apple). |
| Sign out clears org | After sign out, AsyncStorage key `invo:currentOrgId` absent (log in dev). |
| Regression | Walk: create client, create draft invoice, open More → Setup. All should succeed as before. |
| Static | `pnpm typecheck && pnpm lint`. |
