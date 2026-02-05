/**
 * Composable to fetch city images from Unsplash API
 * Uses the official Unsplash API with search endpoint
 * Caches fetched URLs in localStorage to avoid repeated API calls
 */

const UNSPLASH_ACCESS_KEY = 'yuejBM7Bwy2n9cLSfad_hj1rcGYO2UjnvcvXj0F0Qj4'
const CACHE_KEY = 'city-image-cache'
const CACHE_EXPIRY_HOURS = 24 * 7 // 1 week

interface CacheEntry {
  url: string
  timestamp: number
}

interface CacheData {
  [cityKey: string]: CacheEntry
}

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
}

interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

function getCityKey(cityName: string): string {
  return cityName.toLowerCase().trim().replace(/\s+/g, '-')
}

function getCache(): CacheData {
  if (typeof window === 'undefined') return {}
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : {}
  } catch {
    return {}
  }
}

function setCache(data: CacheData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage might be full or disabled
  }
}

function isCacheValid(entry: CacheEntry): boolean {
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000
  return Date.now() - entry.timestamp < expiryMs
}

async function fetchCityImageFromUnsplash(city: string): Promise<string | null> {
  const query = encodeURIComponent(`${city} city skyline`)
  const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })

    if (!response.ok) {
      console.warn(`Unsplash API error: ${response.status}`)
      return null
    }

    const data: UnsplashSearchResponse = await response.json()
    return data.results?.[0]?.urls?.regular || null
  } catch (error) {
    console.warn('Failed to fetch from Unsplash:', error)
    return null
  }
}

export function useCityImage(cityName: Ref<string> | string, options: { autoFetch?: boolean } = {}) {
  const { autoFetch = true } = options // Enabled by default
  const cityNameRef = isRef(cityName) ? cityName : ref(cityName)
  const imageUrl = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const fetchImage = async () => {
    if (!autoFetch) {
      imageUrl.value = null
      return
    }

    const city = cityNameRef.value
    if (!city) {
      imageUrl.value = null
      return
    }

    const cityKey = getCityKey(city)
    const cache = getCache()

    // Check cache first
    if (cache[cityKey] && isCacheValid(cache[cityKey])) {
      imageUrl.value = cache[cityKey].url
      return
    }

    loading.value = true
    error.value = null

    try {
      // Fetch from Unsplash API
      const url = await fetchCityImageFromUnsplash(city)

      if (url) {
        imageUrl.value = url

        // Cache the URL
        cache[cityKey] = {
          url,
          timestamp: Date.now()
        }
        setCache(cache)
      } else {
        imageUrl.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e : new Error('Failed to fetch city image')
      imageUrl.value = null
    } finally {
      loading.value = false
    }
  }

  // Watch for city name changes
  watch(cityNameRef, () => {
    fetchImage()
  }, { immediate: true })

  return {
    imageUrl: readonly(imageUrl),
    loading: readonly(loading),
    error: readonly(error),
    refetch: fetchImage
  }
}

/**
 * Get a gradient fallback for when images are not available
 * Returns a gradient based on the destination order for visual variety
 */
export function getGradientFallback(index: number = 0): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  ]
  return gradients[index % gradients.length]
}
