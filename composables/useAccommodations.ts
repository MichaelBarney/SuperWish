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
import type { Accommodation, AccommodationForm, TransportationDocument } from '~/types'

export function useAccommodations(tripId: Ref<string | null | undefined>) {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const accommodations = ref<Accommodation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToAccommodations = (targetTripId?: string | null) => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    const tid = targetTripId ?? tripId.value
    if (!tid) return

    loading.value = true
    error.value = null

    const accommodationsRef = collection(db, 'accommodations')
    const q = query(
      accommodationsRef,
      where('userId', '==', user.value.uid),
      where('tripId', '==', tid),
      orderBy('checkIn', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        accommodations.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            tripId: data.tripId,
            userId: data.userId,
            destinationId: data.destinationId || '',
            type: data.type || 'hotel',
            name: data.name || '',
            address: data.address || '',
            checkIn: data.checkIn ? (data.checkIn as Timestamp).toDate() : new Date(),
            checkOut: data.checkOut ? (data.checkOut as Timestamp).toDate() : new Date(),
            checkInTime: data.checkInTime || '',
            checkOutTime: data.checkOutTime || '',
            bookingStatus: data.bookingStatus || 'planned',
            bookingReference: data.bookingReference || '',
            bookingUrl: data.bookingUrl || '',
            pricePerNight: data.pricePerNight || undefined,
            totalPrice: data.totalPrice || undefined,
            currency: data.currency || 'USD',
            convertedTotal: data.convertedTotal || undefined,
            roomType: data.roomType || '',
            amenities: data.amenities || [],
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
            documents: (data.documents || []).map((doc: TransportationDocument) => ({
              ...doc,
              uploadedAt: doc.uploadedAt instanceof Timestamp
                ? (doc.uploadedAt as Timestamp).toDate()
                : new Date(doc.uploadedAt),
            })),
            links: data.links || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Accommodation
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching accommodations:', err)
        error.value = 'Failed to load accommodations'
        loading.value = false
      }
    )
  }

  const unsubscribeFromAccommodations = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createAccommodation = async (targetTripId: string, data: AccommodationForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const accommodationsRef = collection(db, 'accommodations')
      const docRef = await addDoc(accommodationsRef, {
        tripId: targetTripId,
        userId: user.value.uid,
        destinationId: data.destinationId || '',
        type: data.type || 'hotel',
        name: data.name || '',
        address: data.address || '',
        checkIn: data.checkIn
          ? Timestamp.fromDate(new Date(data.checkIn + 'T12:00:00'))
          : null,
        checkOut: data.checkOut
          ? Timestamp.fromDate(new Date(data.checkOut + 'T12:00:00'))
          : null,
        checkInTime: data.checkInTime || '',
        checkOutTime: data.checkOutTime || '',
        bookingStatus: data.bookingStatus || 'planned',
        bookingReference: data.bookingReference || '',
        bookingUrl: data.bookingUrl || '',
        pricePerNight: data.pricePerNight ? parseFloat(data.pricePerNight) : null,
        totalPrice: data.totalPrice ? parseFloat(data.totalPrice) : null,
        currency: data.currency || 'USD',
        roomType: data.roomType || '',
        amenities: data.amenities || [],
        notes: data.notes || '',
        imageUrl: data.imageUrl || '',
        documents: (data.documents || []).map(doc => ({
          ...doc,
          uploadedAt: Timestamp.fromDate(doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt)),
        })),
        links: data.links || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating accommodation:', err)
      return { success: false, error: 'Failed to create accommodation' }
    }
  }

  const updateAccommodation = async (id: string, data: Partial<AccommodationForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const accommodationRef = doc(db, 'accommodations', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.destinationId !== undefined) updateData.destinationId = data.destinationId || ''
      if (data.type !== undefined) updateData.type = data.type
      if (data.name !== undefined) updateData.name = data.name
      if (data.address !== undefined) updateData.address = data.address
      if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime
      if (data.checkOutTime !== undefined) updateData.checkOutTime = data.checkOutTime
      if (data.bookingStatus !== undefined) updateData.bookingStatus = data.bookingStatus
      if (data.bookingReference !== undefined) updateData.bookingReference = data.bookingReference
      if (data.bookingUrl !== undefined) updateData.bookingUrl = data.bookingUrl
      if (data.roomType !== undefined) updateData.roomType = data.roomType
      if (data.amenities !== undefined) updateData.amenities = data.amenities
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.pricePerNight !== undefined) {
        updateData.pricePerNight = data.pricePerNight ? parseFloat(data.pricePerNight) : null
      }
      if (data.totalPrice !== undefined) {
        updateData.totalPrice = data.totalPrice ? parseFloat(data.totalPrice) : null
      }
      if (data.checkIn !== undefined) {
        updateData.checkIn = data.checkIn
          ? Timestamp.fromDate(new Date(data.checkIn + 'T12:00:00'))
          : null
      }
      if (data.checkOut !== undefined) {
        updateData.checkOut = data.checkOut
          ? Timestamp.fromDate(new Date(data.checkOut + 'T12:00:00'))
          : null
      }
      if (data.documents !== undefined) {
        updateData.documents = data.documents.map(doc => ({
          ...doc,
          uploadedAt: Timestamp.fromDate(doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(doc.uploadedAt)),
        }))
      }
      if (data.links !== undefined) {
        updateData.links = data.links
      }

      await updateDoc(accommodationRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating accommodation:', err)
      return { success: false, error: 'Failed to update accommodation' }
    }
  }

  const deleteAccommodation = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const accommodationRef = doc(db, 'accommodations', id)
      await deleteDoc(accommodationRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting accommodation:', err)
      return { success: false, error: 'Failed to delete accommodation' }
    }
  }

  const getAccommodationsByDestinationId = (destinationId: string): Accommodation[] => {
    return accommodations.value.filter(a => a.destinationId === destinationId)
  }

  const getAccommodationById = (id: string): Accommodation | undefined => {
    return accommodations.value.find(a => a.id === id)
  }

  // Auto-subscribe when user or tripId changes (only on client)
  if (import.meta.client) {
    watch([user, tripId], ([newUser, newTripId]) => {
      unsubscribeFromAccommodations()
      if (newUser && newTripId) {
        subscribeToAccommodations(newTripId)
      } else {
        accommodations.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromAccommodations()
    })
  }

  return {
    accommodations: readonly(accommodations),
    loading: readonly(loading),
    error: readonly(error),
    createAccommodation,
    updateAccommodation,
    deleteAccommodation,
    getAccommodationsByDestinationId,
    getAccommodationById,
    subscribeToAccommodations,
    unsubscribeFromAccommodations,
  }
}
