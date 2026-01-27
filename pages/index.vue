<template>
  <div class="min-h-screen flex flex-col">
    <!-- Hero Section -->
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <!-- Logo & Title -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-soft mb-6">
            <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">SuperWish</h1>
          <p class="text-gray-500">Organize your wishes beautifully</p>
        </div>

        <!-- Sign In Card -->
        <div class="bg-white rounded-2xl shadow-soft p-8">
          <div v-if="loading" class="flex flex-col items-center py-8">
            <svg class="animate-spin h-8 w-8 text-accent-500 mb-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p class="text-gray-500">Checking authentication...</p>
          </div>

          <template v-else>
            <h2 class="text-xl font-semibold text-gray-900 text-center mb-6">
              Welcome back
            </h2>
            <AuthGoogleSignIn />
            <p class="mt-6 text-xs text-gray-400 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </template>
        </div>

        <!-- Features -->
        <div class="mt-12 grid grid-cols-3 gap-4 text-center">
          <div class="p-4">
            <div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-3">
              <svg class="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-700">Organize Lists</p>
          </div>
          <div class="p-4">
            <div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-3">
              <svg class="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-700">Track Wishes</p>
          </div>
          <div class="p-4">
            <div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-3">
              <svg class="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-700">Set Deadlines</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-6 text-center">
      <p class="text-sm text-gray-400">Made with care for gift-givers everywhere</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user, loading, initAuth } = useAuth()

onMounted(() => {
  initAuth()
})

// Redirect to dashboard if already logged in
watch(
  () => [user.value, loading.value],
  ([currentUser, isLoading]) => {
    if (!isLoading && currentUser) {
      navigateTo('/dashboard')
    }
  },
  { immediate: true }
)
</script>
