import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
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
            questId: data.questId,
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
  }
}
