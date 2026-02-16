<template>
  <div
    class="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group"
    @click="$emit('click', transportation)"
  >
    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        :class="iconBgClass"
      >
        <Icon :name="iconName" class="w-5 h-5" :class="iconColorClass" />
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h4 class="font-medium text-gray-900 truncate">
            {{ transportation.carrier || transportTypeLabel }}
            <span v-if="transportation.flightNumber" class="text-gray-500 font-normal">
              {{ transportation.flightNumber }}
            </span>
          </h4>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            :class="statusBadgeClass"
          >
            {{ $t(`travel.transportation.bookingStatus.${transportation.bookingStatus}`) }}
          </span>
        </div>

        <!-- Direction context -->
        <p class="text-sm text-gray-500 mt-0.5">
          <template v-if="isOutgoing">
            {{ $t('travel.transportation.departingTo') }} {{ toLocationName }}
          </template>
          <template v-else>
            {{ $t('travel.transportation.arrivingFrom') }} {{ fromLocationName }}
          </template>
        </p>

        <!-- Date/Time & Price -->
        <div class="flex items-center gap-3 mt-1">
          <span v-if="formattedDateTime" class="text-xs text-gray-400">
            {{ formattedDateTime }}
          </span>
          <span v-if="transportation.price" class="text-xs text-gray-500 font-medium">
            {{ getCurrencySymbol(transportation.currency) }} {{ transportation.price.toLocaleString() }}
          </span>
        </div>
      </div>

      <!-- Edit indicator -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity">
        <Icon name="lucide:chevron-right" class="w-4 h-4 text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transportation, TransportType, Destination } from '~/types'
import { getCurrencySymbol, TRANSPORT_TYPES } from '~/types'

interface Props {
  transportation: Transportation
  destinationId: string
  destinations: Destination[]
  originName: string
}

const props = defineProps<Props>()

defineEmits<{
  click: [transportation: Transportation]
}>()

const { locale } = useI18n()

// Icon maps (same as Card.vue)
const iconMap: Record<TransportType, string> = {
  flight: 'lucide:plane',
  train: 'lucide:train-front',
  bus: 'lucide:bus',
  car: 'lucide:car',
  ferry: 'lucide:ship',
  other: 'lucide:arrow-right',
}

const iconBgMap: Record<TransportType, string> = {
  flight: 'bg-blue-100',
  train: 'bg-orange-100',
  bus: 'bg-amber-100',
  car: 'bg-purple-100',
  ferry: 'bg-cyan-100',
  other: 'bg-gray-100',
}

const iconColorMap: Record<TransportType, string> = {
  flight: 'text-blue-600',
  train: 'text-orange-600',
  bus: 'text-amber-600',
  car: 'text-purple-600',
  ferry: 'text-cyan-600',
  other: 'text-gray-600',
}

const iconName = computed(() => iconMap[props.transportation.type] || 'lucide:arrow-right')
const iconBgClass = computed(() => iconBgMap[props.transportation.type] || 'bg-gray-100')
const iconColorClass = computed(() => iconColorMap[props.transportation.type] || 'text-gray-600')

const transportTypeLabel = computed(() => {
  const type = TRANSPORT_TYPES.find(t => t.value === props.transportation.type)
  return type?.label || props.transportation.type
})

const statusBadgeClass = computed(() => {
  const colorMap: Record<string, string> = {
    planned: 'bg-gray-100 text-gray-700',
    booked: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colorMap[props.transportation.bookingStatus] || 'bg-gray-100 text-gray-700'
})

// Direction: outgoing if this destination is the "from" side
const isOutgoing = computed(() => props.transportation.fromDestinationId === props.destinationId)

// Resolve location names
const getDestinationName = (id: string | null | undefined): string => {
  if (!id || id === '') return props.originName
  const dest = props.destinations.find(d => d.id === id)
  return dest?.name || ''
}

const fromLocationName = computed(() =>
  getDestinationName(props.transportation.fromDestinationId) || props.transportation.fromLocation
)

const toLocationName = computed(() =>
  getDestinationName(props.transportation.toDestinationId) || props.transportation.toLocation
)

// Format date/time
const formattedDateTime = computed(() => {
  const dateTime = isOutgoing.value
    ? props.transportation.departureDateTime
    : props.transportation.arrivalDateTime

  if (!dateTime) return null
  const d = dateTime instanceof Date ? dateTime : new Date(dateTime)
  if (isNaN(d.getTime())) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const date = localeDateString(d, dateLocale, { month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
})
</script>
