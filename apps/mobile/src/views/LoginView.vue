<template>
  <Frame>
    <Page actionBarHidden="true">
      <FlexboxLayout class="login-container" flexDirection="column" justifyContent="center" alignItems="center">
        <!-- Logo -->
        <Label text="✓" class="login-logo" />
        <Label text="SuperTask" class="login-title" />
        <Label text="Your tasks, everywhere." class="login-subtitle" />

        <!-- Loading indicator -->
        <ActivityIndicator v-if="loading" busy="true" class="loading" />

        <!-- Sign In Button -->
        <Button
          v-if="!loading"
          text="Sign in with Google"
          class="google-btn"
          @tap="handleSignIn"
        />

        <!-- Error message -->
        <Label
          v-if="errorMessage"
          :text="errorMessage"
          class="text-caption"
          style="color: #dc2626; margin-top: 16;"
        />
      </FlexboxLayout>
    </Page>
  </Frame>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'nativescript-vue'
import { getFirebaseAuth } from '../firebase'
import InboxView from './InboxView.vue'

const loading = ref(true)
const errorMessage = ref('')

const $navigation = {
  navigate(component: any) {
    // NativeScript-Vue navigation
    const frame = (globalThis as any).__vueRootFrame
    if (frame) {
      frame.navigate({ create: () => component })
    }
  }
}

onMounted(() => {
  // Listen for auth state changes
  const auth = getFirebaseAuth()
  auth.onAuthStateChanged((user) => {
    loading.value = false
    if (user) {
      // User is signed in, navigate to inbox
      navigateToInbox()
    }
  })
})

function navigateToInbox() {
  // Navigate to InboxView, clearing the navigation stack
  const frame = Frame.topmost()
  if (frame) {
    frame.navigate({
      create: () => {
        const { createApp } = require('nativescript-vue')
        return createApp(InboxView)
      },
      clearHistory: true,
    })
  }
}

async function handleSignIn() {
  loading.value = true
  errorMessage.value = ''

  try {
    const auth = getFirebaseAuth()
    const { GoogleAuthProvider } = require('@nativescript/firebase-auth')
    const provider = new GoogleAuthProvider()
    await auth.signInWithProvider(provider)
    // Auth state listener will handle navigation
  } catch (err: any) {
    console.error('Sign-in error:', err)
    errorMessage.value = err?.message || 'Sign-in failed. Please try again.'
    loading.value = false
  }
}
</script>
