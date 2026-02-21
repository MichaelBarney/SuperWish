import { ref, computed, readonly } from 'nativescript-vue'
import { NativeScriptFirebaseProvider } from './useFirebase'
import { getFirebaseFirestore } from '../firebase'
import type {
  Task,
  TaskForm,
  TaskTimeHorizon,
  TaskEstimatedTime,
  TaskRecurrence,
} from '@superwish/shared'
import {
  computeTimeHorizonFromDate,
  computeNextDueDate,
  computeInitialDueDateFromRecurrence,
} from '@superwish/shared'

const provider = new NativeScriptFirebaseProvider()

const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

let unsubscribe: (() => void) | null = null

export function useTasks() {
  const subscribeToTasks = () => {
    const userId = provider.getCurrentUserId()
    if (!userId) return

    loading.value = true
    error.value = null

    unsubscribe = provider.subscribeToTasks(
      userId,
      (newTasks) => {
        tasks.value = newTasks
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
    const userId = provider.getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    try {
      const db = getFirebaseFirestore()
      const maxOrder = tasks.value.length > 0
        ? Math.max(...tasks.value.map(t => t.order)) + 1
        : 0

      const parsedRecurrence = data.recurrence ? JSON.parse(data.recurrence) : null

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

      const docId = await provider.createTask({
        userId,
        title: data.title,
        description: data.description || '',
        completed: false,
        completedAt: null,
        dueDate: dueDate || null,
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
        createdAt: db.FieldValue.serverTimestamp(),
        updatedAt: db.FieldValue.serverTimestamp(),
      })
      return { success: true, id: docId }
    } catch (err) {
      console.error('Error creating task:', err)
      return { success: false, error: 'Failed to create task' }
    }
  }

  const toggleTaskComplete = async (id: string, completed: boolean) => {
    const userId = provider.getCurrentUserId()
    if (!userId) return { success: false, error: 'Not authenticated' }

    const task = tasks.value.find(t => t.id === id)

    // Wish-linked tasks can't be manually toggled
    if (task?.wishId) return { success: false, error: 'Wish-linked tasks cannot be manually toggled' }

    // Blocked tasks can't be manually completed
    if (completed) {
      const hasIncompleteBlockers = (task?.blockedByTaskIds || []).some(blockerId => {
        const blocker = tasks.value.find(t => t.id === blockerId)
        return blocker && !blocker.completed
      })
      if (hasIncompleteBlockers) return { success: false, error: 'Task is blocked by incomplete tasks' }
    }

    try {
      const db = getFirebaseFirestore()
      await provider.updateTask(id, {
        completed,
        completedAt: completed ? db.FieldValue.serverTimestamp() : null,
        updatedAt: db.FieldValue.serverTimestamp(),
      })

      // Auto-create next occurrence for recurring tasks
      if (completed && task?.recurrence) {
        const nextDueDate = computeNextDueDate(task.dueDate, task.recurrence)
        const maxOrder = tasks.value.length > 0
          ? Math.max(...tasks.value.map(t => t.order)) + 1
          : 0

        await provider.createTask({
          userId,
          title: task.title,
          description: task.description || '',
          completed: false,
          completedAt: null,
          dueDate: nextDueDate,
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
          createdAt: db.FieldValue.serverTimestamp(),
          updatedAt: db.FieldValue.serverTimestamp(),
        })
      }

      return { success: true }
    } catch (err) {
      console.error('Error toggling task:', err)
      return { success: false, error: 'Failed to toggle task' }
    }
  }

  const updateTaskTimeHorizon = async (id: string, timeHorizon: TaskTimeHorizon | null) => {
    try {
      const db = getFirebaseFirestore()
      await provider.updateTask(id, {
        timeHorizon: timeHorizon || null,
        updatedAt: db.FieldValue.serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error updating time horizon:', err)
      return { success: false, error: 'Failed to update time horizon' }
    }
  }

  const updateTaskEstimatedTime = async (id: string, estimatedTime: TaskEstimatedTime | null) => {
    try {
      const db = getFirebaseFirestore()
      await provider.updateTask(id, {
        estimatedTime: estimatedTime || null,
        updatedAt: db.FieldValue.serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error updating estimated time:', err)
      return { success: false, error: 'Failed to update estimated time' }
    }
  }

  const deleteTask = async (id: string) => {
    try {
      // Clean up references in other tasks that were blocked by this one
      const referencingTasks = tasks.value.filter(t => t.blockedByTaskIds?.includes(id))
      const db = getFirebaseFirestore()
      for (const t of referencingTasks) {
        await provider.updateTask(t.id, {
          blockedByTaskIds: t.blockedByTaskIds!.filter(bid => bid !== id),
          updatedAt: db.FieldValue.serverTimestamp(),
        })
      }

      await provider.deleteTask(id)
      return { success: true }
    } catch (err) {
      console.error('Error deleting task:', err)
      return { success: false, error: 'Failed to delete task' }
    }
  }

  // Computed views — inbox = no project context AND no time horizon
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

  const getTaskById = (id: string): Task | undefined => {
    return tasks.value.find(task => task.id === id)
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
    createTask,
    toggleTaskComplete,
    updateTaskTimeHorizon,
    updateTaskEstimatedTime,
    deleteTask,
    getTaskById,
    subscribeToTasks,
    unsubscribeFromTasks,
  }
}
