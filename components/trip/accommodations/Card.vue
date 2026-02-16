<template>
  <div
    class="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group"
    @click="$emit('click', accommodation)"
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
          <h4 class="font-medium text-gray-900 truncate">{{ accommodation.name }}</h4>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            :class="statusBadgeClass"
          >
            {{ $t(`travel.accommodations.status.${accommodation.bookingStatus}`) }}
          </span>
        </div>

        <!-- Dates -->
        <p v-if="dateRange" class="text-sm text-gray-500 mt-0.5">
          {{ dateRange }}
          <span v-if="checkInOutTimes" class="text-gray-400"> &middot; {{ checkInOutTimes }}</span>
        </p>

        <!-- Nights & Price -->
        <div class="flex items-center gap-3 mt-1">
          <span v-if="nightsCount" class="text-xs text-gray-400">
            {{ $t('travel.accommodations.nights', { count: nightsCount }, nightsCount) }}
          </span>
          <span v-if="accommodation.totalPrice" class="text-xs text-gray-500 font-medium">
            {{ getCurrencySymbol(accommodation.currency) }} {{ accommodation.totalPrice.toLocaleString() }}
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
import type { Accommodation, AccommodationType } from '~/types'
import { getCurrencySymbol } from '~/types'

interface Props {
  accommodation: Accommodation
}

const props = defineProps<Props>()

defineEmits<{
  click: [accommodation: Accommodation]
}>()

const { locale } = useI18n()

const iconMap: Record<AccommodationType, string> = {
  hotel: 'lucide:building',
  hostel: 'lucide:bed-double',
  airbnb: 'lucide:home',
  apartment: 'lucide:building-2',
  resort: 'lucide:palm-tree',  // fallback to umbrella-beach if not available
  friend_house: 'lucide:users',
  other: 'lucide:bed',
}

const iconBgMap: Record<AccommodationType, string> = {
  hotel: 'bg-amber-100',
  hostel: 'bg-orange-100',
  airbnb: 'bg-rose-100',
  apartment: 'bg-blue-100',
  resort: 'bg-emerald-100',
  friend_house: 'bg-purple-100',
  other: 'bg-gray-100',
}

const iconColorMap: Record<AccommodationType, string> = {
  hotel: 'text-amber-600',
  hostel: 'text-orange-600',
  airbnb: 'text-rose-600',
  apartment: 'text-blue-600',
  resort: 'text-emerald-600',
  friend_house: 'text-purple-600',
  other: 'text-gray-600',
}

const iconName = computed(() => iconMap[props.accommodation.type] || 'lucide:bed')
const iconBgClass = computed(() => iconBgMap[props.accommodation.type] || 'bg-gray-100')
const iconColorClass = computed(() => iconColorMap[props.accommodation.type] || 'text-gray-600')

const statusBadgeClass = computed(() => {
  const colorMap: Record<string, string> = {
    planned: 'bg-gray-100 text-gray-700',
    booked: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  return colorMap[props.accommodation.bookingStatus] || 'bg-gray-100 text-gray-700'
})

const dateRange = computed(() => {
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }

  const checkIn = props.accommodation.checkIn instanceof Date
    ? props.accommodation.checkIn
    : new Date(props.accommodation.checkIn)
  const checkOut = props.accommodation.checkOut instanceof Date
    ? props.accommodation.checkOut
    : new Date(props.accommodation.checkOut)

  if (isNaN(checkIn.getTime())) return null

  const start = checkIn.toLocaleDateString(dateLocale, formatOptions)
  const end = !isNaN(checkOut.getTime())
    ? checkOut.toLocaleDateString(dateLocale, formatOptions)
    : ''

  return end ? `${start} → ${end}` : start
})

const checkInOutTimes = computed(() => {
  const parts: string[] = []
  if (props.accommodation.checkInTime) parts.push(props.accommodation.checkInTime)
  if (props.accommodation.checkOutTime) parts.push(props.accommodation.checkOutTime)
  return parts.length === 2 ? `${parts[0]} - ${parts[1]}` : parts[0] || ''
})

const nightsCount = computed(() => {
  const checkIn = props.accommodation.checkIn instanceof Date
    ? props.accommodation.checkIn
    : new Date(props.accommodation.checkIn)
  const checkOut = props.accommodation.checkOut instanceof Date
    ? props.accommodation.checkOut
    : new Date(props.accommodation.checkOut)
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return null
  const diffTime = checkOut.getTime() - checkIn.getTime()
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : null
})
</script>
