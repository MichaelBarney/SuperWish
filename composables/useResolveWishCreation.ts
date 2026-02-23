import { getRegionCurrency } from '~/types'

export function useResolveWishCreation() {
  const { createWish } = useWishes()
  const { user } = useAuth()

  const resolveWishId = async (wishId: string, title: string): Promise<string> => {
    console.log('[resolveWishId] input wishId:', JSON.stringify(wishId), 'title:', title)
    if (wishId !== '__create__') {
      console.log('[resolveWishId] not sentinel, returning as-is:', wishId)
      return wishId
    }

    console.log('[resolveWishId] sentinel detected, creating wish...')
    const currency = user.value?.defaultRegion
      ? getRegionCurrency(user.value.defaultRegion)
      : 'USD'
    console.log('[resolveWishId] currency:', currency, 'user:', user.value?.uid)

    const result = await createWish(null, {
      title,
      description: '',
      imageUrl: '',
      shoppingLinks: [],
      expectedPrice: '',
      targetPrice: '',
      priceSources: [],
      currency,
      priority: 3,
      status: 'wanted',
      trackingUrl: '',
      estimatedDelivery: '',
      forPerson: '',
      questions: [],
    }, { skipAutoTask: true })

    console.log('[resolveWishId] createWish result:', JSON.stringify(result))
    return result.success && result.id ? result.id : ''
  }

  return { resolveWishId }
}
