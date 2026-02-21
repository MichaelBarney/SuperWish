import { httpsCallable } from 'firebase/functions'

export interface UrlMetadata {
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
  price: number | null
  currency: string | null
}

export function useUrlMetadata() {
  const { $functions } = useNuxtApp()
  const loading = ref(false)
  const error = ref<string | null>(null)

  function isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }

  async function fetchMetadata(url: string): Promise<UrlMetadata | null> {
    if (!url.trim() || !isValidUrl(url)) {
      console.log('[useUrlMetadata] Invalid or empty URL:', url)
      return null
    }

    console.log('[useUrlMetadata] Fetching metadata for:', url)
    loading.value = true
    error.value = null

    try {
      const fetchFn = httpsCallable<{ url: string }, UrlMetadata>(
        $functions,
        'fetchUrlMetadata'
      )
      const response = await fetchFn({ url: url.trim() })
      console.log('[useUrlMetadata] Response received:', response.data)
      return response.data
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to fetch URL metadata'
      console.error('[useUrlMetadata] Error:', e)
      error.value = message
      return null
    } finally {
      loading.value = false
    }
  }

  function clear() {
    error.value = null
  }

  return { loading, error, fetchMetadata, isValidUrl, clear }
}
