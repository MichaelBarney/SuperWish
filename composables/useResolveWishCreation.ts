import { getRegionCurrency } from '~/types'

export function useResolveWishCreation() {
  const { createWish } = useWishes()
  const { user } = useAuth()

  const resolveWishId = async (wishId: string, title: string): Promise<string> => {
    if (wishId !== '__create__') return wishId

    const currency = user.value?.defaultRegion
      ? getRegionCurrency(user.value.defaultRegion)
      : 'USD'

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

    return result.success && result.id ? result.id : ''
  }

  return { resolveWishId }
}
