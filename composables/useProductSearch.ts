import { httpsCallable } from 'firebase/functions'
import type { ProductSearchResult } from '~/types'
import { getRegion } from '~/types'

export function useProductSearch() {
  const { $functions } = useNuxtApp()
  const results = ref<ProductSearchResult[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function search(query: string, regionCode?: string) {
    if (!query.trim()) return

    loading.value = true
    error.value = null
    results.value = []

    const region = getRegion(regionCode || 'US')

    try {
      const searchFn = httpsCallable<
        { query: string; gl?: string; hl?: string; location?: string; domain?: string },
        { results: ProductSearchResult[] }
      >(
        $functions,
        'searchProducts'
      )
      const response = await searchFn({
        query: query.trim(),
        gl: region.serpApi.gl,
        hl: region.serpApi.hl,
        location: region.serpApi.location,
        domain: region.serpApi.domain,
      })
      results.value = response.data.results
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Search failed'
      error.value = message
    } finally {
      loading.value = false
    }
  }

  function clear() {
    results.value = []
    error.value = null
  }

  return { results, loading, error, search, clear }
}
