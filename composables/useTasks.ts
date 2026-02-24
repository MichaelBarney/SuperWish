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
import type { Task, TaskForm, TaskTimeHorizon, TaskEstimatedTime, TaskRecurrence } from '~/types'
import { computeTimeHorizonFromDate } from '~/utils/taskDueDate'
import { computeNextDueDate, computeInitialDueDateFromRecurrence, computeTimeHorizonFromRecurrence } from '~/utils/taskRecurrence'

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
          const dueDate = data.dueDate ? (data.dueDate as Timestamp).toDate() : null
          // Dynamically recompute timeHorizon from dueDate so it stays current as days pass
          const timeHorizon = dueDate
            ? computeTimeHorizonFromDate(dueDate)
            : (data.timeHorizon || null)
          return {
            id: docSnap.id,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            completed: data.completed || false,
            completedAt: data.completedAt ? (data.completedAt as Timestamp).toDate() : null,
            dueDate,
            questId: data.questId || null,
            subQuestId: data.subQuestId || null,
            tripId: data.tripId || null,
            destinationId: data.destinationId || null,
            accommodationId: data.accommodationId || null,
            experienceId: data.experienceId || null,
            wishId: data.wishId || null,
            timeHorizon,
            estimatedTime: data.estimatedTime || null,
            recurrence: data.recurrence || null,
            blockedByTaskIds: data.blockedByTaskIds || [],
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

      const parsedRecurrence = data.recurrence ? JSON.parse(data.recurrence) : null

      // Auto-compute dueDate and timeHorizon from recurrence when not explicitly set
      let dueDate = data.dueDate ? new Date(data.dueDate) : null
      let timeHorizon = data.timeHorizon || null
      if (parsedRecurrence) {
        if (!dueDate) {
          dueDate = computeInitialDueDateFromRecurrence(parsedRecurrence)
          timeHorizon = computeTimeHorizonFromDate(dueDate)
        } else if (!timeHorizon) {
          timeHorizon = computeTimeHorizonFromDate(dueDate)
        }
      }

      const docRef = await addDoc(tasksRef, {
        userId: user.value.uid,
        title: data.title,
        description: data.description || '',
        completed: false,
        completedAt: null,
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        questId: data.questId || null,
        subQuestId: data.subQuestId || null,
        tripId: data.tripId || null,
        destinationId: data.destinationId || null,
        accommodationId: data.accommodationId || null,
        experienceId: data.experienceId || null,
        wishId: data.wishId || null,
        timeHorizon: timeHorizon || null,
        estimatedTime: data.estimatedTime || null,
        recurrence: parsedRecurrence,
        blockedByTaskIds: data.blockedByTaskIds || [],
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
      if (data.dueDate !== undefined) {
        updateData.dueDate = data.dueDate ? Timestamp.fromDate(new Date(data.dueDate)) : null
        // Auto-compute timeHorizon from dueDate
        if (data.dueDate) {
          updateData.timeHorizon = computeTimeHorizonFromDate(new Date(data.dueDate))
        }
      }
      if (data.questId !== undefined) updateData.questId = data.questId || null
      if (data.subQuestId !== undefined) updateData.subQuestId = data.subQuestId || null
      if (data.tripId !== undefined) updateData.tripId = data.tripId || null
      if (data.destinationId !== undefined) updateData.destinationId = data.destinationId || null
      if (data.accommodationId !== undefined) updateData.accommodationId = data.accommodationId || null
      if (data.experienceId !== undefined) updateData.experienceId = data.experienceId || null
      if (data.wishId !== undefined) updateData.wishId = data.wishId || null
      if (data.timeHorizon !== undefined) updateData.timeHorizon = data.timeHorizon || null
      if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime || null
      if (data.recurrence !== undefined) updateData.recurrence = data.recurrence ? JSON.parse(data.recurrence) : null
      if (data.blockedByTaskIds !== undefined) updateData.blockedByTaskIds = data.blockedByTaskIds

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

    // Blocked tasks can't be manually completed
    if (completed) {
      const hasIncompleteBlockers = (task?.blockedByTaskIds || []).some(blockerId => {
        const blocker = tasks.value.find(t => t.id === blockerId)
        return blocker && !blocker.completed
      })
      if (hasIncompleteBlockers) return { success: false, error: 'Task is blocked' }
    }

    try {
      const taskRef = doc(db, 'tasks', id)
      await updateDoc(taskRef, {
        completed,
        completedAt: completed ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      })

      // Auto-create next occurrence for recurring tasks
      if (completed && task?.recurrence) {
        const nextDueDate = computeNextDueDate(task.dueDate, task.recurrence)
        const tasksRef = collection(db, 'tasks')
        const maxOrder = tasks.value.length > 0
          ? Math.max(...tasks.value.map(t => t.order)) + 1
          : 0

        await addDoc(tasksRef, {
          userId: user.value.uid,
          title: task.title,
          description: task.description || '',
          completed: false,
          completedAt: null,
          dueDate: Timestamp.fromDate(nextDueDate),
          questId: task.questId || null,
          subQuestId: task.subQuestId || null,
          tripId: task.tripId || null,
          destinationId: task.destinationId || null,
          accommodationId: task.accommodationId || null,
          experienceId: task.experienceId || null,
          wishId: task.wishId || null,
          timeHorizon: computeTimeHorizonFromDate(nextDueDate),
          estimatedTime: task.estimatedTime || null,
          recurrence: task.recurrence,
          blockedByTaskIds: [],
          order: maxOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

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
      // Delete linked wish if present, to prevent syncWishesWithTasks from recreating the task
      const task = tasks.value.find(t => t.id === id)
      if (task?.wishId) {
        await deleteDoc(doc(db, 'wishes', task.wishId))
      }

      const taskRef = doc(db, 'tasks', id)
      await deleteDoc(taskRef)

      // Clean up references in other tasks that were blocked by this one
      const referencingTasks = tasks.value.filter(t => t.blockedByTaskIds?.includes(id))
      for (const t of referencingTasks) {
        await updateDoc(doc(db, 'tasks', t.id), {
          blockedByTaskIds: t.blockedByTaskIds!.filter(bid => bid !== id),
          updatedAt: serverTimestamp(),
        })
      }

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

  const updateTaskDueDate = async (id: string, dueDate: Date | null) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      const updateData: Record<string, unknown> = {
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        updatedAt: serverTimestamp(),
      }
      if (dueDate) {
        updateData.timeHorizon = computeTimeHorizonFromDate(dueDate)
      }
      await updateDoc(taskRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating task due date:', err)
      return { success: false, error: 'Failed to update due date' }
    }
  }

  const updateTaskBlockedBy = async (id: string, blockedByTaskIds: string[]) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      await updateDoc(taskRef, {
        blockedByTaskIds,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error updating task blocked by:', err)
      return { success: false, error: 'Failed to update blocked by' }
    }
  }

  const updateTaskRecurrence = async (id: string, recurrence: TaskRecurrence | null) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const taskRef = doc(db, 'tasks', id)
      const updateData: Record<string, unknown> = {
        recurrence: recurrence || null,
        updatedAt: serverTimestamp(),
      }

      // Auto-compute dueDate/timeHorizon when setting recurrence
      if (recurrence) {
        const task = tasks.value.find(t => t.id === id)
        if (task && !task.dueDate) {
          const newDueDate = computeInitialDueDateFromRecurrence(recurrence)
          updateData.dueDate = Timestamp.fromDate(newDueDate)
          updateData.timeHorizon = computeTimeHorizonFromDate(newDueDate)
        } else if (task?.dueDate) {
          updateData.timeHorizon = computeTimeHorizonFromDate(task.dueDate)
        }
      }

      await updateDoc(taskRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating task recurrence:', err)
      return { success: false, error: 'Failed to update recurrence' }
    }
  }

  // Computed views
  const inboxTasks = computed(() =>
    tasks.value.filter(t => !t.questId && !t.subQuestId && !t.tripId && !t.destinationId && !t.experienceId && !t.timeHorizon)
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

  const getTasksByExperienceId = (experienceId: string) =>
    tasks.value.filter(t => t.experienceId === experienceId)

  const getTasksByAccommodationId = (accommodationId: string) =>
    tasks.value.filter(t => t.accommodationId === accommodationId)

  const getDirectDestinationTasks = (destinationId: string) =>
    tasks.value.filter(t => t.destinationId === destinationId && !t.experienceId && !t.accommodationId)

  const getDirectQuestTasks = (questId: string) =>
    tasks.value.filter(t => t.questId === questId && !t.subQuestId)

  const getDirectTripTasks = (tripId: string) =>
    tasks.value.filter(t => t.tripId === tripId && !t.destinationId && !t.subQuestId)

  const getTaskById = (id: string): Task | undefined => {
    return tasks.value.find(task => task.id === id)
  }

  const getTasksByWishId = (wishId: string) =>
    tasks.value.filter(t => t.wishId === wishId)

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
    updateTaskDueDate,
    updateTaskBlockedBy,
    updateTaskRecurrence,
    toggleTaskComplete,
    deleteTask,
    getTaskById,
    getTasksByWishId,
    getTasksByQuestId,
    getTasksBySubQuestId,
    getTasksByTripId,
    getTasksByDestinationId,
    getTasksByAccommodationId,
    getTasksByExperienceId,
    getDirectDestinationTasks,
    getDirectQuestTasks,
    getDirectTripTasks,
    subscribeToTasks,
    unsubscribeFromTasks,
  }
}
