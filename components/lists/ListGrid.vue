<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="i in 6"
        :key="i"
        class="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse"
      >
        <div class="h-24 bg-gray-200" />
        <div class="p-5 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div class="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div class="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="lists.length === 0"
      class="text-center py-16"
    >
      <div class="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">No wishlists yet</h3>
      <p class="text-gray-500 mb-6">Create your first wishlist to get started</p>
      <UiButton @click="$emit('create')">
        <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Wishlist
      </UiButton>
    </div>

    <!-- List Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ListsListCard
        v-for="list in lists"
        :key="list.id"
        :list="list"
      />
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
</script>
