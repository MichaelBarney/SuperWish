import { firebase } from '@nativescript/firebase-core'
import '@nativescript/firebase-auth'
import '@nativescript/firebase-firestore'

let initialized = false

export function initializeFirebase() {
  if (initialized) return
  firebase().initializeApp()
  initialized = true
}

export function getFirebaseAuth() {
  return firebase().auth()
}

export function getFirebaseFirestore() {
  return firebase().firestore()
}
