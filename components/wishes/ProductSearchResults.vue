<template>
  <div class="space-y-3">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <Icon name="svg-spinners:ring-resize" class="h-6 w-6 text-accent-500" />
      <span class="ml-2 text-sm text-gray-500">{{ $t('wishes.search.searching') }}</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="p-4 bg-red-50 rounded-xl text-sm text-red-600">
      {{ error }}
    </div>

    <!-- No results -->
    <div v-else-if="results.length === 0 && searched" class="p-4 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
      {{ $t('wishes.search.noResults') }}
    </div>

    <!-- Results -->
    <div v-else-if="results.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500">
          {{ $t('wishes.search.showing', { visible: visibleResults.length, total: results.length }, results.length) }}
        </span>
        <button
          type="button"
          @click="$emit('close')"
          class="text-xs text-gray-400 hover:text-gray-600"
        >
          {{ $t('common.close') }}
        </button>
      </div>

      <div class="grid gap-2 max-h-72 overflow-y-auto pr-1">
        <button
          v-for="(product, index) in visibleResults"
          :key="index"
          type="button"
          @click="$emit('select', product)"
          class="flex gap-3 p-3 bg-gray-50 hover:bg-accent-50 rounded-xl border border-gray-100 hover:border-accent-200 transition-colors text-left group"
        >
          <!-- Thumbnail -->
          <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-gray-100">
            <img
              v-if="product.imageUrl"
              :src="product.imageUrl"
              :alt="product.title"
              class="w-full h-full object-contain"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
              <Icon name="lucide:image" class="w-6 h-6" />
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate group-hover:text-accent-700">
              {{ product.title }}
            </p>
            <p v-if="product.storeName" class="text-xs text-gray-400 mt-0.5">
              {{ product.storeName }}
            </p>
            <p v-if="product.snippet" class="text-xs text-gray-500 mt-1 line-clamp-2">
              {{ product.snippet }}
            </p>
          </div>

          <!-- Price -->
          <div v-if="product.price != null" class="flex-shrink-0 text-right">
            <span class="text-sm font-semibold text-accent-600">
              {{ formatPrice(product.price, product.currency) }}
            </span>
          </div>
        </button>
      </div>

      <button
        v-if="results.length > visibleCount"
        type="button"
        @click="showMore"
        class="w-full py-2 text-xs text-accent-600 hover:text-accent-700 font-medium"
      >
        {{ $t('wishes.search.showMore', { count: Math.min(PAGE_SIZE, results.length - visibleCount), remaining: results.length - visibleCount }) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductSearchResult } from '~/types'
import { getCurrencySymbol } from '~/types'

const PAGE_SIZE = 4

const props = defineProps<{
  results: ProductSearchResult[]
  loading: boolean
  error: string | null
  searched: boolean
}>()

defineEmits<{
  select: [product: ProductSearchResult]
  close: []
}>()

const visibleCount = ref(PAGE_SIZE)

watch(() => props.results, () => {
  visibleCount.value = PAGE_SIZE
})

const visibleResults = computed(() => props.results.slice(0, visibleCount.value))

function showMore() {
  visibleCount.value += PAGE_SIZE
}

function formatPrice(price: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${price.toFixed(2)}`
}
</script>
