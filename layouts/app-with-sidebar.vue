<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <NavigationAppSidebar v-model:mobile-open="mobileMenuOpen" />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Mobile Header -->
      <header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-150 lg:hidden">
        <div class="flex items-center justify-between h-14 px-4">
          <!-- Mobile menu button -->
          <button
            @click="mobileMenuOpen = true"
            class="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- App name -->
          <span
            class="font-semibold"
            :class="isSuperTravel ? 'text-purple-600' : 'text-accent-600'"
          >
            {{ isSuperTravel ? $t('nav.superTravel') : $t('nav.superWish') }}
          </span>

          <!-- User avatar -->
          <div v-if="user" class="p-1">
            <img
              v-if="user.photoURL"
              :src="user.photoURL"
              :alt="user.displayName || 'User'"
              class="w-8 h-8 rounded-full"
            />
            <div
              v-else
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="isSuperTravel ? 'bg-purple-100' : 'bg-accent-100'"
            >
              <span
                class="text-sm font-medium"
                :class="isSuperTravel ? 'text-purple-700' : 'text-accent-700'"
              >
                {{ user.displayName?.charAt(0) || user.email?.charAt(0) || '?' }}
              </span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { isSuperTravel } = useAppContext()
useDynamicHead()

const mobileMenuOpen = ref(false)

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
