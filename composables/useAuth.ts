import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Auth
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore'
import type { User } from '~/types'

const user = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)

export function useAuth() {
  const nuxtApp = useNuxtApp()

  const getAuth = (): Auth | null => {
    return nuxtApp.$auth as Auth | null
  }

  const getDb = (): Firestore | null => {
    return nuxtApp.$db as Firestore | null
  }

  const initAuth = () => {
    // Only run on client side
    if (import.meta.server) {
      loading.value = false
      return
    }

    if (initialized.value) return

    const auth = getAuth()
    const db = getDb()

    if (!auth || !db) {
      console.warn('Firebase not initialized yet')
      loading.value = false
      return
    }

    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Check if user document exists
        const userRef = doc(db, 'users', firebaseUser.uid)
        const userDoc = await getDoc(userRef)

        if (!userDoc.exists()) {
          // Create new user document
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp(),
          })
        }

        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: userDoc.exists() ? userDoc.data()?.createdAt : null,
          defaultCurrency: userDoc.exists() ? userDoc.data()?.defaultCurrency : undefined,
        }
      } else {
        user.value = null
      }
      loading.value = false
    })

    initialized.value = true
  }

  const signInWithGoogle = async () => {
    const auth = getAuth()
    if (!auth) {
      return { success: false, error: 'Auth not initialized' }
    }

    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (error: unknown) {
      console.error('Google sign-in error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Sign-in failed' }
    }
  }

  const signOut = async () => {
    const auth = getAuth()
    if (!auth) {
      return { success: false, error: 'Auth not initialized' }
    }

    try {
      await firebaseSignOut(auth)
      user.value = null
      navigateTo('/')
      return { success: true }
    } catch (error: unknown) {
      console.error('Sign-out error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Sign-out failed' }
    }
  }

  const updateUserPreferences = async (preferences: { defaultCurrency?: string }) => {
    const auth = getAuth()
    const db = getDb()

    if (!auth?.currentUser || !db) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid)
      await updateDoc(userRef, { ...preferences })

      if (user.value && preferences.defaultCurrency) {
        user.value = { ...user.value, defaultCurrency: preferences.defaultCurrency }
      }

      return { success: true }
    } catch (error: unknown) {
      console.error('Error updating user preferences:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' }
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    initAuth,
    signInWithGoogle,
    signOut,
    updateUserPreferences,
  }
}
