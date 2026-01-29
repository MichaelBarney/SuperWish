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
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import type { Destination, DestinationForm } from '~/types'

export function useDestinations(tripId: Ref<string | null | undefined>) {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const destinations = ref<Destination[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToDestinations = (targetTripId?: string | null) => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    const tid = targetTripId ?? tripId.value
    if (!tid) return

    loading.value = true
    error.value = null

    const destinationsRef = collection(db, 'destinations')
    const q = query(
      destinationsRef,
      where('userId', '==', user.value.uid),
      where('tripId', '==', tid),
      orderBy('order', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        destinations.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            tripId: data.tripId,
            userId: data.userId,
            name: data.name,
            country: data.country,
            countryCode: data.countryCode || '',
            arrivalDate: data.arrivalDate ? (data.arrivalDate as Timestamp).toDate() : null,
            departureDate: data.departureDate ? (data.departureDate as Timestamp).toDate() : null,
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
            order: data.order || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Destination
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching destinations:', err)
        error.value = 'Failed to load destinations'
        loading.value = false
      }
    )
  }

  const unsubscribeFromDestinations = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createDestination = async (targetTripId: string, data: DestinationForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      // Get the highest order number
      const maxOrder = destinations.value.reduce((max, d) => Math.max(max, d.order), -1)

      const destinationsRef = collection(db, 'destinations')
      const docRef = await addDoc(destinationsRef, {
        tripId: targetTripId,
        userId: user.value.uid,
        name: data.name,
        country: data.country,
        countryCode: data.countryCode || '',
        arrivalDate: data.arrivalDate ? Timestamp.fromDate(new Date(data.arrivalDate)) : null,
        departureDate: data.departureDate ? Timestamp.fromDate(new Date(data.departureDate)) : null,
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating destination:', err)
      return { success: false, error: 'Failed to create destination' }
    }
  }

  const updateDestination = async (id: string, data: Partial<DestinationForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const destinationRef = doc(db, 'destinations', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.country !== undefined) updateData.country = data.country
      if (data.countryCode !== undefined) updateData.countryCode = data.countryCode
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.arrivalDate !== undefined) {
        updateData.arrivalDate = data.arrivalDate ? Timestamp.fromDate(new Date(data.arrivalDate)) : null
      }
      if (data.departureDate !== undefined) {
        updateData.departureDate = data.departureDate ? Timestamp.fromDate(new Date(data.departureDate)) : null
      }

      await updateDoc(destinationRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating destination:', err)
      return { success: false, error: 'Failed to update destination' }
    }
  }

  const deleteDestination = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const destinationRef = doc(db, 'destinations', id)
      await deleteDoc(destinationRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting destination:', err)
      return { success: false, error: 'Failed to delete destination' }
    }
  }

  const reorderDestinations = async (orderedIds: string[]) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const batch = writeBatch(db)

      orderedIds.forEach((id, index) => {
        const destinationRef = doc(db, 'destinations', id)
        batch.update(destinationRef, {
          order: index,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
      return { success: true }
    } catch (err) {
      console.error('Error reordering destinations:', err)
      return { success: false, error: 'Failed to reorder destinations' }
    }
  }

  const getDestinationById = (id: string): Destination | undefined => {
    return destinations.value.find(d => d.id === id)
  }

  // Auto-subscribe when user or tripId changes (only on client)
  if (import.meta.client) {
    watch([user, tripId], ([newUser, newTripId]) => {
      unsubscribeFromDestinations()
      if (newUser && newTripId) {
        subscribeToDestinations(newTripId)
      } else {
        destinations.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromDestinations()
    })
  }

  return {
    destinations: readonly(destinations),
    loading: readonly(loading),
    error: readonly(error),
    createDestination,
    updateDestination,
    deleteDestination,
    reorderDestinations,
    getDestinationById,
    subscribeToDestinations,
    unsubscribeFromDestinations,
  }
}
