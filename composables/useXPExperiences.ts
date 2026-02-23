import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { Experience, ExperienceForm, ExperienceCategory } from '~/types'

export interface LocationCity {
  city: string
  experiences: Experience[]
}

export interface LocationGroup {
  country: string
  countryCode: string
  cities: LocationCity[]
}

export function useXPExperiences() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const experiences = ref<Experience[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  // Fetch all destinations for client-side join (for legacy experiences without denormalized location)
  const { destinations: allDestinations } = useAllDestinations()

  const subscribeToAllExperiences = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    const experiencesRef = collection(db, 'experiences')
    const q = query(
      experiencesRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        experiences.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            tripId: data.tripId || undefined,
            userId: data.userId,
            destinationId: data.destinationId || undefined,
            category: data.category,
            name: data.name,
            description: data.description || '',
            address: data.address || '',
            scheduledDate: data.scheduledDate ? (data.scheduledDate as Timestamp).toDate() : null,
            scheduledTime: data.scheduledTime || '',
            duration: data.duration || 0,
            status: data.status || 'wishlist',
            bookingReference: data.bookingReference || '',
            bookingUrl: data.bookingUrl || '',
            estimatedCost: data.estimatedCost || 0,
            actualCost: data.actualCost || 0,
            currency: data.currency || 'USD',
            convertedCost: data.convertedCost || 0,
            rating: data.rating || 0,
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
            externalUrl: data.externalUrl || '',
            country: data.country || '',
            city: data.city || '',
            countryCode: data.countryCode || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Experience
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching all experiences:', err)
        error.value = 'Failed to load experiences'
        loading.value = false
      }
    )
  }

  const unsubscribeFromAllExperiences = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Resolve location for experiences that don't have denormalized country/city
  const resolvedExperiences = computed(() => {
    return experiences.value.map(exp => {
      if (exp.country && exp.city) return exp
      // Try to resolve from destination
      if (exp.destinationId) {
        const dest = allDestinations.value.find(d => d.id === exp.destinationId)
        if (dest) {
          return {
            ...exp,
            country: exp.country || dest.country,
            city: exp.city || dest.name,
            countryCode: exp.countryCode || dest.countryCode || '',
          }
        }
      }
      return exp
    })
  })

  const totalCount = computed(() => resolvedExperiences.value.length)

  // Group by category
  const experiencesByCategory = computed(() => {
    const grouped: Record<string, Experience[]> = {}
    for (const exp of resolvedExperiences.value) {
      const cat = exp.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(exp)
    }
    // Sort experiences within each category by name
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => a.name.localeCompare(b.name))
    }
    return grouped as Record<ExperienceCategory, Experience[]>
  })

  // Group by location (country > city)
  const experiencesByLocation = computed(() => {
    const countryMap: Record<string, { countryCode: string; cityMap: Record<string, Experience[]> }> = {}
    const noLocation: Experience[] = []

    for (const exp of resolvedExperiences.value) {
      if (!exp.country) {
        noLocation.push(exp)
        continue
      }
      if (!countryMap[exp.country]) {
        countryMap[exp.country] = { countryCode: exp.countryCode || '', cityMap: {} }
      }
      const city = exp.city || 'Unknown'
      if (!countryMap[exp.country].cityMap[city]) {
        countryMap[exp.country].cityMap[city] = []
      }
      countryMap[exp.country].cityMap[city].push(exp)
    }

    const groups: LocationGroup[] = Object.entries(countryMap)
      .map(([country, { countryCode, cityMap }]) => ({
        country,
        countryCode,
        cities: Object.entries(cityMap)
          .map(([city, exps]) => ({ city, experiences: exps }))
          .sort((a, b) => a.city.localeCompare(b.city)),
      }))
      .sort((a, b) => a.country.localeCompare(b.country))

    return { groups, noLocation }
  })

  const createExperience = async (data: ExperienceForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const experiencesRef = collection(db, 'experiences')
      const docRef = await addDoc(experiencesRef, {
        userId: user.value.uid,
        category: data.category,
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        scheduledDate: data.scheduledDate ? Timestamp.fromDate(new Date(data.scheduledDate + 'T12:00:00')) : null,
        scheduledTime: data.scheduledTime || '',
        duration: data.duration ? Number(data.duration) : 0,
        status: data.status || 'wishlist',
        bookingReference: data.bookingReference || '',
        bookingUrl: data.bookingUrl || '',
        estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : 0,
        actualCost: data.actualCost ? Number(data.actualCost) : 0,
        currency: data.currency || 'USD',
        rating: data.rating ? Number(data.rating) : 0,
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        externalUrl: data.externalUrl || '',
        country: data.country || '',
        city: data.city || '',
        countryCode: data.countryCode || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating experience:', err)
      return { success: false, error: 'Failed to create experience' }
    }
  }

  const updateExperience = async (id: string, data: Partial<ExperienceForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const experienceRef = doc(db, 'experiences', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.category !== undefined) updateData.category = data.category
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.address !== undefined) updateData.address = data.address
      if (data.scheduledDate !== undefined) {
        updateData.scheduledDate = data.scheduledDate ? Timestamp.fromDate(new Date(data.scheduledDate + 'T12:00:00')) : null
      }
      if (data.scheduledTime !== undefined) updateData.scheduledTime = data.scheduledTime
      if (data.duration !== undefined) updateData.duration = data.duration ? Number(data.duration) : 0
      if (data.status !== undefined) updateData.status = data.status
      if (data.bookingReference !== undefined) updateData.bookingReference = data.bookingReference
      if (data.bookingUrl !== undefined) updateData.bookingUrl = data.bookingUrl
      if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost ? Number(data.estimatedCost) : 0
      if (data.actualCost !== undefined) updateData.actualCost = data.actualCost ? Number(data.actualCost) : 0
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.rating !== undefined) updateData.rating = data.rating ? Number(data.rating) : 0
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl
      if (data.country !== undefined) updateData.country = data.country
      if (data.city !== undefined) updateData.city = data.city
      if (data.countryCode !== undefined) updateData.countryCode = data.countryCode

      await updateDoc(experienceRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating experience:', err)
      return { success: false, error: 'Failed to update experience' }
    }
  }

  const deleteExperience = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const experienceRef = doc(db, 'experiences', id)
      await deleteDoc(experienceRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting experience:', err)
      return { success: false, error: 'Failed to delete experience' }
    }
  }

  // Auto-subscribe when user changes (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      unsubscribeFromAllExperiences()
      if (newUser) {
        subscribeToAllExperiences()
      } else {
        experiences.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromAllExperiences()
    })
  }

  return {
    experiences: resolvedExperiences,
    loading: readonly(loading),
    error: readonly(error),
    totalCount,
    experiencesByCategory,
    experiencesByLocation,
    createExperience,
    updateExperience,
    deleteExperience,
  }
}
