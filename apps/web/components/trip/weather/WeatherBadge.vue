<template>
  <div
    v-if="summary"
    class="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full"
  >
    <Icon :name="summary.icon" class="w-3.5 h-3.5" />
    <span>{{ summary.tempMin }}–{{ summary.tempMax }}°</span>
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

const { user } = useAuth()
const tempUnit = computed<TemperatureUnit>(() => user.value?.temperatureUnit || 'celsius')

const { fetchWeather } = useWeather()

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

const summary = computed(() => {
  if (!weather.value || weather.value.days.length === 0) return null

  const days = weather.value.days
  const tempMax = formatTemp(Math.max(...days.map(d => d.temperatureMax)), tempUnit.value)
  const tempMin = formatTemp(Math.min(...days.map(d => d.temperatureMin)), tempUnit.value)

  // Most common weather code
  const codeCounts = new Map<number, number>()
  for (const day of days) {
    codeCounts.set(day.weatherCode, (codeCounts.get(day.weatherCode) || 0) + 1)
  }
  let mostCommonCode = days[0].weatherCode
  let maxCount = 0
  for (const [code, count] of codeCounts) {
    if (count > maxCount) {
      mostCommonCode = code
      maxCount = count
    }
  }

  return {
    icon: getWeatherIcon(mostCommonCode),
    tempMax,
    tempMin,
  }
})
</script>
