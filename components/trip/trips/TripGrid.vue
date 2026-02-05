<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse"
      >
        <div class="aspect-[16/9] bg-gray-200" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="trips.length === 0"
      class="text-center py-16 bg-gray-50 rounded-2xl"
    >
      <div class="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ $t('travel.trips.empty.title') }}
      </h3>
      <p class="text-gray-500 mb-6">
        {{ $t('travel.trips.empty.description') }}
      </p>
      <UiButton variant="primary" @click="$emit('create')">
        <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ $t('travel.trips.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Trips Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <TravelTripsTripCard
        v-for="trip in trips"
        :key="trip.id"
        :trip="trip"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Trip } from '~/types'

interface Props {
  trips: readonly Trip[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  create: []
}>()
</script>
