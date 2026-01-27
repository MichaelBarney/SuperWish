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
import type { WishList, WishListForm } from '~/types'

export function useLists() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const lists = ref<WishList[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToLists = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    const listsRef = collection(db, 'lists')
    const q = query(
      listsRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        lists.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            userId: data.userId,
            name: data.name,
            description: data.description || '',
            deadline: data.deadline ? (data.deadline as Timestamp).toDate() : null,
            location: data.location || '',
            coverUrl: data.coverUrl || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as WishList
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching lists:', err)
        error.value = 'Failed to load lists'
        loading.value = false
      }
    )
  }

  const unsubscribeFromLists = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createList = async (data: WishListForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const listsRef = collection(db, 'lists')
      const docRef = await addDoc(listsRef, {
        userId: user.value.uid,
        name: data.name,
        description: data.description || '',
        deadline: data.deadline ? Timestamp.fromDate(new Date(data.deadline)) : null,
        location: data.location || '',
        coverUrl: data.coverUrl || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating list:', err)
      return { success: false, error: 'Failed to create list' }
    }
  }

  const updateList = async (id: string, data: Partial<WishListForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const listRef = doc(db, 'lists', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.location !== undefined) updateData.location = data.location
      if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl
      if (data.deadline !== undefined) {
        updateData.deadline = data.deadline ? Timestamp.fromDate(new Date(data.deadline)) : null
      }

      await updateDoc(listRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating list:', err)
      return { success: false, error: 'Failed to update list' }
    }
  }

  const deleteList = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const listRef = doc(db, 'lists', id)
      await deleteDoc(listRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting list:', err)
      return { success: false, error: 'Failed to delete list' }
    }
  }

  const getListById = (id: string): WishList | undefined => {
    return lists.value.find(list => list.id === id)
  }

  // Auto-subscribe when user changes (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToLists()
      } else {
        unsubscribeFromLists()
        lists.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromLists()
    })
  }

  return {
    lists: readonly(lists),
    loading: readonly(loading),
    error: readonly(error),
    createList,
    updateList,
    deleteList,
    getListById,
    subscribeToLists,
    unsubscribeFromLists,
  }
}
