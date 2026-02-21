<template>
  <div
    class="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden group"
    :class="compact ? 'w-48' : ''"
  >
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
        <Icon name="lucide:image" :class="compact ? 'w-8 h-8' : 'w-12 h-12'" class="text-gray-300" />
      </div>

      <!-- Priority Stars (hidden in compact mode) -->
      <div v-if="!compact" class="absolute top-3 left-3 flex gap-0.5">
        <Icon
          v-for="i in 5"
          :key="i"
          name="lucide:star"
          class="w-4 h-4"
          :class="i <= wish.priority ? 'text-amber-400 fill-amber-400' : 'text-white/40'"
        />
      </div>

      <!-- Status Badge -->
      <div :class="compact ? 'absolute top-2 right-2' : 'absolute top-3 right-3'">
        <WishesWishStatusBadge :status="wish.status" :since-text="sinceText" :estimated-delivery="wish.estimatedDelivery" />
      </div>

      <!-- Action Buttons (on hover) -->
      <div :class="compact ? 'absolute bottom-2 right-2 flex gap-1' : 'absolute bottom-3 right-3 flex gap-2'" class="opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          @click.stop="$emit('edit', wish)"
          :class="compact ? 'p-1.5' : 'p-2'"
          class="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
        >
          <Icon name="lucide:pencil" :class="compact ? 'w-3 h-3' : 'w-4 h-4'" class="text-gray-600" />
        </button>
        <button
          @click.stop="$emit('move', wish)"
          :class="compact ? 'p-1.5' : 'p-2'"
          class="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
        >
          <Icon name="lucide:move-horizontal" :class="compact ? 'w-3 h-3' : 'w-4 h-4'" class="text-gray-600" />
        </button>
        <button
          @click.stop="$emit('delete', wish)"
          :class="compact ? 'p-1.5' : 'p-2'"
          class="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 transition-colors"
        >
          <Icon name="lucide:trash-2" :class="compact ? 'w-3 h-3' : 'w-4 h-4'" class="text-red-500" />
        </button>
      </div>
    </div>

    <!-- Content Section -->
    <div :class="compact ? 'p-2' : 'p-4'">
      <h3 :class="compact ? 'text-sm font-medium' : 'font-semibold'" class="text-gray-900 truncate mb-1">{{ wish.title }}</h3>

      <!-- List Name Badge -->
      <div v-if="listName" class="flex items-center gap-1 text-xs text-gray-500" :class="compact ? 'mb-1' : 'mb-2'">
        <Icon name="lucide:list" class="w-3 h-3" />
        <span class="truncate">{{ listName }}</span>
      </div>

      <!-- Description (hidden in compact mode) -->
      <p v-if="!compact && wish.description" class="text-sm text-gray-500 line-clamp-2 mb-3">
        {{ wish.description }}
      </p>

      <!-- Price Comparison Section (hidden in compact mode) -->
      <template v-if="!compact">
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
              <span class="text-lg font-semibold text-accent-600">
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
            <Icon name="lucide:bar-chart-3" class="w-3.5 h-3.5" />
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
            <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
            {{ link.label || getLinkDomain(link.url) }}
          </a>
          <span v-if="wish.shoppingLinks.length > 2" class="text-xs text-gray-400">
            {{ $t('common.more', { count: wish.shoppingLinks.length - 2 }) }}
          </span>
        </div>
      </template>

      <!-- Tracking Info -->
      <div v-if="wish.status === 'shipping' && wish.trackingUrl" :class="compact ? 'mt-1 pt-1' : 'mt-3 pt-3'" class="border-t border-gray-100">
        <a
          :href="wish.trackingUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 text-accent-600 hover:underline"
          :class="compact ? 'text-xs' : 'text-sm'"
          @click.stop
        >
          <Icon name="lucide:package" :class="compact ? 'w-3 h-3' : 'w-4 h-4'" class="text-amber-500" />
          {{ $t('wishes.card.trackPackage') }}
        </a>
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
  listName?: string
  compact?: boolean
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
  return localeDateString(d, dateLocale, { month: 'short', day: 'numeric' })
}
</script>
