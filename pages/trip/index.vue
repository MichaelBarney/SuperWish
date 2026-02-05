<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('travel.trips.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ $t('travel.trips.tripCount', trips.length) }}</p>
      </div>

      <UiButton @click="showCreateModal = true">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('travel.trips.newTrip') }}
      </UiButton>
    </div>

    <!-- Trips Grid -->
    <TripTripsTripGrid
      :trips="trips"
      :loading="loading"
      @create="showCreateModal = true"
    />

    <!-- Create Trip Modal -->
    <UiModal
      v-model="showCreateModal"
      :title="$t('travel.trips.newTrip')"
    >
      <TripTripsTripForm
        @submit="handleCreateTrip"
        @cancel="showCreateModal = false"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { TripForm } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

// Set app context to SuperTrip
const { setApp } = useAppContext()
onMounted(() => {
  setApp('supertrip')
})

// Trips
const { trips, loading, createTrip } = useTrips()

// Modals
const showCreateModal = ref(false)

// Handlers
async function handleCreateTrip(data: TripForm) {
  const result = await createTrip(data)

  if (result.success) {
    showCreateModal.value = false
    // Navigate to the new trip
    if (result.id) {
      navigateTo(`/trip/${result.id}`)
    }
  }
}
</script>
