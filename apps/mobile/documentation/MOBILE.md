# SuperX Mobile - NativeScript-Vue 3 App

A native mobile app for **SuperTask Inbox**, built with NativeScript-Vue 3 and sharing code with the web app via `@superwish/shared`.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **NativeScript** (~8.8.0) | Native mobile framework |
| **NativeScript-Vue 3** (~3.0.0-rc.1) | Vue 3 integration for NativeScript |
| **@nativescript/firebase-core** (~5.0.0) | Firebase initialization |
| **@nativescript/firebase-auth** (~5.0.0) | Google Sign-In authentication |
| **@nativescript/firebase-firestore** (~5.0.0) | Real-time Firestore access |
| **@nativescript/webpack** (~5.0.0) | Build tooling |
| **@superwish/shared** (workspace) | Shared types, utils, and interfaces |
| **TypeScript** (~5.6.0) | Type-safe development |

## App Identity

- **Package name**: `com.michaelbarney.superx`
- **Display name**: SuperX
- **Accent color**: Orange (`#f97316`)

## Project Structure

```
apps/mobile/
├── package.json                  # Dependencies and scripts
├── nativescript.config.ts        # NativeScript app config (app ID, paths)
├── webpack.config.js             # Webpack build config
├── tsconfig.json                 # TypeScript config
├── references.d.ts               # Type references
├── App_Resources/
│   ├── Android/
│   │   ├── google-services.json  # Firebase config (not in git)
│   │   ├── app.gradle            # Android build settings
│   │   └── src/main/res/values/
│   │       ├── colors.xml        # Orange theme colors
│   │       └── styles.xml        # Android theme styles
│   └── iOS/
│       ├── GoogleService-Info.plist  # Firebase config (not in git)
│       └── Info.plist            # iOS app config with URL schemes
├── documentation/
│   └── MOBILE.md                 # This file
└── src/
    ├── app.ts                    # App entry point — Firebase init + launch
    ├── app.css                   # Global styles (orange accent theme, pill badges)
    ├── firebase.ts               # Firebase initialization helpers
    ├── composables/
    │   ├── useFirebase.ts        # NativeScriptFirebaseProvider (implements FirebaseProvider)
    │   └── useTasks.ts           # Task composable (subscribe, CRUD, computed views)
    ├── views/
    │   ├── LoginView.vue         # Google Sign-In screen
    │   └── InboxView.vue         # Main task management screen
    └── components/
        ├── TaskItemNative.vue    # Task row with pills and checkbox
        └── TaskQuickAddNative.vue # Quick-add text field + button
```

## Architecture

### Shared Code (`@superwish/shared`)

The mobile app imports from the shared package:

| Import | Usage |
|--------|-------|
| `Task`, `TaskForm`, `TaskTimeHorizon`, etc. | Type definitions |
| `computeTimeHorizonFromDate` | Auto-compute horizon from due dates |
| `computeNextDueDate` | Create next occurrence for recurring tasks |
| `computeInitialDueDateFromRecurrence` | Compute initial due date from recurrence config |
| `formatDueDate` | Display due dates as "Today", "Tomorrow", etc. |
| `isDueDateOverdue` | Check if a task's due date has passed |
| `formatRecurrence` | Display recurrence as "Daily", "Every Monday", etc. |
| `FirebaseProvider` | Interface implemented by `NativeScriptFirebaseProvider` |

### Firebase Provider Pattern

The `FirebaseProvider` interface (defined in `@superwish/shared`) abstracts Firebase operations:

```typescript
interface FirebaseProvider {
  getCurrentUserId(): string | null
  onAuthStateChange(callback: (userId: string | null) => void): () => void
  subscribeToTasks(userId, onData, onError): () => void
  createTask(data): Promise<string>
  updateTask(id, data): Promise<void>
  deleteTask(id): Promise<void>
}
```

- **Web** implements this with `firebase/firestore` (onSnapshot, addDoc, etc.)
- **Mobile** implements this with `@nativescript/firebase-firestore` APIs

### Data Flow

```
Firebase Firestore
    ↕ (real-time sync)
NativeScriptFirebaseProvider (useFirebase.ts)
    ↕
useTasks composable (useTasks.ts)
    ↕ (reactive refs + computed)
Views (InboxView.vue)
    ↕
Components (TaskItemNative.vue, TaskQuickAddNative.vue)
```

## Screens

### LoginView

- Orange-themed login screen with Google Sign-In button
- Auth state listener — auto-navigates to Inbox if session exists
- Error display for failed sign-in attempts

### InboxView

Main task management screen with:

- **ActionBar**: "SuperTask" title + Sign Out button
- **SegmentedBar**: 5 tabs — Inbox, Today, Week, Month, Later
- **Task list**: ScrollView with active tasks + collapsible completed section
- **Quick-add bar**: TextField + Add button at bottom

#### Tab Filtering

| Tab | Filter | TimeHorizon |
|-----|--------|-------------|
| Inbox | No project context AND no time horizon | `null` |
| Today | `timeHorizon === 'today'` | `today` |
| Week | `timeHorizon === 'this_week'` | `this_week` |
| Month | `timeHorizon === 'this_month'` | `this_month` |
| Later | `timeHorizon === 'long_term'` | `long_term` |

#### Task Actions (tap dialog)

Tapping a task shows a native action dialog with:
- **Set Time Horizon** — sub-dialog with Today/This Week/This Month/Long Term/Remove
- **Set Estimated Time** — sub-dialog with 5min/12min/25min/1h+/Remove
- **Delete Task** — confirmation dialog

## Components

### TaskItemNative.vue

| Element | NativeScript Component | Notes |
|---------|----------------------|-------|
| Checkbox | `<Switch>` | Orange when active, teal if wish-linked, red if blocked |
| Title | `<Label>` | Strikethrough when completed |
| Pill badges | `<Label>` with CSS classes | Same color scheme as web |

**Pill badge types:**
- Time horizon (amber/blue/purple/gray)
- Estimated time (yellow/blue/green/red)
- Due date (gray, red when overdue)
- Blocker count (red)
- Recurrence (violet)

**Business logic:**
- Wish-linked tasks: switch disabled (completion mirrors wish status)
- Blocked tasks: switch shows red, cannot complete
- Blocker count: shows count of incomplete blocking tasks

### TaskQuickAddNative.vue

- Simple TextField + "Add" button
- Creates task with current tab's timeHorizon
- No NLP parsing (plain title only for MVP)

## Composables

### useFirebase.ts — `NativeScriptFirebaseProvider`

Implements `FirebaseProvider` using `@nativescript/firebase-*`:
- `getCurrentUserId()` — reads from `firebase().auth().currentUser`
- `onAuthStateChange()` — wraps `onAuthStateChanged`
- `subscribeToTasks()` — Firestore query with `where('userId')` + `orderBy('order')`
- `createTask()` / `updateTask()` / `deleteTask()` — Firestore document operations

### useTasks.ts

Full task management composable:

**State:** `tasks`, `loading`, `error` (reactive refs)

**Computed views:**
- `inboxTasks` — no project context, no time horizon
- `todayHorizonTasks`, `thisWeekTasks`, `thisMonthTasks`, `longTermTasks`

**Methods:**
- `subscribeToTasks()` / `unsubscribeFromTasks()` — real-time Firestore listener
- `createTask(data: TaskForm)` — create with auto-computed dueDate/timeHorizon from recurrence
- `toggleTaskComplete(id, completed)` — with blocker validation, wish-link check, and auto-create next recurring occurrence
- `updateTaskTimeHorizon(id, horizon)`
- `updateTaskEstimatedTime(id, estimatedTime)`
- `deleteTask(id)` — with blocker reference cleanup

## Styling

All styles are in `src/app.css` using plain NativeScript CSS (no Tailwind):

- **Orange accent** (`#f97316`) throughout — ActionBar, buttons, switches, SegmentedBar
- **Pill badges** — same color scheme as web (amber, blue, purple, gray, red, violet, etc.)
- **Font**: System default (SF Pro Text on iOS, Roboto on Android)
- **Backgrounds**: Light gray (`#f9fafb`) page background, white task items

## Firebase Setup

### Android
1. Download `google-services.json` from Firebase Console
2. Place at `App_Resources/Android/google-services.json`
3. Add SHA-1 fingerprint in Firebase Console for Google Sign-In

### iOS
1. Download `GoogleService-Info.plist` from Firebase Console
2. Place at `App_Resources/iOS/GoogleService-Info.plist`
3. Update `REVERSED_CLIENT_ID` URL scheme in `App_Resources/iOS/Info.plist`

Both files are gitignored.

## Development

### Prerequisites
- Node.js 18+
- NativeScript CLI: `npm install -g nativescript`
- CocoaPods: `brew install cocoapods` (iOS)
- Xcode (iOS) or Android Studio (Android)

### Commands

```bash
# From monorepo root:
pnpm dev:mobile:ios       # Run on iOS device/simulator
pnpm dev:mobile:android   # Run on Android device/emulator

# From apps/mobile/:
ns run ios                # Run on iOS
ns run android            # Run on Android
ns build ios              # Build iOS
ns build android          # Build Android
ns clean                  # Clean build artifacts
```

### pnpm + NativeScript

NativeScript requires a flat `node_modules` structure. The monorepo root `.npmrc` is configured with:
```
shamefully-hoist=true
node-linker=hoisted
```

## Real-Time Sync

Tasks sync in real-time between web and mobile via Firestore:
- Add a task on web → appears on mobile within seconds
- Toggle completion on mobile → updates on web
- Both platforms use the same Firestore collection (`tasks`) and user authentication

## Limitations (MVP)

- **No NLP parsing** — quick-add creates plain title tasks (no date/recurrence detection)
- **No task editing** — only toggle, time horizon, estimated time, and delete via action dialogs
- **No drag-and-drop reordering**
- **No i18n** — English only (hardcoded translation stubs)
- **No offline support** — requires internet connection
- **No push notifications**
