import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  }

  // Initialize Firebase only if it hasn't been initialized yet
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  const auth = getAuth(app)
  const db = getFirestore(app)
  const storage = getStorage(app)
  const functions = getFunctions(app)

  // Connect to local emulator in development
  if (process.dev) {
    connectFunctionsEmulator(functions, 'localhost', 5001)
  }

  return {
    provide: {
      firebase: app,
      auth,
      db,
      storage,
      functions,
    }
  }
})
