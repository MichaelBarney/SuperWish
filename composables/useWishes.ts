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
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import type { Wish, WishForm, WishStatus, Priority, PriceSource, WishQuestion } from '~/types'
import { isOwnedStatus, normalizeStatus } from '~/types'

// Parse date string as local time (not UTC)
function parseLocalDate(dateStr: string): Date {
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateStr)
}

export function useWishes(listId?: Ref<string | null | undefined>) {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const wishes = ref<Wish[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Status sort order: shipping -> wanted -> owned -> gifted
  const statusOrder: Record<WishStatus, number> = {
    shipping: 0,
    wanted: 1,
    owned: 2,
    gifted: 3,
  }

  // Helper to get the effective price for sorting (uses target price)
  const getEffectivePrice = (wish: Wish): number => {
    return wish.targetPrice ?? Infinity
  }

  // Sort wishes by status -> priority (desc) -> price (asc)
  const sortWishes = (wishList: Wish[]): Wish[] => {
    return [...wishList].sort((a, b) => {
      // First sort by status (normalize legacy statuses)
      const statusA = normalizeStatus(a.status)
      const statusB = normalizeStatus(b.status)
      const statusDiff = statusOrder[statusA] - statusOrder[statusB]
      if (statusDiff !== 0) {
        return statusDiff
      }
      // Then by priority (higher priority first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      // Then by price (cheaper first)
      return getEffectivePrice(a) - getEffectivePrice(b)
    })
  }

  let unsubscribe: (() => void) | null = null

  // Subscribe to wishes - pass null to get unassigned wishes
  const subscribeToWishes = (targetListId?: string | null) => {
    if (import.meta.server) return

    const db = getDb()
    // Use targetListId if provided, otherwise use listId ref value
    // If listId ref is explicitly null, we want unassigned wishes
    const id = targetListId !== undefined ? targetListId : listId?.value
    if (!user.value || !db) return
    // For regular lists, we need an id. For unassigned wishes, id should be null
    if (id === undefined) return

    loading.value = true
    error.value = null

    const wishesRef = collection(db, 'wishes')
    const q = query(
      wishesRef,
      where('listId', '==', id),
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rawWishes = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          // Normalize legacy statuses (purchased, delivered -> owned)
          const rawStatus = data.status || 'wanted'
          const normalizedStatus = normalizeStatus(rawStatus)
          return {
            id: docSnap.id,
            listId: data.listId,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            shoppingLinks: data.shoppingLinks || [],
            expectedPrice: data.expectedPrice,
            targetPrice: data.targetPrice,
            priceSources: data.priceSources || [],
            currency: data.currency || 'USD',
            priority: data.priority || 3,
            status: normalizedStatus,
            trackingUrl: data.trackingUrl || '',
            estimatedDelivery: data.estimatedDelivery
              ? (data.estimatedDelivery as Timestamp).toDate()
              : null,
            forPerson: data.forPerson || '',
            questions: data.questions || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Wish
        })
        // Filter out owned items from regular list views
        const filteredWishes = rawWishes.filter(wish => wish.status !== 'owned')
        // Sort by priority (desc) then by price (asc)
        wishes.value = sortWishes(filteredWishes)
        loading.value = false
      },
      (err) => {
        console.error('Error fetching wishes:', err)
        error.value = 'Failed to load wishes'
        loading.value = false
      }
    )
  }

  const unsubscribeFromWishes = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const createWish = async (targetListId: string | null, data: WishForm) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const wishesRef = collection(db, 'wishes')
      // Convert price sources from form format to storage format
      const priceSources: PriceSource[] = (data.priceSources || [])
        .filter(s => s.storeName && s.price)
        .map(s => ({
          storeName: s.storeName,
          price: parseFloat(s.price),
          currency: s.currency,
          url: s.url || undefined,
          imageUrl: s.imageUrl || undefined,
          searchedAt: s.searchedAt ? new Date(s.searchedAt) : null,
        }))

      // Filter out empty answers from questions
      const questions: WishQuestion[] = (data.questions || [])
        .filter(q => q.answer.trim())
        .map(q => ({ questionKey: q.questionKey, answer: q.answer.trim() }))

      const docRef = await addDoc(wishesRef, {
        listId: targetListId,
        userId: user.value.uid,
        title: data.title,
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        shoppingLinks: data.shoppingLinks || [],
        expectedPrice: data.expectedPrice ? parseFloat(data.expectedPrice) : null,
        targetPrice: data.targetPrice ? parseFloat(data.targetPrice) : null,
        priceSources: priceSources,
        currency: data.currency || 'USD',
        priority: data.priority || 3,
        status: data.status || 'wanted',
        trackingUrl: data.trackingUrl || '',
        estimatedDelivery: data.estimatedDelivery
          ? Timestamp.fromDate(parseLocalDate(data.estimatedDelivery))
          : null,
        forPerson: data.forPerson || '',
        questions: questions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return { success: true, id: docRef.id }
    } catch (err) {
      console.error('Error creating wish:', err)
      return { success: false, error: 'Failed to create wish' }
    }
  }

  const updateWish = async (id: string, data: Partial<WishForm>) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const wishRef = doc(db, 'wishes', id)
      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      }

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
      if (data.shoppingLinks !== undefined) updateData.shoppingLinks = data.shoppingLinks
      if (data.expectedPrice !== undefined) {
        updateData.expectedPrice = data.expectedPrice ? parseFloat(data.expectedPrice) : null
      }
      if (data.targetPrice !== undefined) {
        updateData.targetPrice = data.targetPrice ? parseFloat(data.targetPrice) : null
      }
      if (data.priceSources !== undefined) {
        updateData.priceSources = (data.priceSources || [])
          .filter(s => s.storeName && s.price)
          .map(s => ({
            storeName: s.storeName,
            price: parseFloat(s.price),
            currency: s.currency,
            url: s.url || undefined,
            imageUrl: s.imageUrl || undefined,
            searchedAt: s.searchedAt ? new Date(s.searchedAt) : null,
          }))
      }
      if (data.currency !== undefined) updateData.currency = data.currency
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.status !== undefined) updateData.status = data.status
      if (data.trackingUrl !== undefined) updateData.trackingUrl = data.trackingUrl
      if (data.estimatedDelivery !== undefined) {
        updateData.estimatedDelivery = data.estimatedDelivery
          ? Timestamp.fromDate(parseLocalDate(data.estimatedDelivery))
          : null
      }
      if (data.forPerson !== undefined) updateData.forPerson = data.forPerson
      if (data.questions !== undefined) {
        updateData.questions = (data.questions || [])
          .filter(q => q.answer.trim())
          .map(q => ({ questionKey: q.questionKey, answer: q.answer.trim() }))
      }

      await updateDoc(wishRef, updateData)
      return { success: true }
    } catch (err) {
      console.error('Error updating wish:', err)
      return { success: false, error: 'Failed to update wish' }
    }
  }

  const updateWishStatus = async (id: string, status: WishStatus) => {
    return updateWish(id, { status } as Partial<WishForm>)
  }

  const updateWishPriority = async (id: string, priority: Priority) => {
    return updateWish(id, { priority } as Partial<WishForm>)
  }

  const deleteWish = async (id: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const wishRef = doc(db, 'wishes', id)
      await deleteDoc(wishRef)
      return { success: true }
    } catch (err) {
      console.error('Error deleting wish:', err)
      return { success: false, error: 'Failed to delete wish' }
    }
  }

  const moveWishToList = async (wishId: string, newListId: string | null) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const wishRef = doc(db, 'wishes', wishId)
      await updateDoc(wishRef, {
        listId: newListId,
        updatedAt: serverTimestamp(),
      })
      return { success: true }
    } catch (err) {
      console.error('Error moving wish:', err)
      return { success: false, error: 'Failed to move wish' }
    }
  }

  const moveMultipleWishesToList = async (wishIds: string[], newListId: string) => {
    const db = getDb()
    if (!user.value) return { success: false, error: 'Not authenticated' }
    if (!db) return { success: false, error: 'Database not initialized' }

    try {
      const batch = writeBatch(db)

      wishIds.forEach(wishId => {
        const wishRef = doc(db, 'wishes', wishId)
        batch.update(wishRef, {
          listId: newListId,
          updatedAt: serverTimestamp(),
        })
      })

      await batch.commit()
      return { success: true }
    } catch (err) {
      console.error('Error moving wishes:', err)
      return { success: false, error: 'Failed to move wishes' }
    }
  }

  const getWishById = (id: string): Wish | undefined => {
    return wishes.value.find(wish => wish.id === id)
  }

  // Auto-subscribe when listId changes (only on client)
  // listId can be: undefined (no ref passed), string (specific list), or null (unassigned wishes)
  if (import.meta.client && listId !== undefined) {
    watch([user, listId], ([newUser, newListId]) => {
      unsubscribeFromWishes()
      // Subscribe if user exists and listId is defined (including null for unassigned)
      if (newUser && newListId !== undefined) {
        subscribeToWishes(newListId)
      } else {
        wishes.value = []
      }
    }, { immediate: true })

    // Cleanup on unmount
    onUnmounted(() => {
      unsubscribeFromWishes()
    })
  }

  return {
    wishes: readonly(wishes) as Readonly<Ref<Wish[]>>,
    loading: readonly(loading),
    error: readonly(error),
    createWish,
    updateWish,
    updateWishStatus,
    updateWishPriority,
    deleteWish,
    moveWishToList,
    moveMultipleWishesToList,
    getWishById,
    subscribeToWishes,
    unsubscribeFromWishes,
  }
}

// Composable for fetching all owned wishes across all lists
export function useOwnedWishes() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const wishes = ref<Wish[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToOwnedWishes = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    // Query all wishes for this user - we'll filter by status client-side
    // since we need to match multiple statuses (owned, purchased, delivered)
    const wishesRef = collection(db, 'wishes')
    const q = query(
      wishesRef,
      where('userId', '==', user.value.uid),
      orderBy('updatedAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allWishes = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          const rawStatus = data.status || 'wanted'
          const normalizedStatus = normalizeStatus(rawStatus)
          return {
            id: docSnap.id,
            listId: data.listId,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            shoppingLinks: data.shoppingLinks || [],
            expectedPrice: data.expectedPrice,
            targetPrice: data.targetPrice,
            priceSources: data.priceSources || [],
            currency: data.currency || 'USD',
            priority: data.priority || 3,
            status: normalizedStatus,
            trackingUrl: data.trackingUrl || '',
            estimatedDelivery: data.estimatedDelivery
              ? (data.estimatedDelivery as Timestamp).toDate()
              : null,
            forPerson: data.forPerson || '',
            questions: data.questions || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Wish
        })
        // Filter to only include owned items
        wishes.value = allWishes.filter(wish => wish.status === 'owned')
        loading.value = false
      },
      (err) => {
        console.error('Error fetching owned wishes:', err)
        error.value = 'Failed to load owned wishes'
        loading.value = false
      }
    )
  }

  const unsubscribeFromOwnedWishes = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Auto-subscribe when user is available (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      unsubscribeFromOwnedWishes()
      if (newUser) {
        subscribeToOwnedWishes()
      } else {
        wishes.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromOwnedWishes()
    })
  }

  return {
    ownedWishes: readonly(wishes) as Readonly<Ref<Wish[]>>,
    loading: readonly(loading),
    error: readonly(error),
    subscribeToOwnedWishes,
    unsubscribeFromOwnedWishes,
  }
}

// Composable for fetching all shipping wishes across all lists
export function useShippingWishes() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const wishes = ref<Wish[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: (() => void) | null = null

  const subscribeToShippingWishes = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true
    error.value = null

    const wishesRef = collection(db, 'wishes')
    const q = query(
      wishesRef,
      where('userId', '==', user.value.uid),
      orderBy('updatedAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allWishes = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          const rawStatus = data.status || 'wanted'
          const normalizedStatus = normalizeStatus(rawStatus)
          return {
            id: docSnap.id,
            listId: data.listId,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            shoppingLinks: data.shoppingLinks || [],
            expectedPrice: data.expectedPrice,
            targetPrice: data.targetPrice,
            priceSources: data.priceSources || [],
            currency: data.currency || 'USD',
            priority: data.priority || 3,
            status: normalizedStatus,
            trackingUrl: data.trackingUrl || '',
            estimatedDelivery: data.estimatedDelivery
              ? (data.estimatedDelivery as Timestamp).toDate()
              : null,
            forPerson: data.forPerson || '',
            questions: data.questions || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Wish
        })
        // Filter to only include shipping items
        wishes.value = allWishes.filter(wish => wish.status === 'shipping')
        loading.value = false
      },
      (err) => {
        console.error('Error fetching shipping wishes:', err)
        error.value = 'Failed to load shipping wishes'
        loading.value = false
      }
    )
  }

  const unsubscribeFromShippingWishes = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Auto-subscribe when user is available (only on client)
  if (import.meta.client) {
    watch(user, (newUser) => {
      unsubscribeFromShippingWishes()
      if (newUser) {
        subscribeToShippingWishes()
      } else {
        wishes.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromShippingWishes()
    })
  }

  return {
    shippingWishes: readonly(wishes) as Readonly<Ref<Wish[]>>,
    loading: readonly(loading),
    error: readonly(error),
    subscribeToShippingWishes,
    unsubscribeFromShippingWishes,
  }
}
