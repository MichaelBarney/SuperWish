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
      v-else-if="!hasContent"
      class="text-center py-12"
    >
      <div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Icon name="lucide:archive" class="w-8 h-8 text-gray-400" />
      </div>
      <h3 class="text-base font-semibold text-gray-900 mb-2">{{ $t('lists.empty.title') }}</h3>
      <p class="text-gray-500 text-sm mb-4">{{ $t('lists.empty.description') }}</p>
      <UiButton size="sm" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
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
        <!-- Owned List Card (always first) -->
        <ListsOwnedListCard
          v-if="ownedCount && ownedCount > 0"
          :count="ownedCount"
        />
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
        <Icon name="lucide:chevron-left" class="w-5 h-5" />
      </button>

      <!-- Right Arrow -->
      <button
        v-if="canScrollRight"
        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
        @click="scrollRight"
      >
        <Icon name="lucide:chevron-right" class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WishList } from '~/types'

interface Props {
  lists: readonly WishList[]
  loading?: boolean
  ownedCount?: number
}

const props = defineProps<Props>()

// Show carousel if there are lists OR owned items
const hasContent = computed(() => props.lists.length > 0 || (props.ownedCount ?? 0) > 0)

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
