# 005 — Clerk Instance Setup

**Date:** 2026-03-15
**Status:** Confirmed

---

## Decision Summary

Use a single Clerk application instance shared across all authenticated surfaces of the invo-platform. Do not provision separate Clerk instances per app.

---

## SDK Usage Per Surface

| Surface | SDK | Notes |
|---|---|---|
| Mobile app (`apps/mobile`) | `@clerk/clerk-expo` | Expo-specific SDK with token cache support |
| Admin panel (`apps/admin`) | `@clerk/clerk-react` | Role-gated behind `publicMetadata.isAdmin` |
| Marketing site (`apps/marketing`) | `@clerk/clerk-react` | Auth entry points only (sign-in, sign-up) |
| Invite acceptance page | `@clerk/clerk-react` | Requires sign-in before invite can be accepted |

---

## Auth Strategy

### Enabled Methods

1. **Email + password** — Primary method. Universally supported, no third-party dependency.
2. **Google OAuth** — Reduces friction for users with Google accounts.
3. **Apple Sign-In** — Required by App Store policy when any other social login is offered.

### Rationale

- Email + password ensures no lock-in to any OAuth provider.
- Google OAuth is the highest-adoption social login for the expected user base.
- Apple Sign-In is non-optional once Google OAuth is enabled, per Apple's App Store Review Guidelines (4.8).

---

## Admin Access Pattern

Admin access uses the same Clerk instance with a role-based gate rather than a separate Clerk tenant.

### Implementation

- Admin status is stored in Clerk user metadata: `publicMetadata.isAdmin: true`
- Alternatively, a custom JWT claim can be used if session-level propagation is required.
- All admin-only API endpoints check admin status server-side on every request.
- The admin UI (`apps/admin`) performs a client-side redirect if the user lacks the admin flag, but this is a UX guard only — not a security boundary.

### Rejected Alternative: Separate Clerk Instance for Admin

A separate Clerk instance for admin would require:
- A distinct publishable key and secret key
- Separate user management
- No shared session between marketing and admin surfaces

This adds operational complexity with no security benefit, since the security boundary is enforced by backend authorization checks regardless of which Clerk instance issued the session token.

---

## Implications

### Environment Variables

- Web apps (`apps/admin`, `apps/marketing`) use a shared `CLERK_PUBLISHABLE_KEY`.
- The mobile app (`apps/mobile`) must expose the key via the `EXPO_PUBLIC_` prefix: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- The backend uses `CLERK_SECRET_KEY` to verify session tokens server-side.

### Key Distribution

Since all surfaces share one Clerk application, the publishable key is identical across web apps. There is no per-app key isolation at the Clerk level.

---

## Security Considerations

- `publicMetadata` is writable only from the server side (Clerk Backend API or Clerk Dashboard). It cannot be modified by the client.
- Admin checks must always be enforced on the backend. Client-side role checks are UX conveniences only.
- OAuth tokens from Google and Apple are handled by Clerk and are not exposed to the application layer.
- Apple Sign-In hides user email by default. Clerk handles the relay email; ensure downstream systems can operate without a canonical email address in this case.
- Session token expiration and rotation are managed by Clerk defaults. Review and tighten if compliance requirements demand it.
