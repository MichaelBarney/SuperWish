# SuperWish - Wishlist Management

SuperWish is the wishlist management module of SuperX. It helps users organize wishlists with price tracking, priority management, and status workflows.

## Features

### Wishlists
- Create, edit, and delete wishlists
- Optional deadline with date picker
- Optional location field
- Custom cover images
- Card-based grid layout on dashboard
- Real-time updates via Firestore snapshots

### Wishes
- Full CRUD operations for wishes
- Image preview from URL or upload
- Multiple shopping links with labels
- Priority system (1-5 stars)
- Status workflow: Wanted → Owned → Shipping → Gifted
- "For Person" field to track gift recipients
- Shipping tracking with URL and estimated delivery date
- Custom preference questions

### Product Search
- Automatic product search via SerpAPI (Google Shopping)
- Firebase Cloud Function for secure server-side search
- Search results with image, price, store, and description
- Auto-fill wish details from search results
- Region-specific search (7 supported regions)

### Price Comparison
- Target price setting
- Multiple price sources from different stores
- Best price detection and display
- Good deal badge when best price ≤ target price
- Multi-currency support with conversion

## Color Scheme

- **Accent Color**: Teal (#14b8a6 - accent-500)
- **Status Colors**:
  - Wanted: Gray
  - Owned: Green
  - Shipping: Amber
  - Gifted: Purple

## Data Models

> See [`types/index.ts`](../types/index.ts) for type definitions:
> - `WishList`, `WishListForm` (lines 51-117)
> - `Wish`, `WishForm` (lines 88-134)
> - `ShoppingLink` (lines 63-66)
> - `PriceSource`, `PriceSourceForm` (lines 68-86)
> - `WishStatus`, `WISH_STATUSES` (lines 18-178)

## Firestore Structure

> See [`firestore.rules`](../firestore.rules) for security rules covering:
> - `lists/{listId}` collection (lines 21-25)
> - `wishes/{wishId}` collection (lines 27-31)

## Components

| Component | Path | Description |
|-----------|------|-------------|
| ListCard | `components/lists/ListCard.vue` | Wishlist card component |
| ListForm | `components/lists/ListForm.vue` | Create/edit list form |
| ListGrid | `components/lists/ListGrid.vue` | Grid of list cards |
| OwnedListCard | `components/lists/OwnedListCard.vue` | Card for owned items list |
| WishCard | `components/wishes/WishCard.vue` | Wish card with price comparison |
| WishForm | `components/wishes/WishForm.vue` | Create/edit wish form with product search |
| WishStatusBadge | `components/wishes/WishStatusBadge.vue` | Status indicator badge |
| WishMoveModal | `components/wishes/WishMoveModal.vue` | Move wish between lists |
| ProductSearchResults | `components/wishes/ProductSearchResults.vue` | Product search results panel |

## Composables

| Composable | Path | Description |
|------------|------|-------------|
| useLists | `composables/useLists.ts` | Wishlist CRUD operations |
| useWishes | `composables/useWishes.ts` | Wish CRUD operations |
| useProductSearch | `composables/useProductSearch.ts` | Product search via Cloud Function |

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `pages/wish/index.vue` | Wishlist dashboard |
| Owned | `pages/wish/owned.vue` | Owned items view |
| List Detail | `pages/wish/list/[id].vue` | Individual list view |

## Supported Regions

| Region | Currency | SerpAPI Domain |
|--------|----------|----------------|
| United States | USD ($) | google.com |
| Brasil | BRL (R$) | google.com.br |
| United Kingdom | GBP (£) | google.co.uk |
| Europe (Euro) | EUR (€) | google.de |
| Japan | JPY (¥) | google.co.jp |
| Canada | CAD (C$) | google.ca |
| Australia | AUD (A$) | google.com.au |
