import type { WeatherDay, LocationWeather } from '~/types'

const GEO_CACHE_KEY = 'weather_geo_'
const FORECAST_CACHE_KEY = 'weather_forecast_'
const HISTORICAL_CACHE_KEY = 'weather_historical_'
const FORECAST_CACHE_MS = 3 * 60 * 60 * 1000 // 3 hours
const HISTORICAL_CACHE_MS = 7 * 24 * 60 * 60 * 1000 // 1 week

interface GeoResult {
  lat: number
  lon: number
}

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

// In-memory caches
const geoCache = new Map<string, GeoResult>()
const weatherCache = new Map<string, CacheEntry<LocationWeather>>()

function getStorageItem<T>(key: string): T | null {
  if (!import.meta.client) return null
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch {}
  return null
}

function setStorageItem(key: string, value: unknown) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

async function geocodeCity(name: string, countryCode?: string): Promise<GeoResult | null> {
  const cacheKey = `${name.toLowerCase()}_${countryCode || ''}`

  // In-memory
  if (geoCache.has(cacheKey)) return geoCache.get(cacheKey)!

  // localStorage
  const stored = getStorageItem<GeoResult>(GEO_CACHE_KEY + cacheKey)
  if (stored) {
    geoCache.set(cacheKey, stored)
    return stored
  }

  try {
    const count = countryCode ? 5 : 1
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=${count}&language=en`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.results?.length) return null

    // If countryCode provided, try to match; otherwise use first result
    let result = data.results[0]
    if (countryCode) {
      const match = data.results.find((r: { country_code: string }) => r.country_code?.toUpperCase() === countryCode.toUpperCase())
      if (match) result = match
    }

    const geo: GeoResult = { lat: result.latitude, lon: result.longitude }
    geoCache.set(cacheKey, geo)
    setStorageItem(GEO_CACHE_KEY + cacheKey, geo)
    return geo
  } catch (err) {
    console.error('Geocoding failed:', err)
    return null
  }
}

function formatDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

async function fetchForecastData(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&start_date=${startDate}&end_date=${endDate}&timezone=auto`
  const response = await fetch(url)
  if (!response.ok) return []

  const data = await response.json()
  if (!data.daily?.time) return []

  return data.daily.time.map((date: string, i: number) => ({
    date,
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    weatherCode: data.daily.weather_code[i],
    precipitationProbability: data.daily.precipitation_probability_max?.[i],
  }))
}

async function fetchHistoricalData(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&start_date=${startDate}&end_date=${endDate}&timezone=auto`
  const response = await fetch(url)
  if (!response.ok) return []

  const data = await response.json()
  if (!data.daily?.time) return []

  return data.daily.time.map((date: string, i: number) => ({
    date,
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    weatherCode: data.daily.weather_code[i],
  }))
}

function shiftDatesBack(startDate: string, endDate: string): { start: string; end: string } {
  const s = new Date(startDate + 'T12:00:00')
  const e = new Date(endDate + 'T12:00:00')
  s.setFullYear(s.getFullYear() - 1)
  e.setFullYear(e.getFullYear() - 1)
  return { start: formatDateStr(s), end: formatDateStr(e) }
}

function shiftDaysToOriginal(days: WeatherDay[], originalStart: string, yearOffset: number): WeatherDay[] {
  return days.map(day => {
    const d = new Date(day.date + 'T12:00:00')
    d.setFullYear(d.getFullYear() + yearOffset)
    return { ...day, date: formatDateStr(d) }
  })
}

export function toFahrenheit(celsius: number): number {
  return celsius * 9 / 5 + 32
}

export function formatTemp(celsius: number, unit: 'celsius' | 'fahrenheit'): number {
  return Math.round(unit === 'fahrenheit' ? toFahrenheit(celsius) : celsius)
}

export function getWeatherIcon(code: number): string {
  if (code === 0) return 'lucide:sun'
  if (code <= 3) return 'lucide:cloud-sun'
  if (code <= 48) return 'lucide:cloud-fog'
  if (code <= 57) return 'lucide:cloud-drizzle'
  if (code <= 67) return 'lucide:cloud-rain'
  if (code <= 77) return 'lucide:cloud-snow'
  if (code <= 82) return 'lucide:cloud-rain'
  if (code >= 95) return 'lucide:cloud-lightning'
  return 'lucide:cloud'
}

export function getWeatherLabelKey(code: number): string {
  if (code === 0) return 'travel.weather.clear'
  if (code <= 2) return 'travel.weather.partlyCloudy'
  if (code === 3) return 'travel.weather.cloudy'
  if (code <= 48) return 'travel.weather.fog'
  if (code <= 57) return 'travel.weather.drizzle'
  if (code <= 67) return 'travel.weather.rain'
  if (code <= 77) return 'travel.weather.snow'
  if (code <= 82) return 'travel.weather.showers'
  if (code >= 95) return 'travel.weather.thunderstorm'
  return 'travel.weather.cloudy'
}

export function useWeather() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchWeather(
    cityName: string,
    countryCode: string,
    startDate: string,
    endDate: string
  ): Promise<LocationWeather | null> {
    if (!cityName || !startDate || !endDate) return null

    const cacheKey = `${cityName.toLowerCase()}_${countryCode}_${startDate}_${endDate}`

    // Check in-memory cache
    const cached = weatherCache.get(cacheKey)
    if (cached) {
      const expiryMs = cached.data.isHistorical ? HISTORICAL_CACHE_MS : FORECAST_CACHE_MS
      if (Date.now() - cached.fetchedAt < expiryMs) return cached.data
    }

    // Check localStorage
    const storedKey = (startDate < formatDateStr(new Date()) ? HISTORICAL_CACHE_KEY : FORECAST_CACHE_KEY) + cacheKey
    const stored = getStorageItem<CacheEntry<LocationWeather>>(storedKey)
    if (stored) {
      const expiryMs = stored.data.isHistorical ? HISTORICAL_CACHE_MS : FORECAST_CACHE_MS
      if (Date.now() - stored.fetchedAt < expiryMs) {
        weatherCache.set(cacheKey, stored)
        return stored.data
      }
    }

    try {
      loading.value = true
      error.value = null

      const geo = await geocodeCity(cityName, countryCode)
      if (!geo) {
        error.value = 'Could not find city location'
        return null
      }

      const today = formatDateStr(new Date())
      const maxForecastDate = formatDateStr(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000))

      let days: WeatherDay[] = []
      let isHistorical = false

      if (endDate < today) {
        // All dates in the past — use historical API
        days = await fetchHistoricalData(geo.lat, geo.lon, startDate, endDate)
        isHistorical = false // actual past data, not estimated
      } else if (startDate <= maxForecastDate) {
        // Some or all dates within forecast range
        const forecastEnd = endDate <= maxForecastDate ? endDate : maxForecastDate
        days = await fetchForecastData(geo.lat, geo.lon, startDate > today ? startDate : today, forecastEnd)

        // If range extends past forecast, fill with historical from last year
        if (endDate > maxForecastDate) {
          const histStart = formatDateStr(new Date(new Date(maxForecastDate + 'T12:00:00').getTime() + 24 * 60 * 60 * 1000))
          const shifted = shiftDatesBack(histStart, endDate)
          const histDays = await fetchHistoricalData(geo.lat, geo.lon, shifted.start, shifted.end)
          const shiftedBack = shiftDaysToOriginal(histDays, histStart, 1)
          days = [...days, ...shiftedBack]
          isHistorical = true
        }
      } else {
        // All dates beyond forecast — use last year's data
        const shifted = shiftDatesBack(startDate, endDate)
        const histDays = await fetchHistoricalData(geo.lat, geo.lon, shifted.start, shifted.end)
        days = shiftDaysToOriginal(histDays, startDate, 1)
        isHistorical = true
      }

      const result: LocationWeather = {
        cityName,
        days,
        isHistorical,
      }

      const entry: CacheEntry<LocationWeather> = { data: result, fetchedAt: Date.now() }
      weatherCache.set(cacheKey, entry)
      setStorageItem(storedKey, entry)

      return result
    } catch (err) {
      console.error('Weather fetch failed:', err)
      error.value = 'Failed to fetch weather'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchWeather,
  }
}
