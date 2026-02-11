import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { SubQuest } from '~/types'

export function useAllSubquests() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const subquests = ref<SubQuest[]>([])
  const loading = ref(false)

  let unsubscribe: (() => void) | null = null

  const subscribeToAllSubquests = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true

    const subquestsRef = collection(db, 'subquests')
    const q = query(
      subquestsRef,
      where('userId', '==', user.value.uid),
      orderBy('order', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        subquests.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            questId: data.questId || undefined,
            tripId: data.tripId || undefined,
            userId: data.userId,
            name: data.name,
            goal: data.goal || '',
            description: data.description || '',
            coverUrl: data.coverUrl || '',
            startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
            endDate: data.endDate ? (data.endDate as Timestamp).toDate() : null,
            status: data.status || 'planning',
            order: data.order || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as SubQuest
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching all subquests:', err)
        loading.value = false
      }
    )
  }

  const unsubscribeFromAllSubquests = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const getSubquestsByQuestId = (questId: string): SubQuest[] => {
    return subquests.value.filter(s => s.questId === questId)
  }

  const getSubquestsByTripId = (tripId: string): SubQuest[] => {
    return subquests.value.filter(s => s.tripId === tripId)
  }

  const createSubQuestForTrip = async (tripId: string, name: string) => {
    const db = getDb()
    if (!user.value || !db) return { success: false, error: 'Not authenticated' }

    try {
      const subquestsRef = collection(db, 'subquests')
      const maxOrder = subquests.value.length > 0
        ? Math.max(...subquests.value.map(s => s.order)) + 1
        : 0

      const docRef = await addDoc(subquestsRef, {
        userId: user.value.uid,
        tripId,
        name,
        status: 'in_progress',
        order: maxOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating subquest for trip:', err)
      return { success: false, error: 'Failed to create sub-quest' }
    }
  }

  const createSubQuestForQuest = async (questId: string, name: string) => {
    const db = getDb()
    if (!user.value || !db) return { success: false, error: 'Not authenticated' }

    try {
      const subquestsRef = collection(db, 'subquests')
      const maxOrder = subquests.value.length > 0
        ? Math.max(...subquests.value.map(s => s.order)) + 1
        : 0

      const docRef = await addDoc(subquestsRef, {
        userId: user.value.uid,
        questId,
        name,
        status: 'in_progress',
        order: maxOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating subquest for quest:', err)
      return { success: false, error: 'Failed to create sub-quest' }
    }
  }

  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToAllSubquests()
      } else {
        unsubscribeFromAllSubquests()
        subquests.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromAllSubquests()
    })
  }

  return {
    subquests: readonly(subquests),
    loading: readonly(loading),
    getSubquestsByQuestId,
    getSubquestsByTripId,
    createSubQuestForTrip,
    createSubQuestForQuest,
  }
}
