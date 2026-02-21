import type { ExchangeRate, ConvertedAmount } from '~/types'

const CACHE_KEY_PREFIX = 'exchange_rate_'
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours for latest rates

// In-memory cache for current session
const rateCache = new Map<string, ExchangeRate>()

export function useCurrencyConversion() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getCacheKey = (from: string, to: string, date?: Date): string => {
    const dateStr = date ? formatDate(date) : 'latest'
    return `${CACHE_KEY_PREFIX}${from}_${to}_${dateStr}`
  }

  const getCachedRate = (from: string, to: string, date?: Date): ExchangeRate | null => {
    const key = getCacheKey(from, to, date)

    // Check in-memory cache first
    if (rateCache.has(key)) {
      const cached = rateCache.get(key)!
      // Historical rates don't expire, latest rates expire after 24h
      if (date || Date.now() - cached.fetchedAt.getTime() < CACHE_EXPIRY_MS) {
        return cached
      }
    }

    // Check localStorage
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          const parsed = JSON.parse(stored)
          const rate: ExchangeRate = {
            ...parsed,
            fetchedAt: new Date(parsed.fetchedAt),
          }
          // Historical rates don't expire
          if (date || Date.now() - rate.fetchedAt.getTime() < CACHE_EXPIRY_MS) {
            rateCache.set(key, rate)
            return rate
          }
        }
      } catch (e) {
        console.error('Error reading from cache:', e)
      }
    }

    return null
  }

  const setCachedRate = (from: string, to: string, rate: number, date?: Date) => {
    const key = getCacheKey(from, to, date)
    const exchangeRate: ExchangeRate = {
      fromCurrency: from,
      toCurrency: to,
      rate,
      fetchedAt: new Date(),
    }

    rateCache.set(key, exchangeRate)

    if (import.meta.client) {
      try {
        localStorage.setItem(key, JSON.stringify(exchangeRate))
      } catch (e) {
        console.error('Error writing to cache:', e)
      }
    }
  }

  const fetchRate = async (from: string, to: string, date?: Date): Promise<number | null> => {
    // Same currency, rate is 1
    if (from === to) return 1

    // Check cache first
    const cached = getCachedRate(from, to, date)
    if (cached) return cached.rate

    try {
      loading.value = true
      error.value = null

      // Use exchangerate.host API
      let url: string
      if (date) {
        const dateStr = formatDate(date)
        url = `https://api.exchangerate.host/${dateStr}?base=${from}&symbols=${to}`
      } else {
        url = `https://api.exchangerate.host/latest?base=${from}&symbols=${to}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success && data.error) {
        throw new Error(data.error.info || 'API error')
      }

      const rate = data.rates?.[to]
      if (typeof rate !== 'number') {
        throw new Error('Invalid rate data')
      }

      // Cache the rate
      setCachedRate(from, to, rate, date)

      return rate
    } catch (err) {
      console.error('Error fetching exchange rate:', err)
      error.value = 'Failed to fetch exchange rate'

      // If historical rate fails, try to get latest rate as fallback
      if (date) {
        const latestCached = getCachedRate(from, to)
        if (latestCached) return latestCached.rate

        // Try fetching latest
        try {
          const latestUrl = `https://api.exchangerate.host/latest?base=${from}&symbols=${to}`
          const latestResponse = await fetch(latestUrl)
          const latestData = await latestResponse.json()
          const latestRate = latestData.rates?.[to]
          if (typeof latestRate === 'number') {
            setCachedRate(from, to, latestRate)
            return latestRate
          }
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
        }
      }

      return null
    } finally {
      loading.value = false
    }
  }

  const getRate = async (from: string, to: string, date?: Date): Promise<number> => {
    const rate = await fetchRate(from, to, date)
    return rate ?? 1 // Default to 1 if rate fetch fails
  }

  const convert = async (
    amount: number,
    from: string,
    to: string,
    date?: Date
  ): Promise<ConvertedAmount> => {
    const rate = await getRate(from, to, date)
    const convertedAmount = amount * rate

    return {
      originalAmount: amount,
      originalCurrency: from,
      convertedAmount,
      targetCurrency: to,
      exchangeRate: rate,
      rateDate: date || new Date(),
    }
  }

  const convertMany = async (
    items: { amount: number; currency: string }[],
    targetCurrency: string,
    date?: Date
  ): Promise<ConvertedAmount[]> => {
    // Group by currency to minimize API calls
    const currencies = [...new Set(items.map(i => i.currency))]

    // Prefetch all rates
    await Promise.all(
      currencies.map(currency => fetchRate(currency, targetCurrency, date))
    )

    // Now convert all items (rates are cached)
    return Promise.all(
      items.map(item => convert(item.amount, item.currency, targetCurrency, date))
    )
  }

  const clearCache = () => {
    rateCache.clear()
    if (import.meta.client) {
      // Remove all exchange rate keys from localStorage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  }

  const preloadRates = async (currencies: string[], baseCurrency: string): Promise<void> => {
    await Promise.all(
      currencies
        .filter(c => c !== baseCurrency)
        .map(currency => fetchRate(currency, baseCurrency))
    )
  }

  // Format converted amount for display
  const formatConverted = (converted: ConvertedAmount, locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: converted.targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted.convertedAmount)
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getRate,
    convert,
    convertMany,
    clearCache,
    preloadRates,
    formatConverted,
  }
}
