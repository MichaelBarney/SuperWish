# SuperTask - Task Management

SuperTask is the task management module of SuperX. It provides a unified task system that integrates with SuperQuest (quests/sub-quests), SuperTrip (trips/destinations), and SuperWish (wish linking).

## Features

### Task Creation
- **Quick-add input**: Contenteditable input with inline NLP highlighting for dates and recurrence
- **Modal form**: Full form with dropdowns for time horizon, recurrence, and link selectors
- **Inline triggers**: Single-character triggers for quick actions:
  - `@` → Mention picker → toggles create-wish flag (type `@wish` or select from dropdown); task will also create a wish in SuperWish
  - `!` → Opens blocker picker to add blocked-by dependencies
  - `#` → Opens quest/sub-quest picker for linking
  - `/date` → Opens date picker
- **NLP date parsing**: Uses chrono-node to detect natural language dates (e.g., "tomorrow", "next friday")
- **NLP recurrence detection**: Detects patterns like "every monday", "daily", "todo dia primeiro", "every 15th"
- **Auto-computed dueDate/timeHorizon from recurrence**: When recurrence is set (via NLP, quick-add, or form), dueDate and timeHorizon are automatically computed if not already set. Daily → today, weekly → 7 days out, monthly → next occurrence of day, yearly → next year.

### Task Properties
- Title and description
- Due date (with optional time)
- Time horizon: Today, This Week, This Month, Long Term (dynamically derived from due date at read time)
- Estimated time: 5 min, 12 min, 25 min, 1h+
- Recurrence: Daily, Weekly, Monthly, Yearly
- Blocked-by dependencies (other tasks)
- URL linking (auto-fetches page title, displays as clickable hyperlink)
- Wish linking (completion tied to wish ownership status)
- Quest/sub-quest linking
- Trip/destination linking

### URL Linking
When a URL is detected in the task title, the task stores `url` and `urlTitle` fields. URL metadata is fetched inline (Todoist-style) before submission:
- **Inline detection**: TaskQuickAdd detects URLs via regex (`https?://[^\s]+`) on paste or after typing (debounced). Only the first URL match is processed
- **Inline fetch**: When a URL is detected, `triggerUrlFetch()` immediately calls `useUrlMetadata().fetchMetadata()` (which invokes the `fetchUrlMetadata` Cloud Function). While loading, the URL text is shown dimmed blue (`text-blue-500 opacity-60`) and the pill shows a spinner + hostname. On success, the URL substring in the title is replaced with the fetched page title, styled as a blue underlined link (`text-blue-600 underline`)
- **Submit with pre-fetched title**: On submit, both `url` (original URL) and `urlTitle` (fetched title) are passed in the `add` event. Page handlers store both fields directly — no post-creation backfill needed
- **Fallback backfill**: If the user submits before the fetch completes (urlTitle is empty), the page handler fires the old fire-and-forget fetch to backfill `urlTitle` after creation
- **Clearing**: The URL pill has an X button that reverts the title text to the original URL and clears the fetch state
- **Invalidation**: If the user edits/deletes the URL region text, the fetch state is automatically cleared
- **Display**: TaskItem renders URL tasks as a blue hyperlink (`text-blue-600`) with an external-link icon. Link text is `urlTitle` (fetched title) or falls back to the raw URL. The hostname (e.g., `youtube.com`) is shown below as a gray badge. Clicking the link opens a new tab and does NOT open the edit modal (`@click.stop`)
- **Edit modal**: TaskForm shows the URL as a clickable link with a clear (X) button. Clearing removes both `url` and `urlTitle`
- **Recurring tasks**: When a recurring URL task is completed, the next occurrence inherits `url` and `urlTitle`

### Task Views
- **Inbox**: Tasks not linked to any quest or trip
- **Today**: Tasks with "Today" time horizon
- **Group by project**: Group tasks by their linked quest/trip

### Sidebar Quick-Create
- **New Mission "+" button**: Next to the "MISSIONS" header in the desktop sidebar. Clicking it reveals an inline text input for typing the mission name. On submit (Enter), creates a quest with defaults (`icon: 'lucide:target'`, `status: 'in_progress'`) and auto-selects it. The MISSIONS header is always visible (even with no missions) to allow creating the first mission from the sidebar.
- **Add Sub-Mission**: When a quest or trip is expanded in the sidebar tree, a small "+ Add" button appears after the sub-quest list. Clicking it reveals an inline text input. On submit, creates a sub-quest via `createSubQuestForQuest()` or `createSubQuestForTrip()`. New sub-quests appear automatically via the Firestore real-time listener.
- **Interaction**: Enter submits, Escape cancels, input auto-focuses on open. Only one inline form is open at a time (opening one closes the other). Desktop-only (sidebar is `hidden md:block`).

### Search
- **Sidebar search button**: A "Search" button at the top of the desktop sidebar (with Cmd+K hint) and a search button on mobile. Clicking it opens the command palette.
- **Command palette** (Cmd/Ctrl+K): Opens a modal overlay (`TaskSearchPalette.vue`) near the top of the screen. Auto-focuses, filters all tasks by case-insensitive substring match on title and description, supports keyboard navigation (Arrow Up/Down, Enter to select, Escape to close). Selecting a task navigates to its natural context (quest, trip, subquest, destination, or time horizon view). Shows up to 8 results with completion state, project badge, and time horizon pill.

### Wish-Task Auto-Linking

Every wish in SuperWish automatically creates a corresponding task in SuperTask. This ensures wishes flow into the unified task execution layer.

**Auto-create**: When a wish is created via `useWishes.createWish()`, a linked task is automatically created with `wishId` set to the new wish's document ID. The task lands in Inbox (no quest, no timeHorizon). If task creation fails, the wish is still created successfully. Pass `{ skipAutoTask: true }` as the third argument to suppress auto-task creation (used when creating a wish from a task's `@wish` trigger, since the task already exists).

**Auto-delete**: When a wish is deleted via `useWishes.deleteWish()`, all linked tasks (matching `wishId`) are deleted atomically in a Firestore batch along with the wish.

**Title sync**: When a wish title is updated via `useWishes.updateWish()`, the title is propagated to all linked tasks. Title sync is non-fatal — the wish update succeeds even if task sync fails.

**Backfill**: The `useWishTaskSync` composable handles existing wishes that were created before auto-linking was implemented. It runs once when the SuperTask index page loads (after tasks finish loading), finds wishes without corresponding tasks, and creates task documents for them. It is idempotent — safe to run multiple times.

## Color Scheme

- **Accent Color**: Orange (#f97316 - orange-500)
- **Time Horizon Colors**:
  - Today: Amber
  - This Week: Blue
  - This Month: Purple
  - Long Term: Gray
- **Estimated Time Colors**:
  - 5 min: Yellow
  - 12 min: Blue
  - 25 min: Green
  - 1h+: Red
- **Blocker pills**: Red
- **Quest pills**: Green
- **Wish indicator**: Teal
- **Recurrence**: Violet

## Inline Trigger System

The quick-add input (`TaskQuickAdd.vue`) supports inline triggers:

| Trigger | Action | Description |
|---------|--------|-------------|
| `@` | Opens mention picker | Shows available mention types: Create Wish and Create Experience. Filters as you type after `@`. Supports keyboard navigation (Arrow Up/Down + Enter). |
| `@wish` | Toggles create-wish flag | Exact match shortcut—skips the mention picker. Task will also create a wish in SuperWish on submit. |
| `@xp` / `@experience` | Opens experience picker | Exact match shortcuts—opens the two-step experience picker (category → city). Creates ONLY an experience in SuperXP on submit — no task is created. |
| `!` | Opens blocker picker | Type `!` at start or after a space to pick blocking tasks. |
| `#` | Opens quest picker | Flat search across quests, sub-quests, trips, and destinations. Selecting a sub-quest or destination links directly (skips Step 2). Selecting a quest/trip with children opens Step 2 for optional refinement. |
| `/date` | Opens date picker | Manual date selection calendar. |

The `TaskForm.vue` modal also supports the `@wish` trigger in the title field (sets link type to "wish" and marks `wishId` as `__create__`).

## Recurrence NLP Patterns

The recurrence parser (`utils/taskRecurrence.ts`) supports:

**English**:
- "every day", "daily", "every week", "weekly", "every month", "monthly", "every year", "yearly"
- "every N days/weeks/months/years" (e.g., "every 2 weeks")
- "every <weekday>" (e.g., "every monday")
- "every 1st", "every 15th" — monthly on specific day (ordinals with st/nd/rd/th suffixes)

**Portuguese**:
- "todo dia", "toda semana", "todo mês", "todo ano"
- "a cada N dias/semanas/meses/anos"
- "toda segunda", "todo sábado" — weekly on specific day
- "todo dia N" — monthly on day N, supports:
  - Numeric: "todo dia 5"
  - Ordinals: "todo dia primeiro", "todo dia décimo"
  - Cardinals: "todo dia cinco", "todo dia quinze"

**Auto-compute utilities** (`utils/taskRecurrence.ts`):
- `computeInitialDueDateFromRecurrence(recurrence)` → computes the initial due date for a new recurrence
- `computeTimeHorizonFromRecurrence(recurrence)` → computes time horizon via `computeTimeHorizonFromDate`

### Dynamic Time Horizon

When tasks have a `dueDate`, the `timeHorizon` is **not read from Firestore** — it is dynamically recomputed from the due date every time tasks are loaded (in the `onSnapshot` callback in `useTasks.ts`). This ensures the displayed horizon stays accurate as days pass (e.g., a task due today always shows "Today", not "This Week" as it might have been when the due date was originally set). Tasks without a `dueDate` use the stored/manual `timeHorizon` value from Firestore.

## Data Models

> See [`types/index.ts`](../types/index.ts) for type definitions:
> - `Task`, `TaskForm`
> - `TaskTimeHorizon`: `'today' | 'this_week' | 'this_month' | 'long_term'`
> - `TaskEstimatedTime`: `'5min' | '12min' | '25min' | '1h_plus'`
> - `TaskRecurrence`, `TaskRecurrenceFrequency`

## Firestore Structure

> See [`firestore.rules`](../firestore.rules) for security rules covering:
> - `tasks/{taskId}` collection

## Components

| Component | Path | Description |
|-----------|------|-------------|
| TaskList | `components/task/TaskList.vue` | Task list with filtering, grouping, and show/hide completed |
| TaskItem | `components/task/TaskItem.vue` | Single task row with inline dropdown badges (horizon, estimate, blocker, recurrence, due date) |
| TaskQuickAdd | `components/task/TaskQuickAdd.vue` | Expandable quick-add input with NLP highlighting and inline triggers |
| TaskForm | `components/task/TaskForm.vue` | Full modal form for creating/editing tasks |
| TaskDatePicker | `components/task/TaskDatePicker.vue` | Calendar date picker with quick options (Today, Tomorrow, Next Week) |
| TaskBlockerPicker | `components/task/TaskBlockerPicker.vue` | Blocker task search dropdown (thin wrapper around TaskInlineSearchPicker) |
| TaskQuestPicker | `components/task/TaskQuestPicker.vue` | Flat search picker for quests, sub-quests, trips, and destinations with optional Step 2 refinement |
| TaskMentionPicker | `components/task/TaskMentionPicker.vue` | `@` mention type selector dropdown with keyboard navigation (Arrow Up/Down + Enter) |
| TaskExperiencePicker | `components/task/TaskExperiencePicker.vue` | Two-step experience picker: category selection → optional city search. Creates experiences in SuperXP. |
| TaskInlineSearchPicker | `components/task/TaskInlineSearchPicker.vue` | Shared search dropdown used by BlockerPicker, QuestPicker, and ExperiencePicker |
| TaskSearchPalette | `components/task/TaskSearchPalette.vue` | Cmd/Ctrl+K command palette for quick-jump task search with keyboard navigation |

## Composables

| Composable | File | Description |
|------------|------|-------------|
| useTasks | `composables/useTasks.ts` | CRUD operations and real-time Firestore subscription for tasks |
| useWishTaskSync | `composables/useWishTaskSync.ts` | Backfill sync: creates tasks for existing wishes that lack one |
| useResolveWishCreation | `composables/useResolveWishCreation.ts` | Shared helper to resolve `__create__` wish sentinel — creates a new wish with `skipAutoTask` and returns its ID |
| useResolveExperienceCreation | `composables/useResolveExperienceCreation.ts` | Shared helper to resolve `__create__` experience sentinel — creates a new experience in SuperXP with category/city data and returns its ID |
| useApiKeys | `composables/useApiKeys.ts` | API key management (generate, revoke, real-time list) |

## Pages

| Page | Path | Description |
|------|------|-------------|
| Task Index | `pages/task/index.vue` | Main task page with Inbox/Today views and project grouping |

## Event Forwarding

`TaskList` emits several events that must be forwarded through wrapper components:

```
TaskList → wrapper component → page
```

**Events**: `toggle`, `edit`, `delete`, `add`, `inlineUpdate`, `updateTimeHorizon`, `updateEstimatedTime`, `updateBlockedBy`, `updateDueDate`, `updateRecurrence`

**Wrapper rename convention**: Events get a `Task` suffix when forwarded (e.g., `updateTimeHorizon` → `updateTimeHorizonTask`).

**Wrappers that forward TaskList events**:
- `DestinationTaskGroup` (SuperTrip destination pages)
- `SubQuestCard` (SuperQuest quest detail pages)

When adding new events to TaskList, update every wrapper component in the chain and every page that consumes tasks.

**`add` event data shape**: The `add` event includes `createExperienceData?: CreateExperienceData` (with `category`, `city`, `country`, `countryCode`) alongside the existing fields. When `createExperienceData` is present, page handlers create ONLY an experience (via `resolveExperienceId`) and return early — no task is created. This differs from `@wish`, which creates both a wish and a task.

## Public API

SuperTask exposes a public HTTP endpoint for creating tasks from external services (e.g., Apple Siri Shortcuts). Authentication uses API keys managed in the Settings page.

### Endpoint

**POST** `https://<region>-<project-id>.cloudfunctions.net/createTaskViaApi`

### Authentication

Include an API key in the `Authorization` header:

```
Authorization: Bearer <api-key>
```

API keys are generated in **Settings > API Keys**. Each key is shown once at creation time and cannot be retrieved again. The server stores only a SHA-256 hash.

### Request Body

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "dueDate": "2025-03-15"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title |
| `description` | string | No | Task description (defaults to `""`) |
| `dueDate` | string | No | Date in `YYYY-MM-DD` format. `timeHorizon` is auto-computed. |

### Response

**201 Created**:
```json
{ "success": true, "taskId": "abc123" }
```

**Error responses**: `400` (bad request), `401` (unauthorized), `405` (method not allowed), `500` (server error).

### Cloud Functions

| Function | Type | Description |
|----------|------|-------------|
| `createTaskViaApi` | `onRequest` (HTTP) | Public endpoint for creating tasks via API key |
| `generateApiKey` | `onCall` (callable) | Generates a new API key (requires Firebase Auth) |
| `revokeApiKey` | `onCall` (callable) | Deletes an API key by ID (requires Firebase Auth + ownership) |

### Firestore Collection: `apiKeys`

| Field | Type | Description |
|-------|------|-------------|
| `hashedKey` | string | SHA-256 hash of the raw API key |
| `userId` | string | Owner's Firebase Auth UID |
| `label` | string | User-provided label |
| `prefix` | string | First 8 characters of the raw key (for display) |
| `createdAt` | Timestamp | Creation timestamp |

Security rules allow the owner to read and delete their keys. Only the Admin SDK (Cloud Functions) can create keys.
