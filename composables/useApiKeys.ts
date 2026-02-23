import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

export interface ApiKey {
  id: string
  label: string
  prefix: string
  createdAt: Date | null
}

export function useApiKeys() {
  const nuxtApp = useNuxtApp()
  const { user } = useAuth()

  const getDb = (): Firestore | null => {
    if (import.meta.server) return null
    return nuxtApp.$db as Firestore | null
  }

  const apiKeys = ref<ApiKey[]>([])
  const loading = ref(false)

  let unsubscribe: (() => void) | null = null

  const subscribe = () => {
    if (import.meta.server) return

    const db = getDb()
    if (!user.value || !db) return

    loading.value = true

    const keysRef = collection(db, 'apiKeys')
    const q = query(
      keysRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        apiKeys.value = snapshot.docs.map(docSnap => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            label: data.label,
            prefix: data.prefix,
            createdAt: data.createdAt ? data.createdAt.toDate() : null,
          }
        })
        loading.value = false
      },
      (err) => {
        console.error('Error fetching API keys:', err)
        loading.value = false
      }
    )
  }

  const unsubscribeFromKeys = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  const generateKey = async (label: string): Promise<{ key: string; prefix: string } | null> => {
    const { $functions } = nuxtApp
    try {
      const fn = httpsCallable<{ label: string }, { key: string; prefix: string }>(
        $functions,
        'generateApiKey'
      )
      const result = await fn({ label })
      return result.data
    } catch (err) {
      console.error('Error generating API key:', err)
      return null
    }
  }

  const revokeKey = async (keyId: string): Promise<boolean> => {
    const { $functions } = nuxtApp
    try {
      const fn = httpsCallable<{ keyId: string }, { success: boolean }>(
        $functions,
        'revokeApiKey'
      )
      await fn({ keyId })
      return true
    } catch (err) {
      console.error('Error revoking API key:', err)
      return false
    }
  }

  if (import.meta.client) {
    watch(user, (newUser) => {
      if (newUser) {
        subscribe()
      } else {
        unsubscribeFromKeys()
        apiKeys.value = []
      }
    }, { immediate: true })

    onUnmounted(() => {
      unsubscribeFromKeys()
    })
  }

  return {
    apiKeys: readonly(apiKeys),
    loading: readonly(loading),
    generateKey,
    revokeKey,
  }
}
