import type { Timestamp } from 'firebase/firestore'

export type WishStatus = 'wanted' | 'purchased' | 'shipping' | 'delivered' | 'gifted'

export type Priority = 1 | 2 | 3 | 4 | 5

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  createdAt: Timestamp
  defaultCurrency?: string
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
}

export interface PriceSourceForm {
  storeName: string
  price: string  // string for form input
  currency: string
  url: string
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
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
] as const

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
  return CURRENCIES.find(c => c.code === code)?.symbol || code
}

export function getBestPrice(priceSources: PriceSource[]): PriceSource | null {
  if (!priceSources || priceSources.length === 0) return null
  return priceSources.reduce((best, current) =>
    current.price < best.price ? current : best
  )
}

export function createEmptyPriceSource(): PriceSourceForm {
  return {
    storeName: '',
    price: '',
    currency: 'USD',
    url: '',
  }
}
