import { getFirebaseAuth, getFirebaseFirestore } from '../firebase'
import type { FirebaseProvider, Task, TaskTimeHorizon, TaskEstimatedTime, TaskRecurrence } from '@superwish/shared'

/**
 * NativeScript implementation of the FirebaseProvider interface.
 * Wraps @nativescript/firebase-* plugins to match the shared interface.
 */
export class NativeScriptFirebaseProvider implements FirebaseProvider {
  getCurrentUserId(): string | null {
    const user = getFirebaseAuth().currentUser
    return user?.uid ?? null
  }

  onAuthStateChange(callback: (userId: string | null) => void): () => void {
    const listener = (user: any) => {
      callback(user?.uid ?? null)
    }
    getFirebaseAuth().addAuthStateChangeListener(listener)
    return () => {
      getFirebaseAuth().removeAuthStateChangeListener(listener)
    }
  }

  subscribeToTasks(
    userId: string,
    onData: (tasks: Task[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const db = getFirebaseFirestore()
    const tasksRef = db.collection('tasks')
      .where('userId', '==', userId)
      .orderBy('order', 'asc')

    const unsubscribe = tasksRef.onSnapshot(
      (snapshot) => {
        const tasks: Task[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            completed: data.completed || false,
            completedAt: data.completedAt ? data.completedAt.toDate() : null,
            dueDate: data.dueDate ? data.dueDate.toDate() : null,
            questId: data.questId || null,
            subQuestId: data.subQuestId || null,
            tripId: data.tripId || null,
            destinationId: data.destinationId || null,
            accommodationId: data.accommodationId || null,
            experienceId: data.experienceId || null,
            wishId: data.wishId || null,
            timeHorizon: (data.timeHorizon as TaskTimeHorizon) || null,
            estimatedTime: (data.estimatedTime as TaskEstimatedTime) || null,
            recurrence: (data.recurrence as TaskRecurrence) || null,
            blockedByTaskIds: data.blockedByTaskIds || [],
            order: data.order || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Task
        })
        onData(tasks)
      },
      (error) => {
        onError(error instanceof Error ? error : new Error(String(error)))
      }
    )

    return unsubscribe
  }

  async createTask(data: Record<string, unknown>): Promise<string> {
    const db = getFirebaseFirestore()
    const docRef = await db.collection('tasks').add(data)
    return docRef.id
  }

  async updateTask(id: string, data: Record<string, unknown>): Promise<void> {
    const db = getFirebaseFirestore()
    await db.collection('tasks').doc(id).update(data)
  }

  async deleteTask(id: string): Promise<void> {
    const db = getFirebaseFirestore()
    await db.collection('tasks').doc(id).delete()
  }
}
