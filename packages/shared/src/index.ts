// Types
export type {
  TaskTimeHorizon,
  TaskEstimatedTime,
  TemperatureUnit,
  TaskGroupBy,
  TaskRecurrenceFrequency,
  TaskRecurrence,
  Task,
  TaskForm,
} from './types/task'

// Firebase provider interface
export type { RawTaskDoc, FirebaseProvider } from './firebase/types'

// Due date utilities
export {
  computeTimeHorizonFromDate,
  stripDateTextFromTitle,
  formatDueDate,
  isDueDateOverdue,
} from './utils/taskDueDate'

// Recurrence utilities
export {
  stripRecurrenceTextFromTitle,
  formatRecurrence,
  computeInitialDueDateFromRecurrence,
  computeTimeHorizonFromRecurrence,
  computeNextDueDate,
} from './utils/taskRecurrence'
