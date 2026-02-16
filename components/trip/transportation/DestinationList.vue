<template>
  <div class="w-full max-w-md mx-auto mt-2 mb-2">
    <div v-if="transportations.length > 0" class="space-y-2">
      <TripTransportationDestinationCard
        v-for="transport in transportations"
        :key="transport.id"
        :transportation="transport"
        :destination-id="destinationId"
        :destinations="destinations"
        :origin-name="originName"
        @click="$emit('click', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transportation, Destination } from '~/types'

interface Props {
  transportations: Transportation[]
  destinationId: string
  destinations: Destination[]
  originName: string
}

defineProps<Props>()

defineEmits<{
  click: [transportation: Transportation]
}>()
</script>
