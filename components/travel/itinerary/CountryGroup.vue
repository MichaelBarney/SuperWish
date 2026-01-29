<template>
  <div class="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
    <!-- Header do país -->
    <div class="flex items-center gap-2 mb-3 text-sm font-medium text-gray-500">
      <span v-if="countryFlag" class="text-base">{{ countryFlag }} </span>
      <span>{{ country }}</span>
    </div>

    <!-- Layout horizontal no desktop, vertical no mobile -->
    <div class="flex flex-col md:flex-row md:items-center md:gap-0 gap-2">
      <template v-for="(dest, i) in destinations" :key="dest.id">
        <!-- Destino -->
        <div class="flex-1 min-w-0 bg-white rounded-lg p-2 md:p-3 shadow-sm">
          <TravelItineraryPoint
            :label="dest.name"
            :arrival-date="dateInfos[i]?.arrivalDate"
            :departure-date="dateInfos[i]?.departureDate"
            :duration-days="dateInfos[i]?.durationDays"
            :order="startIndex + i + 1"
            :draggable="true"
            :compact="true"
            @click="$emit('editDestination', dest)"
          />
        </div>

        <!-- Transporte entre cidades (desktop: inline, mobile: abaixo) -->
        <template v-if="i < destinations.length - 1">
          <!-- Desktop: card compacto horizontal -->
          <div class="hidden md:flex items-center justify-center flex-shrink-0">
            <TravelTransportationCardCompact
              :transportation="transports[i]"
              @click="$emit('editTransport', dest.id, destinations[i + 1]?.id)"
            />
          </div>

          <!-- Mobile: card normal vertical -->
          <div class="md:hidden">
            <TravelTransportationCard
              :transportation="transports[i]"
              :from-label="dest.name"
              :to-label="destinations[i + 1]?.name || ''"
              @click="$emit('editTransport', dest.id, destinations[i + 1]?.id)"
            />
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Destination, Transportation } from '~/types'

interface DestinationDateInfo {
  arrivalDate: string
  departureDate: string
  durationDays: string
}

interface Props {
  country: string
  countryCode?: string
  destinations: Destination[]
  startIndex: number
  dateInfos: DestinationDateInfo[]
  transports: (Transportation | null)[]
}

const props = defineProps<Props>()

defineEmits<{
  editDestination: [destination: Destination]
  editTransport: [fromId: string | null, toId: string | null]
}>()

// Computed para flag do país
const countryFlag = computed(() => {
  if (!props.countryCode) return ''

  // Converter código do país para emoji de bandeira
  const codePoints = props.countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
})
</script>
