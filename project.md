# SuperWish - Wishlist Manager

A modern, minimal wishlist management application built with Nuxt 3, Firebase, and Tailwind CSS.

## Overview

SuperWish helps users organize their wishlists with features like price tracking, priority management, and status workflows. Users can create multiple wishlists, add wishes with detailed information, track prices from different stores, and monitor their purchases through delivery.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Nuxt 3** | Vue.js framework with SSR/SPA support |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **Firebase Auth** | Google Sign-In authentication |
| **Firestore** | NoSQL database for data storage |
| **Firebase Hosting** | Static site deployment |
| **pnpm** | Package manager |

## Features

### Authentication
- Google Sign-In via Firebase Auth
- Protected routes with middleware
- User profile display in header
- Automatic user document creation in Firestore

### Wishlists Management
- Create, edit, and delete wishlists
- Optional deadline with date picker
- Optional location field (e.g., "Amazon", "Local Store")
- Card-based grid layout on dashboard
- Real-time updates via Firestore snapshots

### Wishes Management
- Full CRUD operations for wishes
- Image preview from URL
- Multiple shopping links with labels
- Priority system (1-5 stars)
- Status workflow: Wanted → Purchased → Shipping → Delivered → Gifted
- "For Person" field to track gift recipients
- Shipping tracking with URL and estimated delivery date

### Price Comparison
- **Target Price**: Set the price you want to pay
- **Price Sources**: Track prices from multiple stores
  - Store name
  - Price with currency
  - Optional product URL
- **Smart Display**: Shows best price vs target
- **Good Deal Badge**: Visual indicator when best price ≤ target price

### UI/UX
- Minimal, clean aesthetic with soft teal accent color
- DM Sans typography
- Responsive grid layouts
- Smooth transitions and hover states
- Loading skeletons and empty states
- Modal-based forms

## Project Structure

```
superwish/
├── app.vue                    # Root component
├── nuxt.config.ts             # Nuxt configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── firebase.json              # Firebase Hosting configuration
├── .firebaserc                # Firebase project settings
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
│
├── pages/
│   ├── index.vue              # Landing/login page
│   ├── dashboard.vue          # Main wishlist dashboard
│   └── list/
│       └── [id].vue           # Individual list view
│
├── components/
│   ├── auth/
│   │   └── GoogleSignIn.vue   # Google Sign-In button
│   ├── lists/
│   │   ├── ListCard.vue       # Wishlist card component
│   │   ├── ListForm.vue       # Create/edit list form
│   │   └── ListGrid.vue       # Grid of list cards
│   ├── wishes/
│   │   ├── WishCard.vue       # Wish card with price comparison
│   │   ├── WishForm.vue       # Create/edit wish form
│   │   ├── WishStatusBadge.vue # Status indicator badge
│   │   └── WishMoveModal.vue  # Move wish between lists
│   └── ui/
│       ├── Button.vue         # Reusable button component
│       ├── Input.vue          # Form input component
│       ├── Textarea.vue       # Textarea component
│       ├── Select.vue         # Dropdown select component
│       └── Modal.vue          # Modal dialog component
│
├── composables/
│   ├── useAuth.ts             # Authentication state & methods
│   ├── useLists.ts            # Wishlist CRUD operations
│   └── useWishes.ts           # Wish CRUD operations
│
├── plugins/
│   └── firebase.client.ts     # Firebase initialization (client-only)
│
├── middleware/
│   └── auth.ts                # Route protection middleware
│
├── layouts/
│   ├── default.vue            # Basic layout (login page)
│   └── app.vue                # App layout with header
│
└── types/
    └── index.ts               # TypeScript interfaces & utilities
```

## Data Models

### User
```typescript
interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Timestamp
}
```

### WishList
```typescript
interface WishList {
  id: string
  userId: string
  name: string
  description?: string
  deadline?: Date | null
  location?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Wish
```typescript
interface Wish {
  id: string
  listId: string
  userId: string
  title: string
  description?: string
  imageUrl?: string
  shoppingLinks: ShoppingLink[]
  expectedPrice?: number
  targetPrice?: number
  priceSources: PriceSource[]
  currency: string
  priority: Priority  // 1-5
  status: WishStatus  // wanted | purchased | shipping | delivered | gifted
  trackingUrl?: string
  estimatedDelivery?: Date | null
  forPerson?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### PriceSource
```typescript
interface PriceSource {
  storeName: string
  price: number
  currency: string
  url?: string
}
```

## Firestore Structure

```
firestore/
├── users/
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       └── createdAt: timestamp
│
├── lists/
│   └── {listId}/
│       ├── userId: string (indexed)
│       ├── name: string
│       ├── description: string
│       ├── deadline: timestamp
│       ├── location: string
│       ├── createdAt: timestamp (indexed)
│       └── updatedAt: timestamp
│
└── wishes/
    └── {wishId}/
        ├── listId: string (indexed)
        ├── userId: string (indexed)
        ├── title: string
        ├── description: string
        ├── imageUrl: string
        ├── shoppingLinks: array
        ├── expectedPrice: number
        ├── targetPrice: number
        ├── priceSources: array
        ├── currency: string
        ├── priority: number (indexed)
        ├── status: string
        ├── trackingUrl: string
        ├── estimatedDelivery: timestamp
        ├── forPerson: string
        ├── createdAt: timestamp (indexed)
        └── updatedAt: timestamp
```

## Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Lists - users can only access their own lists
    match /lists/{listId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // Wishes - users can only access wishes in their own lists
    match /wishes/{wishId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Required Firestore Indexes

Create these composite indexes in Firebase Console:

1. **lists** collection:
   - `userId` (Ascending) + `createdAt` (Descending)

2. **wishes** collection:
   - `listId` (Ascending) + `userId` (Ascending) + `priority` (Descending) + `createdAt` (Descending)

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

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- Firebase project with Auth and Firestore enabled

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Generate static site
pnpm generate
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Google Sign-In in Authentication → Sign-in method
3. Create a Firestore database
4. Add your web app and copy the config to `.env`
5. Set up security rules (see above)
6. Create required indexes

### Deployment

```bash
# Generate static site
pnpm generate

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

The app will be available at: `https://your-project.web.app`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production (SSR) |
| `pnpm generate` | Generate static site (SPA) |
| `pnpm preview` | Preview production build |

## Design System

### Colors
- **Accent**: Teal (#14b8a6 - accent-500)
- **Gray Scale**: Neutral grays for text and backgrounds
- **Status Colors**:
  - Wanted: Gray
  - Purchased: Blue
  - Shipping: Amber
  - Delivered: Green
  - Gifted: Purple

### Typography
- **Font**: DM Sans (Google Fonts)
- **Weights**: 400-700

### Spacing & Borders
- Border radius: 12px (rounded-xl), 16px (rounded-2xl)
- Shadows: Soft shadows for cards
- Generous whitespace

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private project - All rights reserved.
