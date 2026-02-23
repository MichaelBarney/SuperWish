# SuperTask - Task Management

SuperTask is the task management module of SuperX. It provides a unified task system that integrates with SuperQuest (quests/sub-quests), SuperTrip (trips/destinations), and SuperWish (wish linking).

## Features

### Task Creation
- **Quick-add input**: Contenteditable input with inline NLP highlighting for dates and recurrence
- **Modal form**: Full form with dropdowns for time horizon, recurrence, and link selectors
- **Inline triggers**: Single-character triggers for quick actions:
  - `@` → Mention picker → opens wish picker (type `@wish` or select from dropdown)
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
- Wish linking (completion tied to wish ownership status)
- Quest/sub-quest linking
- Trip/destination linking

### Task Views
- **Inbox**: Tasks not linked to any quest or trip
- **Today**: Tasks with "Today" time horizon
- **Group by project**: Group tasks by their linked quest/trip

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
| `@` | Opens mention picker | Shows available mention types (currently: Wish). Filters as you type after `@`. |
| `@wish` | Opens wish picker | Exact match shortcut—skips the mention picker. |
| `!` | Opens blocker picker | Type `!` at start or after a space to pick blocking tasks. |
| `#` | Opens quest picker | Two-step: select quest, then optionally select sub-quest. |
| `/date` | Opens date picker | Manual date selection calendar. |

The `TaskForm.vue` modal also supports the `@wish` trigger in the title field.

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
| TaskWishPicker | `components/task/TaskWishPicker.vue` | Wish search dropdown (thin wrapper around TaskInlineSearchPicker) |
| TaskBlockerPicker | `components/task/TaskBlockerPicker.vue` | Blocker task search dropdown (thin wrapper around TaskInlineSearchPicker) |
| TaskQuestPicker | `components/task/TaskQuestPicker.vue` | Two-step quest > sub-quest picker |
| TaskMentionPicker | `components/task/TaskMentionPicker.vue` | `@` mention type selector dropdown |
| TaskInlineSearchPicker | `components/task/TaskInlineSearchPicker.vue` | Shared search dropdown used by WishPicker, BlockerPicker, and QuestPicker |

## Composables

| Composable | File | Description |
|------------|------|-------------|
| useTasks | `composables/useTasks.ts` | CRUD operations and real-time Firestore subscription for tasks |

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
