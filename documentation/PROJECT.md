# SuperX - Personal Life Manager

A modern, minimal personal life management application built with Nuxt 3, Firebase, and Tailwind CSS. SuperX combines four integrated modules:

| Module | Description | Documentation |
|--------|-------------|---------------|
| **SuperWish** | Wishlist management with price tracking | [SUPERWISH.md](./SUPERWISH.md) |
| **SuperTrip** | Travel planning with itineraries | [SUPERTRIP.md](./SUPERTRIP.md) |
| **SuperQuest** | Goal and project tracking | [SUPERQUEST.md](./SUPERQUEST.md) |
| **SuperTask** | Task management across quests and trips | [SUPERTASK.md](./SUPERTASK.md) |
| **SuperXP** | Experience management across trips and standalone | [SUPERXP.md](./SUPERXP.md) |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Nuxt 3** (3.14.0) | Vue.js framework with SSR/SPA support |
| **Vue 3** (3.5.0) | Reactive UI framework |
| **TypeScript** (5.6.0) | Type-safe development |
| **Tailwind CSS** (3.4.0) | Utility-first styling |
| **Firebase Auth** | Google Sign-In authentication |
| **Firestore** | NoSQL database for data storage |
| **Firebase Storage** | File/image storage |
| **Firebase Hosting** | Static site deployment |
| **Firebase Cloud Functions** | Serverless backend for product search |
| **@nuxtjs/i18n** (10.2.1) | Internationalization (English, Portuguese) |
| **@vueuse/core** (14.1.0) | Vue composition utilities |
| **SerpAPI** | Google Shopping product search API |
| **pnpm** | Package manager |

## Project Structure

```
superwish/
├── app.vue                    # Root component
├── nuxt.config.ts             # Nuxt configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── firebase.json              # Firebase Hosting + Functions configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Composite index definitions
├── storage.rules              # Firebase Storage security rules
├── .firebaserc                # Firebase project settings
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
│
├── functions/                 # Firebase Cloud Functions
│   ├── package.json           # Functions dependencies
│   ├── tsconfig.json          # Functions TypeScript config
│   └── src/
│       └── index.ts           # searchProducts Cloud Function (SerpAPI)
│
├── pages/
│   ├── index.vue              # Landing/App selector page
│   ├── settings.vue           # User settings
│   ├── wish/                  # SuperWish pages
│   ├── trip/                  # SuperTrip pages
│   ├── quest/                 # SuperQuest pages
│   └── task/                  # SuperTask pages
│
├── components/
│   ├── auth/                  # Authentication components
│   ├── navigation/            # Navigation components
│   ├── lists/                 # SuperWish list components
│   ├── wishes/                # SuperWish wish components
│   ├── trip/                  # SuperTrip components
│   ├── quest/                 # SuperQuest components
│   ├── task/                  # SuperTask components
│   └── ui/                    # Shared UI components
│
├── composables/               # Vue composables
├── plugins/                   # Nuxt plugins
├── middleware/                # Route middleware
├── layouts/                   # Page layouts
├── i18n/                      # Internationalization
├── types/                     # TypeScript definitions
│
└── documentation/
    ├── PROJECT.md             # This file
    ├── SUPERWISH.md           # SuperWish documentation
    ├── SUPERTRIP.md           # SuperTrip documentation
    ├── SUPERQUEST.md          # SuperQuest documentation
    └── CREATENEWAPP.md        # Guide for adding new apps
```

## Shared Features

### Authentication
- Google Sign-In via Firebase Auth
- Protected routes with middleware
- User profile display in sidebar
- Automatic user document creation in Firestore
- Default region preferences per user

### Internationalization
- English (en) - Default
- Portuguese Brazilian (pt-BR)
- Browser language detection
- Cookie-based persistence
- Complete translation coverage

### UI/UX
- Minimal, clean aesthetic with module-specific accent colors
- DM Sans typography
- Responsive design with sidebar navigation
- Mobile-friendly with collapsible sidebar
- Module switcher between SuperWish, SuperTrip, SuperQuest, SuperTask
- Theme-aware components that adapt colors based on active module
- Smooth transitions and hover states
- Loading skeletons and empty states
- Modal-based forms
- Image upload with compression

### Nuxt Component Auto-Import Naming

Nuxt auto-imports components using the folder path as a prefix. **When the filename already starts with the folder name, Nuxt deduplicates the prefix.** This is critical to get right:

| File path | Resolved component name |
|-----------|------------------------|
| `components/ui/Button.vue` | `<UiButton>` |
| `components/quest/SubQuestList.vue` | `<QuestSubQuestList>` |
| `components/quest/QuestCard.vue` | `<QuestCard>` (NOT `<QuestQuestCard>`) |
| `components/task/TaskList.vue` | `<TaskList>` (NOT `<TaskTaskList>`) |
| `components/trip/trips/TripForm.vue` | `<TripTripsTripForm>` (nested folders) |

**Rule**: If the filename starts with the folder name (e.g. `task/TaskList.vue`), the folder prefix is NOT added again. Use `<TaskList>`, not `<TaskTaskList>`.

## Shared Composables

| Composable | Path | Description |
|------------|------|-------------|
| useAuth | `composables/useAuth.ts` | Authentication state & methods |
| useAppContext | `composables/useAppContext.ts` | App-wide context, module switching & theming |
| useFileUpload | `composables/useFileUpload.ts` | File upload to Storage |
| useImageUpload | `composables/useImageUpload.ts` | Image upload with compression |
| useUrlMetadata | `composables/useUrlMetadata.ts` | URL metadata extraction |
| useDynamicHead | `composables/useDynamicHead.ts` | Dynamic page head management |
| useSubquests | `composables/useSubquests.ts` | Sub-quest CRUD operations (SuperQuest) |
| useTasks | `composables/useTasks.ts` | Task CRUD operations (SuperTask) |

## Shared UI Components

| Component | Path | Description |
|-----------|------|-------------|
| Button | `components/ui/Button.vue` | Reusable button component |
| Input | `components/ui/Input.vue` | Form input component |
| Textarea | `components/ui/Textarea.vue` | Textarea component |
| Select | `components/ui/Select.vue` | Dropdown select component |
| Modal | `components/ui/Modal.vue` | Modal dialog component |
| Autocomplete | `components/ui/Autocomplete.vue` | Autocomplete input |
| ImageUpload | `components/ui/ImageUpload.vue` | Image upload component |

## Firebase Security Rules

> See [`firestore.rules`](../firestore.rules) for the complete Firestore security rules.

## Environment Variables

Create a `.env` file with your Firebase configuration:

```env
NUXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NUXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### SerpAPI (Product Search)

The product search feature uses [SerpAPI](https://serpapi.com/) to query Google Shopping. The API key is stored as a Firebase secret (not in `.env`).

- **Dashboard**: https://serpapi.com/searches
- **Setup**: `firebase functions:secrets:set SERPAPI_KEY`
- **Free tier**: 100 searches/month

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

```bash
# Install dependencies
pnpm install

# Start development server (with Firebase Functions emulator)
pnpm dev

# Or start just Nuxt (without functions emulator)
pnpm dev:nuxt

# Build for production
pnpm build

# Generate static site
pnpm generate
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Google Sign-In in Authentication → Sign-in method
3. Create a Firestore database
4. Enable Firebase Storage
5. Add your web app and copy the config to `.env`
6. Set up security rules (see above)
7. Create required indexes

### Cloud Functions Setup

```bash
# Install functions dependencies
cd functions && npm install

# Set SerpAPI secret
firebase functions:secrets:set SERPAPI_KEY

# Deploy functions
firebase deploy --only functions

# Test locally with emulator
cd functions && npm run serve
```

### Deployment

```bash
# Generate static site
pnpm generate

# Deploy everything (hosting + functions)
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions
```

The app will be available at: `https://your-project.web.app`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with Functions emulator |
| `pnpm dev:nuxt` | Start only Nuxt development server |
| `pnpm build` | Build for production (SSR) |
| `pnpm generate` | Generate static site (SPA) |
| `pnpm preview` | Preview production build |

## Design System

### Module Colors
Each app module has its own accent color:
- **SuperWish**: Teal (#14b8a6 - accent-500)
- **SuperTrip**: Purple (#a855f7 - purple-500)
- **SuperQuest**: Green (#22c55e - green-500)
- **SuperTask**: Orange (#f97316 - orange-500)

> **Adding a new app?** See [CREATENEWAPP.md](./CREATENEWAPP.md) for the complete guide.

### Typography
- **Font**: DM Sans (Google Fonts)
- **Weights**: 400-700

### Spacing & Borders
- Border radius: 12px (rounded-xl), 16px (rounded-2xl)
- Shadows: Soft shadows for cards
- Generous whitespace

### Icons
- Icon collections: Lucide, SVG Spinners, Simple Icons
- Via @nuxt/icon module

## Information Hierarchy

All modules feed into SuperTask as the unified execution layer:

```
User
├── SuperWish
│   └── WishList
│       └── Wish ──[auto-creates]──> Task (wishId)
│
├── SuperTrip
│   └── Trip
│       ├── Destination ──────────> Task (destinationId)
│       │   ├── Accommodation ───> Task (accommodationId)
│       │   └── Experience ──────> Task (experienceId)
│       └── Transportation
│
├── SuperQuest
│   └── Quest ────────────────────> Task (questId)
│       └── SubQuest ────────────> Task (subQuestId)
│
└── SuperTask (unified execution layer)
    └── Task ← all items above flow here
        ├── Time horizon, due date, recurrence
        ├── Blocked-by dependencies
        └── Completion: manual OR wish-status-driven
```

- Wishes auto-create linked tasks on creation, auto-delete on deletion, and sync titles on update
- Existing wishes are backfilled with tasks on first SuperTask page load via `useWishTaskSync`
- Wish-linked tasks cannot be manually toggled (completion is tied to wish ownership status)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private project - All rights reserved.
