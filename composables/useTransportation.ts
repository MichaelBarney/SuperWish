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
import type { Transportation, TransportationForm, TransportationDocument } from '~/types'

export function useTransportation(tripId: Ref<string | null | undefined>) {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const transportations = ref<Transportation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToTransportations = (targetTripId?: string | null) => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    const tid = targetTripId ?? tripId.value
    if (!tid) return

    loading.value = true
    error.value = null

    const transportationsRef = collection(db, 'transportations')
    const q = query(
      transportationsRef,
      where('userId', '==', user.value.uid),
      where('tripId', '==', tid),
      orderBy('departureDateTime', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        transportations.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            tripId: data.tripId,
            userId: data.userId,
            type: data.type,
            carrier: data.carrier || '',
            flightNumber: data.flightNumber || '',
            fromDestinationId: data.fromDestinationId ?? null,
            fromLocation: data.fromLocation || '',
            departureDateTime: data.departureDateTime ? (data.departureDateTime as Timestamp).toDate() : new Date(),
            toDestinationId: data.toDestinationId ?? null,
            toLocation: data.toLocation || '',
            arrivalDateTime: data.arrivalDateTime ? (data.arrivalDateTime as Timestamp).toDate() : new Date(),
            bookingStatus: data.bookingStatus || 'planned',
            bookingReference: data.bookingReference || '',
            price: data.price || undefined,
            currency: data.currency || 'USD',
            convertedPrice: data.convertedPrice || undefined,
            seatInfo: data.seatInfo || '',
            notes: data.notes || '',
            documents: (data.documents || []).map((doc: TransportationDocument) => ({
              ...doc,
              uploadedAt: doc.uploadedAt instanceof Timestamp
                ? (doc.uploadedAt as Timestamp).toDate()
                : new Date(doc.uploadedAt),
            })),
            links: data.links || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Transportation
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching transportations:', err)
        error.value = 'Failed to load transportations'
        loading.value = false
      }
    )
  }

  const unsubscribeFromTransportations = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createTransportation = async (targetTripId: string, data: TransportationForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const transportationsRef = collection(db, 'transportations')
      const docRef = await addDoc(transportationsRef, {
        tripId: targetTripId,
        userId: user.value.uid,
        type: data.type,
        carrier: data.carrier || '',
        flightNumber: data.flightNumber || '',
        fromDestinationId: data.fromDestinationId || null,
        fromLocation: data.fromLocation || '',
        departureDateTime: data.departureDateTime
          ? Timestamp.fromDate(new Date(data.departureDateTime))
          : null,
        toDestinationId: data.toDestinationId || null,
        toLocation: data.toLocation || '',
        arrivalDateTime: data.arrivalDateTime
          ? Timestamp.fromDate(new Date(data.arrivalDateTime))
          : null,
        bookingStatus: data.bookingStatus || 'planned',
        bookingReference: data.bookingReference || '',
        price: data.price ? parseFloat(data.price) : null,
        currency: data.currency || 'USD',
        seatInfo: data.seatInfo || '',
        notes: data.notes || '',
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
      console.error('Error creating transportation:', err)
      return { success: false, error: 'Failed to create transportation' }
    }
  }

  const createRoundTripTransportation = async (
    targetTripId: string,
    outboundData: TransportationForm,
    returnData: TransportationForm
  ) => {
    const outboundResult = await createTransportation(targetTripId, outboundData)
    if (!outboundResult.success) return outboundResult

    const returnResult = await createTransportation(targetTripId, returnData)
    if (!returnResult.success) {
      return { ...returnResult, outboundId: outboundResult.id }
    }

    return { success: true, outboundId: outboundResult.id, returnId: returnResult.id }
  }

  const updateTransportation = async (id: string, data: Partial<TransportationForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const transportationRef = doc(db, 'transportations', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.type !== undefined) updateData.type = data.type
      if (data.carrier !== undefined) updateData.carrier = data.carrier
      if (data.flightNumber !== undefined) updateData.flightNumber = data.flightNumber
      if (data.fromDestinationId !== undefined) updateData.fromDestinationId = data.fromDestinationId || null
      if (data.fromLocation !== undefined) updateData.fromLocation = data.fromLocation
      if (data.toDestinationId !== undefined) updateData.toDestinationId = data.toDestinationId || null
      if (data.toLocation !== undefined) updateData.toLocation = data.toLocation
      if (data.bookingStatus !== undefined) updateData.bookingStatus = data.bookingStatus
      if (data.bookingReference !== undefined) updateData.bookingReference = data.bookingReference
      if (data.seatInfo !== undefined) updateData.seatInfo = data.seatInfo
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.price !== undefined) {
        updateData.price = data.price ? parseFloat(data.price) : null
      }
      if (data.departureDateTime !== undefined) {
        updateData.departureDateTime = data.departureDateTime
          ? Timestamp.fromDate(new Date(data.departureDateTime))
          : null
      }
      if (data.arrivalDateTime !== undefined) {
        updateData.arrivalDateTime = data.arrivalDateTime
          ? Timestamp.fromDate(new Date(data.arrivalDateTime))
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

      await updateDoc(transportationRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating transportation:', err)
      return { success: false, error: 'Failed to update transportation' }
    }
  }

  const deleteTransportation = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const transportationRef = doc(db, 'transportations', id)
      await deleteDoc(transportationRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting transportation:', err)
      return { success: false, error: 'Failed to delete transportation' }
    }
  }

  // Get transportation between two points
  // fromId = null means "from origin"
  // toId = null means "to origin" (return trip)
  const getTransportationBetween = (
    fromId: string | null | undefined,
    toId: string | null | undefined
  ): Transportation | undefined => {
    return transportations.value.find(t => {
      const fromMatch = (fromId === null || fromId === undefined || fromId === '')
        ? (t.fromDestinationId === null || t.fromDestinationId === undefined || t.fromDestinationId === '')
        : t.fromDestinationId === fromId
      const toMatch = (toId === null || toId === undefined || toId === '')
        ? (t.toDestinationId === null || t.toDestinationId === undefined || t.toDestinationId === '')
        : t.toDestinationId === toId
      return fromMatch && toMatch
    })
  }

  // Check if transportation exists between two points
  const hasTransportation = (
    fromId: string | null | undefined,
    toId: string | null | undefined
  ): boolean => {
    return !!getTransportationBetween(fromId, toId)
  }

  const getTransportationById = (id: string): Transportation | undefined => {
    return transportations.value.find(t => t.id === id)
  }

  // Get transportations that reference non-existent destinations
  const getOrphanTransportations = (validDestinationIds: string[]): Transportation[] => {
    return transportations.value.filter(t => {
      // fromDestinationId is invalid if it's not null/empty AND not in validDestinationIds
      const fromInvalid = t.fromDestinationId &&
                          t.fromDestinationId !== '' &&
                          !validDestinationIds.includes(t.fromDestinationId)
      // toDestinationId is invalid if it's not null/empty AND not in validDestinationIds
      const toInvalid = t.toDestinationId &&
                        t.toDestinationId !== '' &&
                        !validDestinationIds.includes(t.toDestinationId)
      return fromInvalid || toInvalid
    })
  }

  // Auto-subscribe when user or tripId changes (only on client)
  if (import.meta.client) {
    watch([user, tripId], ([newUser, newTripId]) => {
      unsubscribeFromTransportations()
      if (newUser && newTripId) {
        subscribeToTransportations(newTripId)
      } else {
        transportations.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromTransportations()
    })
  }

  return {
    transportations: readonly(transportations),
    loading: readonly(loading),
    error: readonly(error),
    createTransportation,
    createRoundTripTransportation,
    updateTransportation,
    deleteTransportation,
    getTransportationBetween,
    hasTransportation,
    getTransportationById,
    getOrphanTransportations,
    subscribeToTransportations,
    unsubscribeFromTransportations,
  }
}
