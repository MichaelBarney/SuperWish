import { createApp } from 'nativescript-vue'
import { initializeFirebase } from './firebase'
import LoginView from './views/LoginView.vue'

// Initialize Firebase before app starts
initializeFirebase()

const app = createApp(LoginView)

app.start()
