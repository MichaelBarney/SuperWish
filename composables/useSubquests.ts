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
import type { SubQuest, SubQuestForm } from '~/types'

export function useSubquests(questId: Ref<string | null | undefined>) {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const subquests = ref<SubQuest[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToSubquests = (targetQuestId?: string | null) => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    const qid = targetQuestId ?? questId.value
    if (!qid) return

    loading.value = true
    error.value = null

    const subquestsRef = collection(db, 'subquests')
    const q = query(
      subquestsRef,
      where('userId', '==', user.value.uid),
      where('questId', '==', qid),
      orderBy('order', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        subquests.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            questId: data.questId,
            userId: data.userId,
            name: data.name,
            icon: data.icon || '',
            goal: data.goal || '',
            description: data.description || '',
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
        console.error('Error fetching subquests:', err)
        error.value = 'Failed to load subquests'
        loading.value = false
      }
    )
  }

  const unsubscribeFromSubquests = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createSubQuest = async (targetQuestId: string, data: SubQuestForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const maxOrder = subquests.value.reduce((max, s) => Math.max(max, s.order), -1)

      const subquestsRef = collection(db, 'subquests')
      const docRef = await addDoc(subquestsRef, {
        questId: targetQuestId,
        userId: user.value.uid,
        name: data.name,
        icon: data.icon || '',
        goal: data.goal || '',
        description: data.description || '',
        startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : null,
        endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
        status: data.status || 'planning',
        order: maxOrder + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating subquest:', err)
      return { success: false, error: 'Failed to create subquest' }
    }
  }

  const updateSubQuest = async (id: string, data: Partial<SubQuestForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const subquestRef = doc(db, 'subquests', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.icon !== undefined) updateData.icon = data.icon
      if (data.goal !== undefined) updateData.goal = data.goal
      if (data.description !== undefined) updateData.description = data.description
      if (data.status !== undefined) updateData.status = data.status
      if (data.startDate !== undefined) {
        updateData.startDate = data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : null
      }
      if (data.endDate !== undefined) {
        updateData.endDate = data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null
      }

      await updateDoc(subquestRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating subquest:', err)
      return { success: false, error: 'Failed to update subquest' }
    }
  }

  const deleteSubQuest = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const subquestRef = doc(db, 'subquests', id)
      await deleteDoc(subquestRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting subquest:', err)
      return { success: false, error: 'Failed to delete subquest' }
    }
  }

  const reorderSubQuests = async (orderedIds: string[]) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const batch = writeBatch(db)

      orderedIds.forEach((id, index) => {
        const subquestRef = doc(db, 'subquests', id)
        batch.update(subquestRef, {
          order: index,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
      return { success: true }
    } catch (err) {
      console.error('Error reordering subquests:', err)
      return { success: false, error: 'Failed to reorder subquests' }
    }
  }

  const getSubQuestById = (id: string): SubQuest | undefined => {
    return subquests.value.find(s => s.id === id)
  }

  // Auto-subscribe when user or questId changes (only on client)
  if (import.meta.client) {
    watch([user, questId], ([newUser, newQuestId]) => {
      unsubscribeFromSubquests()
      if (newUser && newQuestId) {
        subscribeToSubquests(newQuestId)
      } else {
        subquests.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromSubquests()
    })
  }

  return {
    subquests: readonly(subquests),
    loading: readonly(loading),
    error: readonly(error),
    createSubQuest,
    updateSubQuest,
    deleteSubQuest,
    reorderSubQuests,
    getSubQuestById,
    subscribeToSubquests,
    unsubscribeFromSubquests,
  }
}
