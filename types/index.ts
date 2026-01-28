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
