import type { Timestamp } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import type { Functions } from 'firebase/functions'

declare module '#app' {
  interface NuxtApp {
    $firebase: FirebaseApp
    $auth: Auth
    $db: Firestore
    $storage: FirebaseStorage
    $functions: Functions
  }
}

export type WishStatus = 'wanted' | 'purchased' | 'shipping' | 'delivered' | 'gifted'

export interface WishQuestion {
  questionKey: string  // i18n key for the question
  answer: string
}

export type Priority = 1 | 2 | 3 | 4 | 5

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Timestamp
  defaultRegion?: string
}

export interface WishList {
  id: string
  userId: string
  name: string
  description?: string
  deadline?: Date | null
  location?: string
  coverUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ShoppingLink {
  url: string
  label?: string
}

export interface PriceSource {
  storeName: string
  price: number
  currency: string
  url?: string
  description?: string
  imageUrl?: string
  searchedAt?: Date | null
}

export interface PriceSourceForm {
  storeName: string
  price: string  // string for form input
  currency: string
  url: string
  description: string
  imageUrl: string
  searchedAt: string // ISO date string or empty
}

export interface Wish {
  id: string
  listId?: string | null
  userId: string
  title: string
  description?: string
  imageUrl?: string
  shoppingLinks: ShoppingLink[]
  expectedPrice?: number
  targetPrice?: number
  priceSources: PriceSource[]
  currency: string
  priority: Priority
  status: WishStatus
  trackingUrl?: string
  estimatedDelivery?: Date | null
  forPerson?: string
  questions?: WishQuestion[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Form types (without Firestore-specific fields)
export interface WishListForm {
  name: string
  description: string
  deadline: string // ISO date string for form input
  location: string
  coverUrl: string
}

export interface WishForm {
  title: string
  description: string
  imageUrl: string
  shoppingLinks: ShoppingLink[]
  expectedPrice: string // string for form input (legacy, kept for compatibility)
  targetPrice: string   // string for form input
  priceSources: PriceSourceForm[]
  currency: string
  priority: Priority
  status: WishStatus
  trackingUrl: string
  estimatedDelivery: string // ISO date string for form input
  forPerson: string
  questions: WishQuestion[]
}

export interface Region {
  code: string
  name: string
  currency: { code: string; symbol: string }
  serpApi: {
    gl: string
    hl: string
    location: string
    domain: string
  }
}

export const REGIONS: Region[] = [
  { code: 'US', name: 'United States', currency: { code: 'USD', symbol: '$' }, serpApi: { gl: 'us', hl: 'en', location: 'New York, United States', domain: 'google.com' } },
  { code: 'BR', name: 'Brasil', currency: { code: 'BRL', symbol: 'R$' }, serpApi: { gl: 'br', hl: 'pt', location: 'Sao Paulo, Brazil', domain: 'google.com.br' } },
  { code: 'GB', name: 'United Kingdom', currency: { code: 'GBP', symbol: '£' }, serpApi: { gl: 'uk', hl: 'en', location: 'London, United Kingdom', domain: 'google.co.uk' } },
  { code: 'EU', name: 'Europe (Euro)', currency: { code: 'EUR', symbol: '€' }, serpApi: { gl: 'de', hl: 'en', location: 'Berlin, Germany', domain: 'google.de' } },
  { code: 'JP', name: 'Japan', currency: { code: 'JPY', symbol: '¥' }, serpApi: { gl: 'jp', hl: 'ja', location: 'Tokyo, Japan', domain: 'google.co.jp' } },
  { code: 'CA', name: 'Canada', currency: { code: 'CAD', symbol: 'C$' }, serpApi: { gl: 'ca', hl: 'en', location: 'Toronto, Canada', domain: 'google.ca' } },
  { code: 'AU', name: 'Australia', currency: { code: 'AUD', symbol: 'A$' }, serpApi: { gl: 'au', hl: 'en', location: 'Sydney, Australia', domain: 'google.com.au' } },
]

export const CURRENCIES = REGIONS.map(r => ({ code: r.currency.code, symbol: r.currency.symbol, name: r.name })) as readonly { code: string; symbol: string; name: string }[]

export function getRegion(code: string): Region {
  return REGIONS.find(r => r.code === code) || REGIONS[0]
}

export function getRegionCurrency(regionCode: string): string {
  return getRegion(regionCode).currency.code
}

export const WISH_STATUSES: { value: WishStatus; label: string; color: string }[] = [
  { value: 'wanted', label: 'Wanted', color: 'gray' },
  { value: 'purchased', label: 'Purchased', color: 'blue' },
  { value: 'shipping', label: 'Shipping', color: 'amber' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'gifted', label: 'Gifted', color: 'purple' },
]

export function getStatusConfig(status: WishStatus) {
  return WISH_STATUSES.find(s => s.value === status) || WISH_STATUSES[0]
}

export function getCurrencySymbol(code: string): string {
  const region = REGIONS.find(r => r.currency.code === code)
  return region?.currency.symbol || code
}

export function getBestPrice(priceSources: PriceSource[]): PriceSource | null {
  if (!priceSources || priceSources.length === 0) return null
  return priceSources.reduce((best, current) =>
    current.price < best.price ? current : best
  )
}

export interface ProductSearchResult {
  title: string
  price: number | null
  currency: string
  imageUrl: string
  link: string
  storeName: string
  snippet: string
}

export function createEmptyPriceSource(): PriceSourceForm {
  return {
    storeName: '',
    price: '',
    currency: 'USD',
    url: '',
    description: '',
    imageUrl: '',
    searchedAt: '',
  }
}

// =============================================
// TRAVEL TYPES (SuperTravel)
// =============================================

export type TripStatus = 'planning' | 'upcoming' | 'active' | 'completed'
export type TransportType = 'flight' | 'train' | 'bus' | 'car' | 'ferry' | 'other'
export type BookingStatus = 'planned' | 'booked' | 'confirmed' | 'cancelled'
export type AccommodationType = 'hotel' | 'hostel' | 'airbnb' | 'apartment' | 'resort' | 'other'
export type ExperienceCategory = 'restaurant' | 'attraction' | 'museum' | 'outdoor' | 'activity' | 'nightlife' | 'shopping' | 'other'
export type ExperienceStatus = 'wishlist' | 'booked' | 'completed' | 'skipped'
export type BudgetCategory = 'transportation' | 'accommodation' | 'food' | 'activities' | 'shopping' | 'other'

// Trip Origin (Starting point)
export interface TripOrigin {
  name: string
  country: string
  countryCode?: string
}

// Trip (Container)
export interface Trip {
  id: string
  userId: string
  name: string
  description?: string
  coverUrl?: string
  startDate?: Date | null
  endDate?: Date | null
  baseCurrency: string
  totalBudget?: number
  status: TripStatus
  origin?: TripOrigin
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TripForm {
  name: string
  description: string
  coverUrl: string
  startDate: string
  endDate: string
  baseCurrency: string
  totalBudget: string
  status: TripStatus
  originName: string
  originCountry: string
  originCountryCode: string
}

// Destination
export interface Destination {
  id: string
  tripId: string
  userId: string
  name: string
  country: string
  countryCode?: string
  arrivalDate?: Date | null
  departureDate?: Date | null
  notes?: string
  imageUrl?: string
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DestinationForm {
  name: string
  country: string
  countryCode: string
  arrivalDate: string
  departureDate: string
  notes: string
  imageUrl: string
}

// Transportation Document (attachments like tickets, vouchers)
export interface TransportationDocument {
  id: string
  name: string
  type: 'pdf' | 'image' | 'other'
  url: string
  uploadedAt: Date
}

// Transportation Link (booking URLs)
export interface TransportationLink {
  id: string
  label: string
  url: string
}

// Transportation
export interface Transportation {
  id: string
  tripId: string
  userId: string
  type: TransportType
  carrier?: string
  flightNumber?: string
  fromDestinationId?: string | null  // null = from origin
  fromLocation: string
  departureDateTime: Date
  toDestinationId?: string | null    // null = to origin (return)
  toLocation: string
  arrivalDateTime: Date
  bookingStatus: BookingStatus
  bookingReference?: string
  price?: number
  currency: string
  convertedPrice?: number
  seatInfo?: string
  notes?: string
  documents?: TransportationDocument[]
  links?: TransportationLink[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TransportationForm {
  type: TransportType
  carrier: string
  flightNumber: string
  fromDestinationId: string
  fromLocation: string
  departureDateTime: string
  toDestinationId: string
  toLocation: string
  arrivalDateTime: string
  bookingStatus: BookingStatus
  bookingReference: string
  price: string
  currency: string
  seatInfo: string
  notes: string
  documents: TransportationDocument[]
  links: TransportationLink[]
}

export function createEmptyTransportationLink(): TransportationLink {
  return {
    id: crypto.randomUUID(),
    label: '',
    url: '',
  }
}

export function createEmptyTransportationDocument(): TransportationDocument {
  return {
    id: crypto.randomUUID(),
    name: '',
    type: 'other',
    url: '',
    uploadedAt: new Date(),
  }
}

// Accommodation
export interface Accommodation {
  id: string
  tripId: string
  userId: string
  destinationId: string
  type: AccommodationType
  name: string
  address?: string
  checkIn: Date
  checkOut: Date
  bookingStatus: BookingStatus
  bookingReference?: string
  bookingUrl?: string
  pricePerNight?: number
  totalPrice?: number
  currency: string
  convertedTotal?: number
  roomType?: string
  amenities?: string[]
  notes?: string
  imageUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface AccommodationForm {
  destinationId: string
  type: AccommodationType
  name: string
  address: string
  checkIn: string
  checkOut: string
  bookingStatus: BookingStatus
  bookingReference: string
  bookingUrl: string
  pricePerNight: string
  totalPrice: string
  currency: string
  roomType: string
  amenities: string[]
  notes: string
  imageUrl: string
}

// Experience
export interface Experience {
  id: string
  tripId: string
  userId: string
  destinationId: string
  category: ExperienceCategory
  name: string
  description?: string
  address?: string
  scheduledDate?: Date | null
  scheduledTime?: string
  duration?: number
  status: ExperienceStatus
  bookingReference?: string
  bookingUrl?: string
  estimatedCost?: number
  actualCost?: number
  currency: string
  convertedCost?: number
  rating?: number
  notes?: string
  imageUrl?: string
  externalUrl?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ExperienceForm {
  destinationId: string
  category: ExperienceCategory
  name: string
  description: string
  address: string
  scheduledDate: string
  scheduledTime: string
  duration: string
  status: ExperienceStatus
  bookingReference: string
  bookingUrl: string
  estimatedCost: string
  actualCost: string
  currency: string
  rating: string
  notes: string
  imageUrl: string
  externalUrl: string
}

// Budget
export interface BudgetAllocation {
  category: BudgetCategory
  plannedAmount: number
  percentage?: number
}

export interface BudgetSummary {
  totalBudget: number
  allocations: BudgetAllocation[]
  plannedSpending: {
    transportation: number
    accommodation: number
    food: number
    activities: number
    shopping: number
    other: number
    total: number
  }
  actualSpending: {
    transportation: number
    accommodation: number
    food: number
    activities: number
    shopping: number
    other: number
    total: number
  }
  remaining: number
  currency: string
}

// Timeline
export type TimelineItemType =
  | 'transportation'
  | 'accommodation-checkin'
  | 'accommodation-checkout'
  | 'experience'
  | 'destination-arrival'
  | 'destination-departure'

export interface TimelineItem {
  id: string
  type: TimelineItemType
  dateTime: Date
  title: string
  subtitle?: string
  location?: string
  destinationId?: string
  sourceId: string
  sourceType: 'transportation' | 'accommodation' | 'experience' | 'destination'
  metadata?: Record<string, unknown>
}

// Currency Conversion
export interface ExchangeRate {
  fromCurrency: string
  toCurrency: string
  rate: number
  fetchedAt: Date
}

export interface ConvertedAmount {
  originalAmount: number
  originalCurrency: string
  convertedAmount: number
  targetCurrency: string
  exchangeRate: number
  rateDate: Date
}

// Travel Constants
export const TRIP_STATUSES: { value: TripStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: 'gray' },
  { value: 'upcoming', label: 'Upcoming', color: 'blue' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'purple' },
]

export const TRANSPORT_TYPES: { value: TransportType; label: string }[] = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'bus', label: 'Bus' },
  { value: 'car', label: 'Car' },
  { value: 'ferry', label: 'Ferry' },
  { value: 'other', label: 'Other' },
]

export const ROUND_TRIP_ELIGIBLE_TYPES: TransportType[] = ['flight', 'train', 'bus', 'ferry']

export const BOOKING_STATUSES: { value: BookingStatus; label: string; color: string }[] = [
  { value: 'planned', label: 'Planned', color: 'gray' },
  { value: 'booked', label: 'Booked', color: 'blue' },
  { value: 'confirmed', label: 'Confirmed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
]

export const ACCOMMODATION_TYPES: { value: AccommodationType; label: string }[] = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'resort', label: 'Resort' },
  { value: 'other', label: 'Other' },
]

export const EXPERIENCE_CATEGORIES: { value: ExperienceCategory; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'museum', label: 'Museum' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'activity', label: 'Activity' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' },
]

export const EXPERIENCE_STATUSES: { value: ExperienceStatus; label: string; color: string }[] = [
  { value: 'wishlist', label: 'Wishlist', color: 'gray' },
  { value: 'booked', label: 'Booked', color: 'blue' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'skipped', label: 'Skipped', color: 'red' },
]

export function getTripStatusConfig(status: TripStatus) {
  return TRIP_STATUSES.find(s => s.value === status) || TRIP_STATUSES[0]
}

export function getBookingStatusConfig(status: BookingStatus) {
  return BOOKING_STATUSES.find(s => s.value === status) || BOOKING_STATUSES[0]
}

export function getExperienceStatusConfig(status: ExperienceStatus) {
  return EXPERIENCE_STATUSES.find(s => s.value === status) || EXPERIENCE_STATUSES[0]
}

// City Autocomplete Types
export interface City {
  name: string
  country: string
  countryCode: string
}

export interface CitySelection {
  name: string
  country: string
  countryCode: string
}
