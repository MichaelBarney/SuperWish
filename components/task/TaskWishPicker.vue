<template>
  <div v-if="modelValue" class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
    <!-- Search -->
    <div class="p-2 border-b border-gray-100">
      <input
        ref="searchRef"
        v-model="searchQuery"
        type="text"
        :placeholder="$t('task.wishPicker.searchPlaceholder')"
        class="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
        @keydown.escape="$emit('update:modelValue', false)"
      />
    </div>

    <!-- Results -->
    <div class="max-h-64 overflow-y-auto">
      <div v-if="filteredWishes.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
        {{ $t('task.wishPicker.noResults') }}
      </div>
      <button
        v-for="wish in filteredWishes"
        :key="wish.id"
        @click="selectWish(wish)"
        class="w-full flex items-center gap-3 px-3 py-2 hover:bg-teal-50 transition-colors text-left"
      >
        <!-- Thumbnail -->
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="wish.imageUrl" :src="wish.imageUrl" :alt="wish.title" class="w-full h-full object-cover" />
          <Icon v-else name="lucide:star" class="w-4 h-4 text-teal-400" />
        </div>
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ wish.title }}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <WishesWishStatusBadge :status="wish.status" />
            <span v-if="wish.targetPrice" class="text-xs text-gray-400">
              {{ getCurrencySymbol(wish.currency) }}{{ wish.targetPrice }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Wish } from '~/types'
import { getCurrencySymbol } from '~/types'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [wish: Wish]
}>()

const { wishes } = useAllWishes()

const searchQuery = ref('')
const searchRef = ref<HTMLInputElement | null>(null)

const filteredWishes = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return wishes.value
  return wishes.value.filter(w => w.title.toLowerCase().includes(q))
})

function selectWish(wish: Wish) {
  emit('select', wish)
  emit('update:modelValue', false)
  searchQuery.value = ''
}

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => searchRef.value?.focus())
  }
})
</script>
