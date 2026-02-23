import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore'

export function useWishTaskSync() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const syncing = ref(false)

  const syncWishesWithTasks = async () => {
    const db = getDb()
    if (!user.value || !db || syncing.value) return

    syncing.value = true
    try {
      // Fetch all wishes for user
      const wishesRef = collection(db, 'wishes')
      const wishQuery = query(wishesRef, where('userId', '==', user.value.uid))
      const wishSnapshot = await getDocs(wishQuery)

      // Fetch all tasks for user that have a wishId
      const tasksRef = collection(db, 'tasks')
      const taskQuery = query(tasksRef, where('userId', '==', user.value.uid))
      const taskSnapshot = await getDocs(taskQuery)

      // Build set of wishIds that already have tasks
      const existingWishIds = new Set<string>()
      taskSnapshot.docs.forEach(taskDoc => {
        const wishId = taskDoc.data().wishId
        if (wishId) existingWishIds.add(wishId)
      })

      // Find wishes without corresponding tasks
      const wishesWithoutTasks = wishSnapshot.docs.filter(
        wishDoc => !existingWishIds.has(wishDoc.id)
      )

      if (wishesWithoutTasks.length === 0) return

      // Create tasks for each unlinked wish
      let orderBase = Date.now()
      for (const wishDoc of wishesWithoutTasks) {
        const wishData = wishDoc.data()
        await addDoc(tasksRef, {
          userId: user.value.uid,
          title: wishData.title,
          description: '',
          completed: false,
          completedAt: null,
          dueDate: null,
          questId: null,
          subQuestId: null,
          tripId: null,
          destinationId: null,
          accommodationId: null,
          experienceId: null,
          wishId: wishDoc.id,
          timeHorizon: null,
          estimatedTime: null,
          recurrence: null,
          blockedByTaskIds: [],
          order: orderBase++,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error('Error syncing wishes with tasks:', err)
    } finally {
      syncing.value = false
    }
  }

  return {
    syncWishesWithTasks,
    syncing: readonly(syncing),
  }
}
