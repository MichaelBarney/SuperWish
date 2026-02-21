import type { Task } from '../types/task'

/**
 * Raw Firestore document data for a task, before conversion to the Task model.
 * Platform-specific fields (Timestamps) are represented as `unknown`.
 */
export interface RawTaskDoc {
  id: string
  userId: string
  title: string
  description?: string
  completed: boolean
  completedAt?: unknown
  dueDate?: unknown
  questId?: string | null
  subQuestId?: string | null
  tripId?: string | null
  destinationId?: string | null
  accommodationId?: string | null
  experienceId?: string | null
  wishId?: string | null
  timeHorizon?: string | null
  estimatedTime?: string | null
  recurrence?: unknown
  blockedByTaskIds?: string[]
  order: number
  createdAt: unknown
  updatedAt: unknown
}

/**
 * Platform-agnostic Firebase interface.
 * Web implements this with firebase/firestore; mobile with @nativescript/firebase-firestore.
 */
export interface FirebaseProvider {
  getCurrentUserId(): string | null
  onAuthStateChange(callback: (userId: string | null) => void): () => void
  subscribeToTasks(
    userId: string,
    onData: (tasks: Task[]) => void,
    onError: (error: Error) => void
  ): () => void
  createTask(data: Record<string, unknown>): Promise<string> // returns doc id
  updateTask(id: string, data: Record<string, unknown>): Promise<void>
  deleteTask(id: string): Promise<void>
}
