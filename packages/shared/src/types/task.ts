// =============================================
// TASK TYPES (SuperTask) — shared across web & mobile
// =============================================

export type TaskTimeHorizon = 'today' | 'this_week' | 'this_month' | 'long_term'
export type TaskEstimatedTime = '5min' | '12min' | '25min' | '1h_plus'
export type TemperatureUnit = 'celsius' | 'fahrenheit'
export type TaskGroupBy = 'none' | 'project'

export type TaskRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface TaskRecurrence {
  frequency: TaskRecurrenceFrequency
  interval: number
  dayOfWeek?: number
  dayOfMonth?: number
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  completed: boolean
  completedAt?: Date | null
  dueDate?: Date | null
  questId?: string | null
  subQuestId?: string | null
  tripId?: string | null
  destinationId?: string | null
  accommodationId?: string | null
  experienceId?: string | null
  wishId?: string | null
  timeHorizon?: TaskTimeHorizon | null
  estimatedTime?: TaskEstimatedTime | null
  recurrence?: TaskRecurrence | null
  blockedByTaskIds?: string[]
  order: number
  createdAt: unknown // Firestore Timestamp — platform-specific
  updatedAt: unknown // Firestore Timestamp — platform-specific
}

export interface TaskForm {
  title: string
  description: string
  dueDate: string
  questId: string
  subQuestId: string
  tripId: string
  destinationId: string
  accommodationId: string
  experienceId: string
  wishId: string
  timeHorizon: string
  estimatedTime: string
  recurrence: string
  blockedByTaskIds: string[]
}
