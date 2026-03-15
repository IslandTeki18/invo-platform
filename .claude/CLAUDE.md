# CLAUDE.md

## Project Overview

**invo-platform** is a Turborepo monorepo containing three applications and shared packages, managed with pnpm.

## Monorepo Structure

### Apps

- **apps/admin** — Internal admin dashboard. React + TypeScript + Vite. Uses react-router-dom for routing. Currently minimal (Hello World route). Tailwind CSS configured but uses nativewind preset.
- **apps/marketing** — Public marketing site. React + TypeScript + Vite. Contains the default Vite starter template with a counter demo and branding. Same Tailwind/nativewind preset setup as admin.
- **apps/mobile** — React Native mobile app built with Expo (SDK 55). Uses file-based routing via expo-router with a tab navigator (Home + Explore). Includes react-native-reanimated, react-native-safe-area-context, nativewind, and react-native-svg.

### Packages

- **packages/types** — Shared TypeScript types. Entry point at `src/index.ts`. Referenced via `@repo/types` path alias in the root tsconfig.
- **packages/ui** — Shared UI components. Entry point at `src/index.ts`. Referenced via `@repo/ui` path alias.
- **packages/utils** — Shared utility functions. Entry point at `src/index.ts`. Referenced via `@repo/utils` path alias.

## Key Technologies

- **Package Manager:** pnpm (v10.22.0) with hoisted node_modules (`shamefully-hoist=true`)
- **Monorepo Orchestration:** Turborepo
- **Web Apps:** React 19, Vite 8, TypeScript ~5.9, react-router-dom 7
- **Mobile App:** Expo 55, React Native 0.83, React 19.2.0
- **Styling:** Tailwind CSS 4 (web apps use nativewind preset in tailwind config; mobile uses nativewind)
- **Linting:** ESLint 9 with typescript-eslint (root + all packages); web apps add react-hooks/react-refresh plugins
- **Formatting:** Prettier (root config)
- **CI:** GitHub Actions (install, lint, typecheck, build)

## Commands

- `pnpm dev` — Run all apps in parallel
- `pnpm dev:mobile` / `pnpm dev:admin` / `pnpm dev:marketing` — Run a single app
- `pnpm build` — Build all apps
- `pnpm lint` — Lint all apps and packages
- `pnpm typecheck` — Type-check all apps and packages
- `pnpm format` — Format all files with Prettier
- `pnpm format:check` — Check formatting without writing

## Notable Configuration Details

- The root `tsconfig.json` defines path aliases for `@repo/types`, `@repo/ui`, and `@repo/utils` pointing to their respective `src` directories.
- Web apps (admin, marketing) use Vite with `@vitejs/plugin-react` and have separate tsconfig files for app code vs node/vite config.
- The mobile app uses Expo's tsconfig base with `@/*` path aliases mapping to `./src/*` and `@/assets/*` mapping to `./assets/*`.
- Both web app `tailwind.config.js` files reference `nativewind/preset`, which is a dependency of the mobile app — this may be intentional for shared styling or a leftover from initial setup.
- The `.npmrc` is configured for hoisted installs with `auto-install-peers=true`.