import type { City } from '~/types'

// Singleton state for cities data (shared across all instances)
const cities = ref<City[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref<string | null>(null)

export function useCityAutocomplete() {
  // Lazy load cities data on first use
  const loadCities = async () => {
    if (loaded.value || loading.value) return

    loading.value = true
    error.value = null

    try {
      const response = await fetch('/data/cities.json')
      if (!response.ok) {
        throw new Error(`Failed to load cities: ${response.status}`)
      }
      cities.value = await response.json()
      loaded.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load cities data'
      console.error('Error loading cities:', e)
    } finally {
      loading.value = false
    }
  }

  // Filter cities by query - optimized for performance
  const filterCities = (query: string, limit: number = 10): City[] => {
    if (!query || query.length < 2 || !loaded.value) return []

    const normalizedQuery = query.toLowerCase().trim()
    const results: City[] = []
    const seen = new Set<string>()

    // Helper to add unique results
    const addResult = (city: City): boolean => {
      const key = `${city.name}-${city.countryCode}`
      if (!seen.has(key) && results.length < limit) {
        seen.add(key)
        results.push(city)
        return true
      }
      return false
    }

    // First pass: exact prefix matches on city name (highest priority)
    for (const city of cities.value) {
      if (results.length >= limit) break
      if (city.name.toLowerCase().startsWith(normalizedQuery)) {
        addResult(city)
      }
    }

    // Second pass: contains matches on city name
    if (results.length < limit) {
      for (const city of cities.value) {
        if (results.length >= limit) break
        if (city.name.toLowerCase().includes(normalizedQuery)) {
          addResult(city)
        }
      }
    }

    // Third pass: matches on country name
    if (results.length < limit) {
      for (const city of cities.value) {
        if (results.length >= limit) break
        if (city.country.toLowerCase().includes(normalizedQuery)) {
          addResult(city)
        }
      }
    }

    return results
  }

  return {
    cities: readonly(cities),
    loading: readonly(loading),
    loaded: readonly(loaded),
    error: readonly(error),
    loadCities,
    filterCities,
  }
}
