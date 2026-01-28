<template>
  <div class="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden group">
    <!-- Image Section -->
    <div class="relative aspect-[4/3] bg-gray-100 overflow-hidden">
      <img
        v-if="wish.imageUrl"
        :src="wish.imageUrl"
        :alt="wish.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        @error="handleImageError"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Priority Stars -->
      <div class="absolute top-3 left-3 flex gap-0.5">
        <svg
          v-for="i in 5"
          :key="i"
          class="w-4 h-4"
          :class="i <= wish.priority ? 'text-amber-400' : 'text-white/40'"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>

      <!-- Status Badge -->
      <div class="absolute top-3 right-3">
        <WishesWishStatusBadge :status="wish.status" :since-text="sinceText" />
      </div>

      <!-- Good Deal Badge -->
      <div v-if="isGoodDeal" class="absolute bottom-3 left-3">
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow-sm">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          {{ $t('wishes.card.goodDeal') }}
        </span>
      </div>

      <!-- Action Buttons (on hover) -->
      <div class="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          @click.stop="$emit('edit', wish)"
          class="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click.stop="$emit('move', wish)"
          class="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
        <button
          @click.stop="$emit('delete', wish)"
          class="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 transition-colors"
        >
          <svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content Section -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 truncate mb-1">{{ wish.title }}</h3>

      <p v-if="wish.description" class="text-sm text-gray-500 line-clamp-2 mb-3">
        {{ wish.description }}
      </p>

      <!-- Price Comparison Section -->
      <div v-if="hasAnyPriceInfo" class="space-y-2 mb-3">
        <!-- Target Price -->
        <div v-if="wish.targetPrice" class="flex items-center justify-between">
          <span class="text-xs text-gray-500">{{ $t('wishes.card.target') }}</span>
          <span class="text-sm font-medium text-gray-700">
            {{ getCurrencySymbol(wish.currency) }}{{ formatPrice(wish.targetPrice) }}
          </span>
        </div>

        <!-- Best Price -->
        <div v-if="bestPrice" class="flex items-center justify-between">
          <span class="text-xs text-gray-500">{{ $t('wishes.card.best') }}</span>
          <div class="flex items-center gap-2">
            <img
              v-if="bestPrice.imageUrl"
              :src="bestPrice.imageUrl"
              :alt="bestPrice.storeName"
              class="w-6 h-6 rounded object-cover flex-shrink-0"
              @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
            />
            <span :class="[
              'text-lg font-semibold',
              isGoodDeal ? 'text-green-600' : 'text-accent-600'
            ]">
              {{ getCurrencySymbol(bestPrice.currency) }}{{ formatPrice(bestPrice.price) }}
            </span>
            <a
              v-if="bestPrice.url"
              :href="bestPrice.url"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
              class="text-xs text-accent-500 hover:text-accent-600 hover:underline"
            >
              {{ bestPrice.storeName }}
            </a>
            <span v-else class="text-xs text-gray-400">
              {{ bestPrice.storeName }}
            </span>
          </div>
        </div>

        <!-- Price Sources Count -->
        <div v-if="wish.priceSources && wish.priceSources.length > 1" class="flex items-center gap-1.5 text-xs text-gray-400">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {{ $t('wishes.card.sourcesTracked', { count: wish.priceSources.length }) }}
        </div>
      </div>

      <!-- Legacy Price (fallback if no price sources) -->
      <div v-else-if="wish.expectedPrice" class="flex items-center justify-between mb-3">
        <span class="text-lg font-semibold text-accent-600">
          {{ getCurrencySymbol(wish.currency) }}{{ formatPrice(wish.expectedPrice) }}
        </span>
      </div>

      <!-- For Person Badge -->
      <div v-if="wish.forPerson" class="mb-3">
        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {{ $t('common.for', { person: wish.forPerson }) }}
        </span>
      </div>

      <!-- Shopping Links -->
      <div v-if="wish.shoppingLinks && wish.shoppingLinks.length > 0" class="flex flex-wrap gap-2">
        <a
          v-for="(link, index) in wish.shoppingLinks.slice(0, 2)"
          :key="index"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
          class="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 hover:underline"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          {{ link.label || getLinkDomain(link.url) }}
        </a>
        <span v-if="wish.shoppingLinks.length > 2" class="text-xs text-gray-400">
          {{ $t('common.more', { count: wish.shoppingLinks.length - 2 }) }}
        </span>
      </div>

      <!-- Tracking Info -->
      <div v-if="wish.status === 'shipping' && (wish.trackingUrl || wish.estimatedDelivery)" class="mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span v-if="wish.estimatedDelivery">
            {{ $t('wishes.card.arriving', { date: formatDate(wish.estimatedDelivery) }) }}
          </span>
          <a
            v-if="wish.trackingUrl"
            :href="wish.trackingUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-accent-600 hover:underline"
            @click.stop
          >
            {{ $t('wishes.card.trackPackage') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Wish, PriceSource } from '~/types'
import { getCurrencySymbol, getBestPrice } from '~/types'
import type { Timestamp } from 'firebase/firestore'

interface Props {
  wish: Wish
}

const props = defineProps<Props>()
const { t, locale } = useI18n()

// Compute time since added for "wanted" status (returns "since X" format)
const sinceText = computed(() => {
  if (props.wish.status !== 'wanted' || !props.wish.createdAt) return undefined

  const createdDate = props.wish.createdAt instanceof Date
    ? props.wish.createdAt
    : (props.wish.createdAt as Timestamp).toDate()

  const now = new Date()
  const diffMs = now.getTime() - createdDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('time.sinceToday')
  if (diffDays === 1) return t('time.sinceYesterday')
  if (diffDays < 7) return t('time.forDays', diffDays)
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return t('time.forWeeks', weeks)
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return t('time.forMonths', months)
  }
  const years = Math.floor(diffDays / 365)
  return t('time.forYears', years)
})

defineEmits<{
  edit: [wish: Wish]
  delete: [wish: Wish]
  move: [wish: Wish]
}>()

// Computed properties for price comparison
const bestPrice = computed((): PriceSource | null => {
  return getBestPrice(props.wish.priceSources || [])
})

const hasAnyPriceInfo = computed(() => {
  return props.wish.targetPrice || (props.wish.priceSources && props.wish.priceSources.length > 0)
})

const isGoodDeal = computed(() => {
  if (!props.wish.targetPrice || !bestPrice.value) return false
  return bestPrice.value.price <= props.wish.targetPrice
})

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

function formatPrice(price: number): string {
  return price.toLocaleString(locale.value === 'pt-BR' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getLinkDomain(url: string): string {
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0]
  } catch {
    return 'Link'
  }
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
}
</script>
