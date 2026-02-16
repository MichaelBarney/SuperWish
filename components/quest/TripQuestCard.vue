<template>
  <NuxtLink
    :to="`/trip/${trip.id}`"
    class="group block bg-white rounded-xl shadow-soft overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5"
  >
    <!-- Cover Image -->
    <div class="relative aspect-[2/1] overflow-hidden">
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
        <Icon name="lucide:plane" class="w-8 h-8 text-white/50" />
      </div>

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <!-- SuperTrip Badge -->
      <div class="absolute top-2 left-2">
        <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500 text-white flex items-center gap-1">
          <Icon name="lucide:plane" class="w-2.5 h-2.5" />
          SuperTrip
        </span>
      </div>

      <!-- Status Badge -->
      <div class="absolute top-2 right-2">
        <span
          class="px-2 py-0.5 rounded-full text-[11px] font-medium"
          :class="statusBadgeClass"
        >
          {{ $t(`travel.trips.status.${trip.status}`) }}
        </span>
      </div>

      <!-- Title overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-3">
        <h3 class="text-sm font-semibold text-white truncate">
          {{ trip.name }}
        </h3>
        <p v-if="dateRange" class="text-xs text-white/80 mt-0.5">
          {{ dateRange }}
        </p>
      </div>
    </div>

    <!-- Content -->
    <div class="px-3 py-2">
      <p v-if="trip.description" class="text-xs text-gray-500 line-clamp-1">
        {{ trip.description }}
      </p>
      <p v-else class="text-xs text-purple-600">
        {{ $t('quest.tripQuest.viewTrip') }}
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Trip } from '~/types'

interface Props {
  trip: Trip
}

const props = defineProps<Props>()
const { locale, t } = useI18n()

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
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }

  if (startDate && endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)

    if (start.getFullYear() === end.getFullYear()) {
      return `${localeDateString(start, dateLocale, formatOptions)} - ${localeDateString(end, dateLocale, { ...formatOptions, year: 'numeric' })}`
    }

    return `${localeDateString(start, dateLocale, { ...formatOptions, year: 'numeric' })} - ${localeDateString(end, dateLocale, { ...formatOptions, year: 'numeric' })}`
  }

  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    return t('quest.quests.dateStarts', { date: localeDateString(start, dateLocale, { ...formatOptions, year: 'numeric' }) })
  }

  if (endDate) {
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    return t('quest.quests.dateDue', { date: localeDateString(end, dateLocale, { ...formatOptions, year: 'numeric' }) })
  }

  return null
})
</script>
