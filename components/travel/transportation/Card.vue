<template>
  <div class="relative cursor-pointer group" @click="$emit('click')">
    <!-- Connector Line -->
    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

    <!-- Card -->
    <div
      class="ml-8 my-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
    >
      <template v-if="transportation">
        <!-- Filled State -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="iconBgClass">
            <!-- Flight icon -->
            <svg v-if="transportation.type === 'flight'" class="w-4 h-4" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <!-- Train icon -->
            <svg v-else-if="transportation.type === 'train'" class="w-4 h-4" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17l-2 4m10-4l2 4M12 17V3m-4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
            <!-- Bus icon -->
            <svg v-else-if="transportation.type === 'bus'" class="w-4 h-4" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M5 11h14M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
            </svg>
            <!-- Car icon -->
            <svg v-else-if="transportation.type === 'car'" class="w-4 h-4" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l2-6h14l2 6M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6H5z" />
            </svg>
            <!-- Ferry icon -->
            <svg v-else-if="transportation.type === 'ferry'" class="w-4 h-4" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v6m0 0l-3-2m3 2l3-2M5 19h14l2-4H3l2 4zm0 0l1 2h12l1-2" />
            </svg>
            <!-- Default arrow icon -->
            <svg v-else class="w-4 h-4" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ transportation.carrier || transportTypeLabel }}
              <span v-if="transportation.flightNumber" class="text-gray-500">
                {{ transportation.flightNumber }}
              </span>
            </p>
            <div class="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
              <span class="font-medium">{{ formattedDepartureDay }}</span>
              <span class="text-gray-400 text-xs">{{ formattedDepartureTime }}</span>
              <span class="text-gray-300 mx-1">→</span>
              <span class="font-medium">{{ formattedArrivalDay }}</span>
              <span class="text-gray-400 text-xs">{{ formattedArrivalTime }}</span>
            </div>
          </div>
          <div v-if="transportation.price" class="text-sm font-medium text-gray-700">
            {{ formattedPrice }}
          </div>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium"
            :class="statusBadgeClass"
          >
            {{ $t(`travel.transportation.status.${transportation.bookingStatus}`) }}
          </span>
        </div>

        <!-- Documents indicator -->
        <div v-if="hasDocumentsOrLinks" class="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <span v-if="transportation.documents?.length" class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ transportation.documents.length }}
          </span>
          <span v-if="transportation.links?.length" class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {{ transportation.links.length }}
          </span>
        </div>
      </template>

      <template v-else>
        <!-- Empty State -->
        <div class="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-sm">{{ $t('travel.transportation.addTransport') }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Transportation, TransportType } from '~/types'
import { getCurrencySymbol, TRANSPORT_TYPES } from '~/types'

interface Props {
  transportation?: Transportation | null
  fromLabel: string
  toLabel: string
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const { locale } = useI18n()

const transportTypeLabel = computed(() => {
  if (!props.transportation) return ''
  const type = TRANSPORT_TYPES.find(t => t.value === props.transportation?.type)
  return type?.label || props.transportation.type
})

const iconBgClass = computed(() => {
  if (!props.transportation) return 'bg-gray-100'
  const colorMap: Record<TransportType, string> = {
    flight: 'bg-blue-100',
    train: 'bg-green-100',
    bus: 'bg-amber-100',
    car: 'bg-purple-100',
    ferry: 'bg-cyan-100',
    other: 'bg-gray-100',
  }
  return colorMap[props.transportation.type] || 'bg-gray-100'
})

const iconClass = computed(() => {
  if (!props.transportation) return 'text-gray-500'
  const colorMap: Record<TransportType, string> = {
    flight: 'text-blue-600',
    train: 'text-green-600',
    bus: 'text-amber-600',
    car: 'text-purple-600',
    ferry: 'text-cyan-600',
    other: 'text-gray-600',
  }
  return colorMap[props.transportation.type] || 'text-gray-600'
})

const statusBadgeClass = computed(() => {
  if (!props.transportation) return ''
  const colorMap: Record<string, string> = {
    planned: 'bg-gray-100 text-gray-700',
    booked: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colorMap[props.transportation.bookingStatus] || 'bg-gray-100 text-gray-700'
})

const formattedDepartureDay = computed(() => {
  if (!props.transportation?.departureDateTime) return ''
  const date = props.transportation.departureDateTime instanceof Date
    ? props.transportation.departureDateTime
    : new Date(props.transportation.departureDateTime)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleDateString(dateLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
})

const formattedDepartureTime = computed(() => {
  if (!props.transportation?.departureDateTime) return ''
  const date = props.transportation.departureDateTime instanceof Date
    ? props.transportation.departureDateTime
    : new Date(props.transportation.departureDateTime)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const formattedArrivalDay = computed(() => {
  if (!props.transportation?.arrivalDateTime) return ''
  const date = props.transportation.arrivalDateTime instanceof Date
    ? props.transportation.arrivalDateTime
    : new Date(props.transportation.arrivalDateTime)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleDateString(dateLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
})

const formattedArrivalTime = computed(() => {
  if (!props.transportation?.arrivalDateTime) return ''
  const date = props.transportation.arrivalDateTime instanceof Date
    ? props.transportation.arrivalDateTime
    : new Date(props.transportation.arrivalDateTime)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const formattedPrice = computed(() => {
  if (!props.transportation?.price) return ''
  const symbol = getCurrencySymbol(props.transportation.currency)
  return `${symbol} ${props.transportation.price.toLocaleString()}`
})

const hasDocumentsOrLinks = computed(() => {
  if (!props.transportation) return false
  return (props.transportation.documents?.length || 0) > 0 ||
         (props.transportation.links?.length || 0) > 0
})
</script>
