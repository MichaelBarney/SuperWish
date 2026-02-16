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
import type { Experience, ExperienceForm } from '~/types'

export function useExperiences(destinationId: Ref<string | null | undefined>) {
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

  const subscribeToExperiences = (targetDestinationId?: string | null) => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    const did = targetDestinationId ?? destinationId.value
    if (!did) return

    loading.value = true
    error.value = null

    const experiencesRef = collection(db, 'experiences')
    const q = query(
      experiencesRef,
      where('userId', '==', user.value.uid),
      where('destinationId', '==', did),
      orderBy('scheduledDate', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        experiences.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            tripId: data.tripId,
            userId: data.userId,
            destinationId: data.destinationId,
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
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Experience
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching experiences:', err)
        error.value = 'Failed to load experiences'
        loading.value = false
      }
    )
  }

  const unsubscribeFromExperiences = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createExperience = async (targetDestinationId: string, tripId: string, data: ExperienceForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const experiencesRef = collection(db, 'experiences')
      const docRef = await addDoc(experiencesRef, {
        tripId,
        userId: user.value.uid,
        destinationId: targetDestinationId,
        category: data.category,
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        scheduledDate: data.scheduledDate ? Timestamp.fromDate(new Date(data.scheduledDate)) : null,
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
        updateData.scheduledDate = data.scheduledDate ? Timestamp.fromDate(new Date(data.scheduledDate)) : null
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

  const getExperienceById = (id: string): Experience | undefined => {
    return experiences.value.find(e => e.id === id)
  }

  // Auto-subscribe when user or destinationId changes (only on client)
  if (import.meta.client) {
    watch([user, destinationId], ([newUser, newDestinationId]) => {
      unsubscribeFromExperiences()
      if (newUser && newDestinationId) {
        subscribeToExperiences(newDestinationId)
      } else {
        experiences.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromExperiences()
    })
  }

  return {
    experiences: readonly(experiences),
    loading: readonly(loading),
    error: readonly(error),
    createExperience,
    updateExperience,
    deleteExperience,
    getExperienceById,
    subscribeToExperiences,
    unsubscribeFromExperiences,
  }
}
