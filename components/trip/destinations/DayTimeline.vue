<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Empty -->
    <div v-else-if="days.length === 0" class="text-center py-8">
      <Icon name="lucide:calendar" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 text-sm">{{ $t('travel.experiences.empty.description') }}</p>
    </div>

    <!-- Timeline -->
    <div v-else class="relative">
      <!-- Vertical line -->
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div v-for="(day, dayIndex) in days" :key="day.dateKey" class="relative">
        <!-- Date marker -->
        <div class="flex items-center gap-3 mb-3" :class="dayIndex > 0 ? 'mt-6' : ''">
          <div class="relative z-10 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Icon name="lucide:calendar" class="w-4 h-4 text-purple-600" />
          </div>
          <h4 class="text-sm font-semibold text-gray-900">
            {{ day.label }}
          </h4>
        </div>

        <!-- Items within this day -->
        <div class="ml-12 space-y-3 mb-2">
          <div v-for="item in day.items" :key="item.uniqueKey">
            <!-- Experience -->
            <TripExperiencesExperienceCard
              v-if="item.kind === 'experience'"
              :experience="item.data as Experience"
              @edit="$emit('edit-experience', $event)"
            />

            <!-- Accommodation -->
            <div v-else-if="item.kind === 'accommodation-checkin' || item.kind === 'accommodation-checkout'">
              <span
                class="inline-block px-2 py-0.5 text-xs font-medium rounded-full mb-1"
                :class="item.kind === 'accommodation-checkin'
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-orange-50 text-orange-600'"
              >
                {{ item.kind === 'accommodation-checkin'
                  ? $t('travel.destinations.detail.checkIn')
                  : $t('travel.destinations.detail.checkOut') }}
              </span>
              <TripAccommodationsCard
                :accommodation="item.data as Accommodation"
                @click="$emit('edit-accommodation', $event)"
              />
            </div>

            <!-- Transportation -->
            <TripTransportationDestinationCard
              v-else-if="item.kind === 'transport-arriving' || item.kind === 'transport-departing'"
              :transportation="item.data as Transportation"
              :destination-id="destinationId"
              :destinations="destinations"
              :origin-name="originName"
              @click="$emit('edit-transportation', $event)"
            />
          </div>

          <!-- Empty day message -->
          <p v-if="day.items.length === 0 && day.dateKey !== '_unscheduled'" class="text-sm text-gray-400 text-center">
            {{ $t('travel.destinations.detail.emptyDay') }}
          </p>

          <!-- Add experience link -->
          <button
            v-if="day.dateKey !== '_unscheduled'"
            @click="$emit('add-experience', day.dateKey)"
            class="text-sm text-purple-500 hover:text-purple-700 transition-colors"
          >
            + {{ $t('travel.destinations.detail.addExperienceForDay') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Experience, Accommodation, Transportation, Destination } from '~/types'

interface Props {
  experiences: Experience[]
  accommodations: Accommodation[]
  transportations: Transportation[]
  destinations: Destination[]
  destinationId: string
  originName: string
  arrivalDate: Date | string | null
  departureDate: Date | string | null
  loading?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  'edit-experience': [experience: Experience]
  'edit-accommodation': [accommodation: Accommodation]
  'edit-transportation': [transportation: Transportation]
  'add-experience': [dateKey: string]
}>()

const { locale, t } = useI18n()

type DayItemKind = 'experience' | 'accommodation-checkin' | 'accommodation-checkout' | 'transport-arriving' | 'transport-departing'

interface DayItem {
  uniqueKey: string
  kind: DayItemKind
  sortTime: string
  data: Experience | Accommodation | Transportation
}

interface DayGroup {
  dateKey: string
  label: string
  items: DayItem[]
}

function toDateKey(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function extractTime(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return ''
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

const days = computed<DayGroup[]>(() => {
  const dateItems: Record<string, DayItem[]> = {}
  const unscheduledItems: DayItem[] = []

  // Helper to add item to a date bucket
  const addItem = (dateKey: string, item: DayItem) => {
    if (!dateKey) {
      unscheduledItems.push(item)
      return
    }
    if (!dateItems[dateKey]) dateItems[dateKey] = []
    dateItems[dateKey].push(item)
  }

  // Determine the date range
  const arrival = props.arrivalDate ? toDate(props.arrivalDate) : null
  const departure = props.departureDate ? toDate(props.departureDate) : null
  const hasRange = arrival && departure && !isNaN(arrival.getTime()) && !isNaN(departure.getTime())

  // Generate day slots for date range
  const rangeKeys = new Set<string>()
  if (hasRange) {
    const current = new Date(arrival!)
    current.setUTCHours(0, 0, 0, 0)
    const end = new Date(departure!)
    end.setUTCHours(0, 0, 0, 0)
    while (current <= end) {
      const key = current.toISOString().split('T')[0]
      rangeKeys.add(key)
      dateItems[key] = dateItems[key] || []
      current.setUTCDate(current.getUTCDate() + 1)
    }
  }

  // Place experiences
  for (const exp of props.experiences) {
    if (exp.scheduledDate) {
      const key = toDateKey(exp.scheduledDate)
      const inRange = hasRange && rangeKeys.has(key)
      addItem(inRange || !hasRange ? key : '', {
        uniqueKey: `exp-${exp.id}`,
        kind: 'experience',
        sortTime: exp.scheduledTime || '12:00',
        data: exp,
      })
    } else {
      unscheduledItems.push({
        uniqueKey: `exp-${exp.id}`,
        kind: 'experience',
        sortTime: '12:00',
        data: exp,
      })
    }
  }

  // Place accommodations on check-in and check-out days
  for (const acc of props.accommodations) {
    const checkInKey = toDateKey(acc.checkIn)
    const checkOutKey = toDateKey(acc.checkOut)

    if (checkInKey) {
      const inRange = hasRange && rangeKeys.has(checkInKey)
      addItem(inRange || !hasRange ? checkInKey : '', {
        uniqueKey: `acc-checkin-${acc.id}`,
        kind: 'accommodation-checkin',
        sortTime: acc.checkInTime || '15:00',
        data: acc,
      })
    }

    if (checkOutKey && checkOutKey !== checkInKey) {
      const inRange = hasRange && rangeKeys.has(checkOutKey)
      addItem(inRange || !hasRange ? checkOutKey : '', {
        uniqueKey: `acc-checkout-${acc.id}`,
        kind: 'accommodation-checkout',
        sortTime: acc.checkOutTime || '11:00',
        data: acc,
      })
    }
  }

  // Place transportations
  for (const tr of props.transportations) {
    const isArriving = tr.toDestinationId === props.destinationId
    const isDeparting = tr.fromDestinationId === props.destinationId

    if (isArriving && tr.arrivalDateTime) {
      const key = toDateKey(tr.arrivalDateTime)
      const inRange = hasRange && rangeKeys.has(key)
      addItem(inRange || !hasRange ? key : '', {
        uniqueKey: `tr-arrive-${tr.id}`,
        kind: 'transport-arriving',
        sortTime: extractTime(tr.arrivalDateTime) || '00:00',
        data: tr,
      })
    }

    if (isDeparting && tr.departureDateTime) {
      const key = toDateKey(tr.departureDateTime)
      const inRange = hasRange && rangeKeys.has(key)
      addItem(inRange || !hasRange ? key : '', {
        uniqueKey: `tr-depart-${tr.id}`,
        kind: 'transport-departing',
        sortTime: extractTime(tr.departureDateTime) || '23:59',
        data: tr,
      })
    }
  }

  // Sort date keys chronologically
  const sortedKeys = Object.keys(dateItems).sort()

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }

  // Build day groups
  const groups: DayGroup[] = sortedKeys.map((key, index) => {
    // Sort items within day by sortTime
    const items = dateItems[key].sort((a, b) => a.sortTime.localeCompare(b.sortTime))

    // Build label: "Day N — Monday, March 15"
    const dateLabel = localeDateString(new Date(key + 'T00:00:00Z'), dateLocale, formatOptions)
    let label: string
    if (hasRange) {
      // Calculate day number relative to arrival
      const arrivalKey = arrival!.toISOString().split('T')[0]
      const dayNum = Math.round(
        (new Date(key + 'T00:00:00Z').getTime() - new Date(arrivalKey + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
      label = `${t('travel.destinations.detail.dayNumber', { n: dayNum })} — ${dateLabel}`
    } else {
      label = dateLabel
    }

    return { dateKey: key, label, items }
  })

  // Add unscheduled group at end
  if (unscheduledItems.length > 0) {
    groups.push({
      dateKey: '_unscheduled',
      label: t('travel.destinations.detail.unscheduled'),
      items: unscheduledItems,
    })
  }

  return groups
})
</script>
