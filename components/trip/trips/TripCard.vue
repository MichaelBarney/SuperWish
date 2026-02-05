<template>
  <NuxtLink
    :to="`/travel/${trip.id}`"
    class="group block bg-white rounded-2xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1"
  >
    <!-- Cover Image -->
    <div class="relative aspect-[16/9] overflow-hidden">
      <img
        v-if="trip.coverUrl"
        :src="trip.coverUrl"
        :alt="trip.name"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center"
      >
        <svg class="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <!-- Status Badge -->
      <div class="absolute top-3 right-3">
        <span
          class="px-2.5 py-1 rounded-full text-xs font-medium"
          :class="statusBadgeClass"
        >
          {{ $t(`travel.trips.status.${trip.status}`) }}
        </span>
      </div>

      <!-- Title overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-4">
        <h3 class="text-lg font-semibold text-white truncate">
          {{ trip.name }}
        </h3>
        <p v-if="dateRange" class="text-sm text-white/80 mt-0.5">
          {{ dateRange }}
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <p v-if="trip.description" class="text-sm text-gray-500 line-clamp-2 mb-3">
        {{ trip.description }}
      </p>

      <!-- Budget info -->
      <div v-if="trip.totalBudget" class="flex items-center gap-2 text-sm text-gray-500">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formattedBudget }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Trip } from '~/types'
import { getCurrencySymbol } from '~/types'

interface Props {
  trip: Trip
}

const props = defineProps<Props>()
const { locale } = useI18n()

const statusBadgeClass = computed(() => {
  switch (props.trip.status) {
    case 'planning':
      return 'bg-gray-100 text-gray-700'
    case 'upcoming':
      return 'bg-blue-100 text-blue-700'
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

const dateRange = computed(() => {
  const { startDate, endDate } = props.trip
  if (!startDate && !endDate) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

  if (startDate && endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)

    // If same year, don't repeat year
    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString(dateLocale, formatOptions)} - ${end.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })}`
    }

    return `${start.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })} - ${end.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })}`
  }

  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    return `Starts ${start.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })}`
  }

  return null
})

const formattedBudget = computed(() => {
  if (!props.trip.totalBudget) return ''

  const symbol = getCurrencySymbol(props.trip.baseCurrency)
  return `${symbol} ${props.trip.totalBudget.toLocaleString()}`
})
</script>
