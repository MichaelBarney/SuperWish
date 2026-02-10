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
import type { Task, TaskForm, TaskTimeHorizon, TaskEstimatedTime } from '~/types'

export function useTasks() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToTasks = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    const tasksRef = collection(db, 'tasks')
    const q = query(
      tasksRef,
      where('userId', '==', user.value.uid),
      orderBy('order', 'asc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        tasks.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            completed: data.completed || false,
            completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
            questId: data.questId || null,
            subQuestId: data.subQuestId || null,
            tripId: data.tripId || null,
            destinationId: data.destinationId || null,
            wishId: data.wishId || null,
            timeHorizon: data.timeHorizon || null,
            estimatedTime: data.estimatedTime || null,
            order: data.order || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Task
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching tasks:', err)
        error.value = 'Failed to load tasks'
        loading.value = false
      }
    )
  }

  const unsubscribeFromTasks = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createTask = async (data: TaskForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const tasksRef = collection(db, 'tasks')
      const maxOrder = tasks.value.length > 0
        ? Math.max(...tasks.value.map(t => t.order)) + 1
        : 0

      const docRef = await addDoc(tasksRef, {
        userId: user.value.uid,
        title: data.title,
        description: data.description || '',
        completed: false,
        completedAt: null,
        questId: data.questId || null,
        subQuestId: data.subQuestId || null,
        tripId: data.tripId || null,
        destinationId: data.destinationId || null,
        wishId: data.wishId || null,
        timeHorizon: data.timeHorizon || null,
        estimatedTime: data.estimatedTime || null,
        order: maxOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating task:', err)
      return { success: false, error: 'Failed to create task' }
    }
  }

  const updateTask = async (id: string, data: Partial<TaskForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.questId !== undefined) updateData.questId = data.questId || null
      if (data.subQuestId !== undefined) updateData.subQuestId = data.subQuestId || null
      if (data.tripId !== undefined) updateData.tripId = data.tripId || null
      if (data.destinationId !== undefined) updateData.destinationId = data.destinationId || null
      if (data.wishId !== undefined) updateData.wishId = data.wishId || null
      if (data.timeHorizon !== undefined) updateData.timeHorizon = data.timeHorizon || null
      if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime || null

      await updateDoc(taskRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating task:', err)
      return { success: false, error: 'Failed to update task' }
    }
  }

  const toggleTaskComplete = async (id: string, completed: boolean) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    // Wish-linked tasks can't be manually toggled
    const task = tasks.value.find(t => t.id === id)
    if (task?.wishId) return { success: false, error: 'Wish-linked tasks cannot be manually toggled' }

    try {
      const taskRef = doc(db, 'tasks', id)
      await updateDoc(taskRef, {
        completed,
        completedAt: completed ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error toggling task:', err)
      return { success: false, error: 'Failed to toggle task' }
    }
  }

  const deleteTask = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      await deleteDoc(taskRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting task:', err)
      return { success: false, error: 'Failed to delete task' }
    }
  }

  const updateTaskTimeHorizon = async (id: string, timeHorizon: TaskTimeHorizon | null) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      await updateDoc(taskRef, {
        timeHorizon: timeHorizon || null,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error updating task time horizon:', err)
      return { success: false, error: 'Failed to update time horizon' }
    }
  }

  const updateTaskEstimatedTime = async (id: string, estimatedTime: TaskEstimatedTime | null) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      await updateDoc(taskRef, {
        estimatedTime: estimatedTime || null,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error updating task estimated time:', err)
      return { success: false, error: 'Failed to update estimated time' }
    }
  }

  // Computed views
  const inboxTasks = computed(() =>
    tasks.value.filter(t => !t.questId && !t.subQuestId && !t.tripId && !t.destinationId && !t.timeHorizon)
  )

  const todayHorizonTasks = computed(() =>
    tasks.value.filter(t => t.timeHorizon === 'today')
  )

  const thisWeekTasks = computed(() =>
    tasks.value.filter(t => t.timeHorizon === 'this_week')
  )

  const thisMonthTasks = computed(() =>
    tasks.value.filter(t => t.timeHorizon === 'this_month')
  )

  const longTermTasks = computed(() =>
    tasks.value.filter(t => t.timeHorizon === 'long_term')
  )

  const noHorizonTasks = computed(() =>
    tasks.value.filter(t => !t.timeHorizon)
  )

  // Getters by foreign key
  const getTasksByQuestId = (questId: string) =>
    tasks.value.filter(t => t.questId === questId)

  const getTasksBySubQuestId = (subQuestId: string) =>
    tasks.value.filter(t => t.subQuestId === subQuestId)

  const getTasksByTripId = (tripId: string) =>
    tasks.value.filter(t => t.tripId === tripId)

  const getTasksByDestinationId = (destinationId: string) =>
    tasks.value.filter(t => t.destinationId === destinationId)

  const getDirectQuestTasks = (questId: string) =>
    tasks.value.filter(t => t.questId === questId && !t.subQuestId)

  const getDirectTripTasks = (tripId: string) =>
    tasks.value.filter(t => t.tripId === tripId && !t.destinationId && !t.subQuestId)

  const getTaskById = (id: string): Task | undefined => {
    return tasks.value.find(task => task.id === id)
  }

  // Auto-subscribe when user changes (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToTasks()
      } else {
        unsubscribeFromTasks()
        tasks.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromTasks()
    })
  }

  return {
    tasks: readonly(tasks),
    loading: readonly(loading),
    error: readonly(error),
    inboxTasks,
    todayHorizonTasks,
    thisWeekTasks,
    thisMonthTasks,
    longTermTasks,
    noHorizonTasks,
    createTask,
    updateTask,
    updateTaskTimeHorizon,
    updateTaskEstimatedTime,
    toggleTaskComplete,
    deleteTask,
    getTaskById,
    getTasksByQuestId,
    getTasksBySubQuestId,
    getTasksByTripId,
    getTasksByDestinationId,
    getDirectQuestTasks,
    getDirectTripTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
  }
}
