# SuperXP Module

SuperXP is the experience management module of SuperX. It provides a unified view of all experiences (both trip-linked and standalone), grouped by category or location.

## Route

`/xp` — Main experiences page

## Color & Icon

- **Accent color**: Rose (`rose-500` = `#f43f5e`)
- **Icon**: `lucide:sparkles`

## Data Model

Experiences use the shared `Experience` interface from `types/index.ts`. Key fields for SuperXP:

| Field | Type | Description |
|-------|------|-------------|
| `tripId` | `string?` | Optional — set for trip-linked experiences |
| `destinationId` | `string?` | Optional — set for trip-linked experiences |
| `country` | `string?` | Denormalized from destination, or set directly for standalone |
| `city` | `string?` | Denormalized from destination, or set directly for standalone |
| `countryCode` | `string?` | ISO 2-letter country code for flag display |
| `category` | `ExperienceCategory` | restaurant, attraction, museum, outdoor, activity, nightlife, shopping, day_trip, event, other |
| `status` | `ExperienceStatus` | wishlist, booked, completed, skipped |

### Group By Preference

`XPGroupBy = 'type' | 'location'` — stored on `User.xpGroupBy`, persisted to Firestore and localStorage.

## Components

| Component | Path | Description |
|-----------|------|-------------|
| `XPExperienceCard` | `components/xp/XPExperienceCard.vue` | Card showing experience with category icon, status, optional location badge, and trip badge |
| `XPExperienceForm` | `components/xp/XPExperienceForm.vue` | Form for creating/editing experiences with city autocomplete for standalone; read-only trip info for linked |
| `XPGroupByType` | `components/xp/XPGroupByType.vue` | Groups experiences by category with collapsible sections |
| `XPGroupByLocation` | `components/xp/XPGroupByLocation.vue` | Groups experiences by country > city with collapsible sections |

## Composables

| Composable | Path | Description |
|------------|------|-------------|
| `useXPExperiences` | `composables/useXPExperiences.ts` | Queries ALL experiences for user, provides grouping helpers, CRUD operations |
| `useExperiences` | `composables/useExperiences.ts` | Existing per-destination composable (updated to write location fields) |

### useXPExperiences API

- `experiences` — All experiences (with resolved location from destinations for legacy data)
- `totalCount` — Total experience count
- `experiencesByCategory` — `Record<ExperienceCategory, Experience[]>`
- `experiencesByLocation` — `{ groups: LocationGroup[], noLocation: Experience[] }`
- `createExperience(data)` — Creates standalone experience
- `updateExperience(id, data)` — Updates experience
- `deleteExperience(id)` — Deletes experience

## Firestore Index

```json
{
  "collectionGroup": "experiences",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

## i18n Keys

All XP-specific keys are under the `xp.*` namespace in `i18n/locales/en.json` and `pt-BR.json`. Experience category/status labels reuse `travel.experiences.*` keys.
