<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse flex-shrink-0 w-48"
      >
        <div class="h-16 bg-gray-200" />
        <div class="p-3 space-y-2">
          <div class="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="lists.length === 0"
      class="text-center py-12"
    >
      <div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-2">{{ $t('lists.empty.title') }}</h3>
      <p class="text-gray-500 text-sm mb-4">{{ $t('lists.empty.description') }}</p>
      <UiButton size="sm" @click="$emit('create')">
        <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ $t('lists.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Carousel -->
    <div v-else class="relative group/carousel">
      <!-- Scroll Container -->
      <div
        ref="scrollContainer"
        class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
      >
        <ListsListCard
          v-for="list in lists"
          :key="list.id"
          :list="list"
        />
      </div>

      <!-- Left Arrow -->
      <button
        v-if="canScrollLeft"
        class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
        @click="scrollLeft"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Right Arrow -->
      <button
        v-if="canScrollRight"
        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
        @click="scrollRight"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WishList } from '~/types'

interface Props {
  lists: readonly WishList[]
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  create: []
}>()

const scrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollButtons() {
  if (!scrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft + clientWidth < scrollWidth - 10
}

function scrollLeft() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRight() {
  if (!scrollContainer.value) return
  scrollContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollButtons()
  scrollContainer.value?.addEventListener('scroll', updateScrollButtons)
  window.addEventListener('resize', updateScrollButtons)
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateScrollButtons)
  window.removeEventListener('resize', updateScrollButtons)
})

watch(() => scrollContainer.value, () => {
  nextTick(updateScrollButtons)
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
