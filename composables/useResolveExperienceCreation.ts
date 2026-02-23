import type { ExperienceCategory } from '~/types'
import { getRegionCurrency } from '~/types'

export interface CreateExperienceData {
  category: ExperienceCategory
  city: string
  country: string
  countryCode: string
}

export function useResolveExperienceCreation() {
  const { createExperience } = useXPExperiences()
  const { user } = useAuth()

  const resolveExperienceId = async (
    experienceId: string,
    title: string,
    createData?: CreateExperienceData
  ): Promise<string> => {
    if (experienceId !== '__create__') return experienceId
    if (!createData) return ''

    const currency = user.value?.defaultRegion
      ? getRegionCurrency(user.value.defaultRegion)
      : 'USD'

    const result = await createExperience({
      destinationId: '',
      category: createData.category,
      name: title,
      description: '',
      address: '',
      scheduledDate: '',
      scheduledTime: '',
      duration: '',
      status: 'wishlist',
      bookingReference: '',
      bookingUrl: '',
      estimatedCost: '',
      actualCost: '',
      currency,
      rating: '',
      notes: '',
      imageUrl: '',
      externalUrl: '',
      country: createData.country,
      city: createData.city,
      countryCode: createData.countryCode,
    })

    return result.success && result.id ? result.id : ''
  }

  return { resolveExperienceId }
}
