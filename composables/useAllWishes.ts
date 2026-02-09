import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type Firestore,
} from 'firebase/firestore'
import type { Wish } from '~/types'
import { normalizeStatus } from '~/types'

export function useAllWishes() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const wishes = ref<Wish[]>([])
  const loading = ref(false)

  let unsubscribe: (() => void) | null = null

  const subscribeToAllWishes = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true

    const wishesRef = collection(db, 'wishes')
    const q = query(
      wishesRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        wishes.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            listId: data.listId || null,
            userId: data.userId,
            title: data.title,
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            shoppingLinks: data.shoppingLinks || [],
            expectedPrice: data.expectedPrice || undefined,
            targetPrice: data.targetPrice || undefined,
            priceSources: data.priceSources || [],
            currency: data.currency || 'USD',
            priority: data.priority || 3,
            status: normalizeStatus(data.status || 'wanted'),
            trackingUrl: data.trackingUrl || '',
            estimatedDelivery: data.estimatedDelivery ? (data.estimatedDelivery as Timestamp).toDate() : null,
            forPerson: data.forPerson || '',
            questions: data.questions || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Wish
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching all wishes:', err)
        loading.value = false
      }
    )
  }

  const unsubscribeFromAllWishes = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const getWishById = (id: string): Wish | undefined => {
    return wishes.value.find(w => w.id === id)
  }

  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribeToAllWishes()
      } else {
        unsubscribeFromAllWishes()
        wishes.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromAllWishes()
    })
  }

  return {
    wishes: readonly(wishes),
    loading: readonly(loading),
    getWishById,
  }
}
