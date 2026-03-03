# SuperTrip - Travel Planning

SuperTrip is the travel planning module of SuperX. It helps users plan trips with destinations, transportation, accommodations, and experiences.

## Features

### Trips
- Create and manage trips
- Origin city selection
- Start/end date range
- Base currency for budget tracking
- Status workflow: Planning → Upcoming → Active → Completed
- Cover images

### Destinations
- Multiple destinations per trip
- City autocomplete with country detection
- Arrival/departure dates
- Destination images (Unsplash integration)
- Ordering support

### Transportation
- Multiple transport types: Flight, Train, Bus, Car, Ferry, Other
- Carrier and flight/booking number tracking
- Departure and arrival locations with times
- Booking status: Planned → Booked → Confirmed → Cancelled
- Price tracking with currency conversion
- Document attachments (tickets, vouchers)
- Multiple booking links
- Seat information and notes

### Accommodations
- Multiple types: Hotel, Hostel, Airbnb, Apartment, Resort, Other
- Check-in/check-out dates
- Booking reference and URL
- Price per night and total price
- Room type and amenities
- Linked to destinations

### Experiences
- Categories: Restaurant, Attraction, Museum, Outdoor, Activity, Nightlife, Shopping, Other
- Status: Wishlist → Booked → Completed → Skipped
- Scheduled date and time
- Duration tracking
- Cost estimation and actual cost
- Rating system
- Linked to destinations

### Budget
- Total trip budget
- Category allocations (transportation, accommodation, food, activities, shopping, other)
- Planned vs actual spending tracking
- Currency conversion for all expenses

### Timeline/Itinerary
- Visual timeline of all trip events
- Includes: transportation, check-ins/outs, experiences, arrivals/departures
- Chronological ordering

### PDF Itinerary Export
- Export a printable day-by-day itinerary as an A4 PDF
- Includes trip header (name, dates, budget, origin), per-destination sections, and day-by-day tables
- Each table shows time, type, name, and full details for experiences, accommodations, and transportations
- Mirrors the `DayTimeline.vue` grouping algorithm (date buckets, sort by time, unscheduled section)
- Between-destination transportation segments shown between sections
- Experiences fetched on-demand via parallel one-shot Firestore `getDocs` queries
- jsPDF + jspdf-autotable are dynamically imported to avoid bloating the initial bundle
- Fully localized (EN / PT-BR) via `travel.pdf.*` i18n keys

## Color Scheme

- **Accent Color**: Purple (#a855f7 - purple-500)
- **Status Colors**:
  - Planning: Gray
  - Upcoming: Blue
  - Active: Green
  - Completed: Purple

## Data Models

> See [`types/index.ts`](../types/index.ts) for type definitions:
> - `Trip`, `TripForm`, `TripOrigin` (lines 227-262)
> - `Destination`, `DestinationForm` (lines 264-289)
> - `Transportation`, `TransportationForm`, `TransportationDocument`, `TransportationLink` (lines 291-370)
> - `Accommodation`, `AccommodationForm` (lines 372-415)
> - `Experience`, `ExperienceForm` (lines 417-464)
> - `TripStatus`, `TransportType`, `BookingStatus`, `AccommodationType`, `ExperienceCategory`, `ExperienceStatus` (lines 218-224)
> - Status constants: `TRIP_STATUSES`, `TRANSPORT_TYPES`, `BOOKING_STATUSES`, etc. (lines 538-600)

## Firestore Structure

> See [`firestore.rules`](../firestore.rules) for security rules covering:
> - `trips/{tripId}` collection (lines 33-37)
> - `destinations/{destinationId}` collection (lines 39-43)
> - `transportations/{transportationId}` collection (lines 45-49)

## Components

| Component | Path | Description |
|-----------|------|-------------|
| TripCard | `components/trip/trips/TripCard.vue` | Trip card component |
| TripForm | `components/trip/trips/TripForm.vue` | Create/edit trip form |
| TripGrid | `components/trip/trips/TripGrid.vue` | Grid of trip cards |
| CityAutocomplete | `components/trip/destinations/CityAutocomplete.vue` | City autocomplete input |
| DestinationForm | `components/trip/destinations/DestinationForm.vue` | Destination form |
| TransportationCard | `components/trip/transportation/Card.vue` | Transportation card |
| TransportationForm | `components/trip/transportation/Form.vue` | Transportation form |
| LinkInput | `components/trip/transportation/LinkInput.vue` | Booking link input |
| DocumentUpload | `components/trip/transportation/DocumentUpload.vue` | Document upload |
| ItineraryPoint | `components/trip/itinerary/Point.vue` | Timeline point |
| AddMenu | `components/trip/itinerary/AddMenu.vue` | Add item menu |

## Composables

| Composable | Path | Description |
|------------|------|-------------|
| useTrips | `composables/useTrips.ts` | Trip CRUD operations |
| useDestinations | `composables/useDestinations.ts` | Destination management |
| useTransportation | `composables/useTransportation.ts` | Transportation management |
| useCityAutocomplete | `composables/useCityAutocomplete.ts` | City autocomplete logic |
| useCityImage | `composables/useCityImage.ts` | City image fetching (Unsplash) |
| useCurrencyConversion | `composables/useCurrencyConversion.ts` | Currency conversion |
| useTripPdfExport | `composables/useTripPdfExport.ts` | PDF itinerary export (fetches experiences, builds PDF) |

## Utilities

| Utility | Path | Description |
|---------|------|-------------|
| tripPdfBuilder | `utils/tripPdfBuilder.ts` | Pure function that builds the PDF document from resolved trip data |

## Pages

| Page | Path | Description |
|------|------|-------------|
| Trips Dashboard | `pages/trip/index.vue` | Trips list |
| Trip Detail | `pages/trip/[tripId]/index.vue` | Individual trip view with itinerary |
