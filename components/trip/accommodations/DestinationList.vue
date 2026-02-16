<template>
  <div class="w-full max-w-md mx-auto mt-2 mb-2">
    <!-- Accommodation Cards -->
    <div v-if="accommodations.length > 0" class="space-y-2">
      <TripAccommodationsCard
        v-for="accommodation in accommodations"
        :key="accommodation.id"
        :accommodation="accommodation"
        @click="$emit('click', $event)"
      />
    </div>

    <!-- Add Button -->
    <button
      type="button"
      class="w-full mt-2 py-2 px-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-amber-300 hover:text-amber-500 transition-colors flex items-center justify-center gap-1.5"
      @click="$emit('add', destinationId)"
    >
      <Icon name="lucide:plus" class="w-4 h-4" />
      {{ $t('travel.accommodations.addAccommodation') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Accommodation } from '~/types'

interface Props {
  accommodations: Accommodation[]
  destinationId: string
}

defineProps<Props>()

defineEmits<{
  click: [accommodation: Accommodation]
  add: [destinationId: string]
}>()
</script>
