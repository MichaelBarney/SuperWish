# SuperQuest - Goal Tracking

SuperQuest is the goal tracking module of SuperX. It helps users manage personal goals and projects with progress monitoring.

## Features

### Quests
- Create and manage personal goals/projects
- Goal description field
- Start/end date range
- Status workflow: Planning → In Progress → Completed → On Hold
- Cover images
- Trip integration (trips from SuperTrip appear as quests)
- Quest detail page with sub-quests and progress tracking

### Sub-Quests
- Break quests down into smaller steps
- Each sub-quest has its own name, goal, description, cover image, dates, and status
- Sub-quests reuse the same status workflow as quests
- Circular progress indicator shows completed/total sub-quests
- Ordered list with support for reordering
- Stored in a separate `subquests` Firestore collection with `questId` reference

### Trip Integration
- All trips from SuperTrip are automatically displayed as quests
- Trip quests appear with purple styling (SuperTrip's color)
- Clicking a trip quest navigates to the trip in SuperTrip
- Native quests appear with green styling (SuperQuest's color)

## Color Scheme

- **Accent Color**: Green (#22c55e - green-500)
- **Status Colors**:
  - Planning: Gray
  - In Progress: Green
  - Completed: Emerald
  - On Hold: Amber
- **Trip Quests**: Purple (from SuperTrip)

## Data Models

> See [`types/index.ts`](../types/index.ts) for type definitions:
> - `Quest`, `QuestForm` (lines 621-643)
> - `QuestStatus`, `QUEST_STATUSES` (lines 619, 645-650)
> - `SubQuest`, `SubQuestForm` (after Quest types)

## Firestore Structure

> See [`firestore.rules`](../firestore.rules) for security rules covering:
> - `quests/{questId}` collection
> - `subquests/{subquestId}` collection

## Components

| Component | Path | Description |
|-----------|------|-------------|
| QuestCard | `components/quest/QuestCard.vue` | Quest card with NuxtLink to detail page |
| QuestForm | `components/quest/QuestForm.vue` | Create/edit quest form |
| QuestGrid | `components/quest/QuestGrid.vue` | Grid of quest and trip cards |
| QuestProgress | `components/quest/QuestProgress.vue` | SVG circular progress indicator |
| SubQuestCard | `components/quest/SubQuestCard.vue` | Sub-quest display card (green) |
| SubQuestForm | `components/quest/SubQuestForm.vue` | Create/edit sub-quest form |
| SubQuestList | `components/quest/SubQuestList.vue` | Sub-quest grid with empty state |
| TripQuestCard | `components/quest/TripQuestCard.vue` | Trip displayed as quest (purple) |

## Composables

| Composable | Path | Description |
|------------|------|-------------|
| useQuests | `composables/useQuests.ts` | Quest CRUD operations |
| useSubquests | `composables/useSubquests.ts` | Sub-quest CRUD operations |

## Pages

| Page | Path | Description |
|------|------|-------------|
| Quests Dashboard | `pages/quest/index.vue` | Quests list with trip integration |
| Quest Detail | `pages/quest/[questId]/index.vue` | Quest detail with sub-quests and progress |

## Integration with SuperTrip

The QuestGrid component fetches both:
1. Native quests from the `quests` collection
2. Trips from the `trips` collection (via `useTrips`)

Trips are displayed alongside quests but with distinct styling:
- **Native Quests**: Green gradient, target icon
- **Trip Quests**: Purple gradient, plane icon, "SuperTrip" badge

When a user clicks on a trip quest card, they are navigated to `/trip/{tripId}` to view the trip in SuperTrip.
