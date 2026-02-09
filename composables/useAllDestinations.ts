import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { Destination } from '~/types'

export function useAllDestinations() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const destinations = ref<Destination[]>([])
  const loading = ref(false)

  let unsubscribe: (() => void) | null = null

  const subscribeToAllDestinations = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true

    const destinationsRef = collection(db, 'destinations')
    const q = query(
      destinationsRef,
      where('userId', '==', user.value.uid),
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
        console.error('Error fetching all destinations:', err)
        loading.value = false
      }
    )
  }

  const unsubscribeFromAllDestinations = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const getDestinationsByTripId = (tripId: string): Destination[] => {
    return destinations.value.filter(d => d.tripId === tripId)
  }

  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToAllDestinations()
      } else {
        unsubscribeFromAllDestinations()
        destinations.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromAllDestinations()
    })
  }

  return {
    destinations: readonly(destinations),
    loading: readonly(loading),
    getDestinationsByTripId,
  }
}
