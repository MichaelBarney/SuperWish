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
}>()
</script>
