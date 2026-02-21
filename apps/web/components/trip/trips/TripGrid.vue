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
        <Icon name="lucide:plane" class="w-10 h-10 text-purple-500" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ $t('travel.trips.empty.title') }}
      </h3>
      <p class="text-gray-500 mb-6">
        {{ $t('travel.trips.empty.description') }}
      </p>
      <UiButton variant="primary" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('travel.trips.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Trips Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <TripTripsTripCard
        v-for="trip in sortedTrips"
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

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  create: []
}>()

// Sort trips: upcoming first, then planning, then others
const statusOrder: Record<string, number> = {
  upcoming: 0,
  planning: 1,
  active: 2,
  completed: 3,
}

const sortedTrips = computed(() => {
  return [...props.trips].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 99
    const orderB = statusOrder[b.status] ?? 99
    return orderA - orderB
  })
})
</script>
