<template>
  <TaskInlineSearchPicker
    :model-value="modelValue"
    :items="wishes"
    :search-placeholder="$t('task.wishPicker.searchPlaceholder')"
    :no-results-text="$t('task.wishPicker.noResults')"
    accent-color="teal"
    search-field="title"
    @update:model-value="$emit('update:modelValue', $event)"
    @select="handleSelect"
  >
    <template #item="{ item }">
      <!-- Thumbnail -->
      <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="w-full h-full object-cover" />
        <Icon v-else name="lucide:star" class="w-4 h-4 text-teal-400" />
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
        <div class="flex items-center gap-2 mt-0.5">
          <WishesWishStatusBadge :status="item.status" />
          <span v-if="item.targetPrice" class="text-xs text-gray-400">
            {{ getCurrencySymbol(item.currency) }}{{ item.targetPrice }}
          </span>
        </div>
      </div>
    </template>
  </TaskInlineSearchPicker>
</template>

<script setup lang="ts">
import type { Wish } from '~/types'
import { getCurrencySymbol } from '~/types'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [wish: Wish]
}>()

const { wishes } = useAllWishes()

function handleSelect(item: any) {
  emit('select', item as Wish)
}
</script>
