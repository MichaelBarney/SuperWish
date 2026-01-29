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
import type { Trip, TripForm, TripStatus } from '~/types'

export function useTrips() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const trips = ref<Trip[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToTrips = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    const tripsRef = collection(db, 'trips')
    const q = query(
      tripsRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        trips.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            userId: data.userId,
            name: data.name,
            description: data.description || '',
            coverUrl: data.coverUrl || '',
            startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
            endDate: data.endDate ? (data.endDate as Timestamp).toDate() : null,
            baseCurrency: data.baseCurrency || 'USD',
            totalBudget: data.totalBudget || undefined,
            status: data.status || 'planning',
            origin: data.origin || undefined,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Trip
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching trips:', err)
        error.value = 'Failed to load trips'
        loading.value = false
      }
    )
  }

  const unsubscribeFromTrips = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createTrip = async (data: TripForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const tripsRef = collection(db, 'trips')
      const origin = data.originName ? {
        name: data.originName,
        country: data.originCountry || '',
        countryCode: data.originCountryCode || '',
      } : null
      const docRef = await addDoc(tripsRef, {
        userId: user.value.uid,
        name: data.name,
        description: data.description || '',
        coverUrl: data.coverUrl || '',
        startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : null,
        endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
        baseCurrency: data.baseCurrency || 'USD',
        totalBudget: data.totalBudget ? parseFloat(data.totalBudget) : null,
        status: data.status || 'planning',
        origin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating trip:', err)
      return { success: false, error: 'Failed to create trip' }
    }
  }

  const updateTrip = async (id: string, data: Partial<TripForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const tripRef = doc(db, 'trips', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl
      if (data.baseCurrency !== undefined) updateData.baseCurrency = data.baseCurrency
      if (data.status !== undefined) updateData.status = data.status
      if (data.totalBudget !== undefined) {
        updateData.totalBudget = data.totalBudget ? parseFloat(data.totalBudget) : null
      }
      if (data.startDate !== undefined) {
        updateData.startDate = data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : null
      }
      if (data.endDate !== undefined) {
        updateData.endDate = data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null
      }
      if (data.originName !== undefined) {
        updateData.origin = data.originName ? {
          name: data.originName,
          country: data.originCountry || '',
          countryCode: data.originCountryCode || '',
        } : null
      }

      await updateDoc(tripRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating trip:', err)
      return { success: false, error: 'Failed to update trip' }
    }
  }

  const updateTripStatus = async (id: string, status: TripStatus) => {
    return updateTrip(id, { status })
  }

  const deleteTrip = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const tripRef = doc(db, 'trips', id)
      await deleteDoc(tripRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting trip:', err)
      return { success: false, error: 'Failed to delete trip' }
    }
  }

  const getTripById = (id: string): Trip | undefined => {
    return trips.value.find(trip => trip.id === id)
  }

  // Auto-subscribe when user changes (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToTrips()
      } else {
        unsubscribeFromTrips()
        trips.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromTrips()
    })
  }

  return {
    trips: readonly(trips),
    loading: readonly(loading),
    error: readonly(error),
    createTrip,
    updateTrip,
    updateTripStatus,
    deleteTrip,
    getTripById,
    subscribeToTrips,
    unsubscribeFromTrips,
  }
}
