# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a **pnpm workspaces monorepo** with three packages:

| Package | Path | Description |
|---------|------|-------------|
| `@superwish/shared` | `packages/shared/` | Pure TypeScript library — shared types, utils, and interfaces |
| `@superwish/web` | `apps/web/` | Nuxt 3 SPA — the main web application |
| `@superwish/mobile` | `apps/mobile/` | NativeScript-Vue 3 — native mobile app (SuperTask Inbox) |

## Build & Development Commands

```bash
# From monorepo root:
pnpm install              # Install all workspace dependencies
pnpm dev                  # Start web Nuxt dev server + Firebase Functions emulator (localhost:3005)
pnpm dev:nuxt             # Start only web Nuxt dev server (no functions emulator)
pnpm build                # Build web app for production
pnpm generate             # Generate static SPA for Firebase Hosting
pnpm dev:mobile:ios       # Run NativeScript mobile app on iOS
pnpm dev:mobile:android   # Run NativeScript mobile app on Android
firebase deploy           # Deploy hosting + functions
```

Cloud Functions (in `functions/` directory):
```bash
cd functions && npm install    # Install functions deps (uses npm, not pnpm)
cd functions && npm run serve  # Run functions emulator locally
firebase deploy --only functions
```

No linter or test runner is configured.

## Documentation

Always search the documentation for planning new adjustments. Always keep documentation updated.

| Documentation | Path | Description |
|---------------|------|-------------|
| Project overview | `apps/web/documentation/PROJECT.md` | Full tech stack, structure, design system, deployment |
| SuperWish | `apps/web/documentation/SUPERWISH.md` | Wishlist module |
| SuperTrip | `apps/web/documentation/SUPERTRIP.md` | Travel planning module |
| SuperQuest | `apps/web/documentation/SUPERQUEST.md` | Goal tracking module |
| SuperTask | `apps/web/documentation/SUPERTASK.md` | Task management module |
| Mobile app | `apps/mobile/documentation/MOBILE.md` | NativeScript mobile app |
| New module guide | `apps/web/documentation/CREATENEWAPP.md` | Adding a new module |

## Architecture

**SuperX** is a personal life management SPA built with Nuxt 3 (SSR disabled), Firebase, and Tailwind CSS. It contains four modules that share authentication, navigation, UI components, and i18n:

| Module | Route prefix | Accent color | Icon |
|--------|-------------|--------------|------|
| SuperWish | `/wish` | Teal (accent) | `lucide:star` |
| SuperTrip | `/trip` | Purple | `lucide:plane` |
| SuperQuest | `/quest` | Green | `lucide:target` |
| SuperTask | `/task` | Orange | `lucide:square-check-big` |

### Shared Package (`packages/shared/`)

Contains pure TypeScript code shared between web and mobile:
- **`src/types/task.ts`** — Task, TaskForm, TaskTimeHorizon, TaskRecurrence, etc.
- **`src/utils/taskDueDate.ts`** — computeTimeHorizonFromDate, formatDueDate, isDueDateOverdue
- **`src/utils/taskRecurrence.ts`** — computeNextDueDate, computeInitialDueDateFromRecurrence, formatRecurrence
- **`src/firebase/types.ts`** — `FirebaseProvider` interface for platform-agnostic Firebase access

The shared package exports raw `.ts` files (no build step) — both Nuxt and NativeScript transpile them directly.

### Mobile App (`apps/mobile/`)

NativeScript-Vue 3 app implementing the SuperTask Inbox:
- Uses `@nativescript/firebase-*` plugins for native Firebase access
- Implements `FirebaseProvider` interface from `@superwish/shared`
- Shares task types and utility functions with the web app
- Orange accent color scheme (`#f97316`)

### Key Patterns

**Module theming**: Components use `useAppContext()` to get the active module and dynamically apply the correct accent color. The `Button.vue`, `AppSidebar.vue`, `AppSidebarItem.vue`, and `AppSwitcher.vue` components all branch on the current app to apply module-specific colors. When adding a new module, follow `apps/web/documentation/CREATENEWAPP.md` for the full checklist.

**Data layer**: All data flows through composables (`useLists`, `useWishes`, `useTrips`, `useQuests`, `useTasks`, etc.) that wrap Firestore operations. Each composable follows the same pattern: reactive `ref<T[]>` state, `onSnapshot` real-time listeners with unsubscribe cleanup, user validation via `useAuth()`, and `getDb()` helper to access Firestore.

**Form types**: Each data model has a separate `*Form` type (e.g., `Wish` vs `WishForm`). Forms use string fields for dates/prices that get converted to proper types on save.

**Firebase plugin** (`apps/web/plugins/firebase.client.ts`): Initializes Auth, Firestore, Storage, and Functions as Nuxt provides (`$firebase`, `$auth`, `$db`, `$storage`, `$functions`). Connects to Functions emulator on `localhost:5001` in development.

**i18n**: English (`en`) and Portuguese Brazilian (`pt-BR`) via `@nuxtjs/i18n` with `no_prefix` strategy. All user-facing text must go through translation keys in `apps/web/i18n/locales/`.

**Layouts**: Pages use either `app` (simple header) or `app-with-sidebar` (sidebar with module navigation). Protected pages use `definePageMeta({ layout: 'app-with-sidebar', middleware: 'auth' })`.

**Types**: Web-specific types live in `apps/web/types/index.ts`. Shared task types are re-exported from `@superwish/shared`.

**Date-only fields (IMPORTANT)**: When storing date-only values (no time component) to Firestore, NEVER use `new Date(dateString)` directly — JS parses date-only strings as UTC midnight, causing off-by-one day errors in negative-offset timezones. Always append `'T12:00:00'` before parsing: `new Date(dateStr + 'T12:00:00')`. When displaying stored date-only values, use `timeZone: 'UTC'` in format options, or use UTC getters (`getUTCDate`, `getUTCMonth`, `getUTCFullYear`).

**Component naming (IMPORTANT)**: Nuxt auto-imports deduplicate when the filename already starts with the folder name. `components/task/TaskList.vue` → `<TaskList>` (NOT `<TaskTaskList>`). `components/quest/SubQuestList.vue` → `<QuestSubQuestList>` (folder prefix added since filename doesn't start with `Quest`).

**TaskList event forwarding (IMPORTANT)**: `TaskList` emits several events (`toggle`, `edit`, `delete`, `add`, `inlineUpdate`, `updateTimeHorizon`, `updateEstimatedTime`). When `TaskList` is rendered inside a wrapper component (e.g., `DestinationTaskGroup`, `SubQuestCard`), the wrapper MUST forward ALL TaskList events upward via `$emit` and declare them in `defineEmits`. When adding new events to `TaskList`, update every wrapper component in the chain and every page that consumes tasks. Wrapper components rename events with a `Task` suffix (e.g., `updateTimeHorizon` → `updateTimeHorizonTask`) to avoid collisions.

**SuperTask documentation (IMPORTANT)**: When making changes to the SuperTask module (components in `apps/web/components/task/`, composables like `useTasks`, pages in `apps/web/pages/task/`, or task-related types), always update `apps/web/documentation/SUPERTASK.md` to reflect the changes. This includes adding/removing components, changing the trigger system, modifying event forwarding chains, or updating data models.

**Mobile documentation (IMPORTANT)**: When making changes to the mobile app (`apps/mobile/`), always update `apps/mobile/documentation/MOBILE.md`. This includes adding/modifying views, components, composables, or changing the Firebase provider implementation.

**pnpm + NativeScript (IMPORTANT)**: NativeScript requires a flat `node_modules` structure. The `.npmrc` at monorepo root has `shamefully-hoist=true` and `node-linker=hoisted` — do NOT remove these or NativeScript builds will fail with missing module errors.

## Firebase

- **Auth**: Google Sign-In only
- **Firestore**: Collections are `users`, `lists`, `wishes`, `trips`, `destinations`, `transportations`, `quests`, `subquests`, `tasks` — each document has a `userId` field for ownership-based security rules
- **Storage**: Images only, 5MB limit, path pattern `users/{userId}/{filename}`
- **Cloud Functions**: `searchProducts` calls SerpAPI for Google Shopping results

## Environment Variables

Required in `apps/web/.env`:
```
NUXT_PUBLIC_FIREBASE_API_KEY
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NUXT_PUBLIC_FIREBASE_PROJECT_ID
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NUXT_PUBLIC_FIREBASE_APP_ID
```

SerpAPI key is a Firebase secret, not in `.env`: `firebase functions:secrets:set SERPAPI_KEY`
