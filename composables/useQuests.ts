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
import type { Quest, QuestForm, QuestStatus } from '~/types'

export function useQuests() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const quests = ref<Quest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToQuests = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    const questsRef = collection(db, 'quests')
    const q = query(
      questsRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        quests.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            userId: data.userId,
            name: data.name,
            icon: data.icon || '',
            goal: data.goal || '',
            description: data.description || '',
            coverUrl: data.coverUrl || '',
            startDate: data.startDate ? (data.startDate as Timestamp).toDate() : null,
            endDate: data.endDate ? (data.endDate as Timestamp).toDate() : null,
            status: data.status || 'planning',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Quest
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching quests:', err)
        error.value = 'Failed to load quests'
        loading.value = false
      }
    )
  }

  const unsubscribeFromQuests = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createQuest = async (data: QuestForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const questsRef = collection(db, 'quests')
      const docRef = await addDoc(questsRef, {
        userId: user.value.uid,
        name: data.name,
        icon: data.icon || '',
        goal: data.goal || '',
        description: data.description || '',
        coverUrl: data.coverUrl || '',
        startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : null,
        endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
        status: data.status || 'planning',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating quest:', err)
      return { success: false, error: 'Failed to create quest' }
    }
  }

  const updateQuest = async (id: string, data: Partial<QuestForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const questRef = doc(db, 'quests', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.goal !== undefined) updateData.goal = data.goal
      if (data.description !== undefined) updateData.description = data.description
      if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl
      if (data.status !== undefined) updateData.status = data.status
      if (data.startDate !== undefined) {
        updateData.startDate = data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : null
      }
      if (data.endDate !== undefined) {
        updateData.endDate = data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null
      }

      await updateDoc(questRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating quest:', err)
      return { success: false, error: 'Failed to update quest' }
    }
  }

  const updateQuestStatus = async (id: string, status: QuestStatus) => {
    return updateQuest(id, { status })
  }

  const deleteQuest = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const questRef = doc(db, 'quests', id)
      await deleteDoc(questRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting quest:', err)
      return { success: false, error: 'Failed to delete quest' }
    }
  }

  const getQuestById = (id: string): Quest | undefined => {
    return quests.value.find(quest => quest.id === id)
  }

  // Auto-subscribe when user changes (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToQuests()
      } else {
        unsubscribeFromQuests()
        quests.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromQuests()
    })
  }

  return {
    quests: readonly(quests),
    loading: readonly(loading),
    error: readonly(error),
    createQuest,
    updateQuest,
    updateQuestStatus,
    deleteQuest,
    getQuestById,
    subscribeToQuests,
    unsubscribeFromQuests,
  }
}
