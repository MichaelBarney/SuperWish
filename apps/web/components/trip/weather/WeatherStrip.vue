<template>
  <div v-if="weather && weather.days.length > 0" class="space-y-2">
    <div class="flex items-center gap-2">
      <Icon name="lucide:cloud-sun" class="w-4 h-4 text-purple-500" />
      <h3 class="text-sm font-semibold text-gray-700">{{ $t('travel.weather.title') }}</h3>
    </div>

    <!-- Scrollable day strip -->
    <div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      <div
        v-for="day in weather.days"
        :key="day.date"
        class="flex flex-col items-center gap-1 min-w-[56px] px-2 py-2 rounded-xl bg-gray-50 flex-shrink-0"
      >
        <span class="text-[10px] font-medium text-gray-500 uppercase">{{ formatWeekday(day.date) }}</span>
        <Icon :name="getWeatherIcon(day.weatherCode)" class="w-5 h-5 text-gray-600" />
        <div class="text-center leading-tight">
          <span class="text-xs font-semibold text-gray-800">{{ formatTemp(day.temperatureMax, tempUnit) }}°</span>
          <span class="text-[10px] text-gray-400 ml-0.5">{{ formatTemp(day.temperatureMin, tempUnit) }}°</span>
        </div>
      </div>
    </div>

    <!-- Historical note -->
    <p v-if="weather.isHistorical" class="text-[11px] text-gray-400 italic">
      {{ $t('travel.weather.historicalNote') }}
    </p>
  </div>

  <!-- Loading skeleton -->
  <div v-else-if="loading" class="space-y-2">
    <div class="flex items-center gap-2">
      <div class="w-4 h-4 bg-gray-200 rounded animate-pulse" />
      <div class="w-28 h-4 bg-gray-200 rounded animate-pulse" />
    </div>
    <div class="flex gap-2 overflow-hidden">
      <div v-for="i in 5" :key="i" class="min-w-[56px] h-[72px] bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getWeatherIcon, formatTemp } from '~/composables/useWeather'
import type { TemperatureUnit } from '~/types'

interface Props {
  cityName: string
  countryCode: string
  startDate: string | Date
  endDate: string | Date
}

const props = defineProps<Props>()
const { locale } = useI18n()

const { user } = useAuth()
const tempUnit = computed<TemperatureUnit>(() => user.value?.temperatureUnit || 'celsius')

const { fetchWeather, loading } = useWeather()

const normalizedStart = computed(() => {
  if (!props.startDate) return ''
  if (typeof props.startDate === 'string') return props.startDate
  return props.startDate.toISOString().split('T')[0]
})

const normalizedEnd = computed(() => {
  if (!props.endDate) return ''
  if (typeof props.endDate === 'string') return props.endDate
  return props.endDate.toISOString().split('T')[0]
})

const weather = ref<Awaited<ReturnType<typeof fetchWeather>>>(null)

watch(
  [() => props.cityName, () => props.countryCode, normalizedStart, normalizedEnd],
  async ([city, cc, start, end]) => {
    if (!city || !start || !end) {
      weather.value = null
      return
    }
    weather.value = await fetchWeather(city, cc, start, end)
  },
  { immediate: true }
)

function formatWeekday(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return localeDateString(d, dateLocale, { weekday: 'short', timeZone: 'UTC' })
}
</script>
