<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-150">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/dashboard" class="flex items-center gap-2 group">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center">
              <Icon name="lucide:star" class="w-5 h-5 text-white" />
            </div>
            <span class="font-semibold text-gray-900 group-hover:text-accent-600 transition-colors">
              {{ $t('nav.appName') }}
            </span>
          </NuxtLink>

          <!-- User Menu -->
          <div v-if="user" class="flex items-center gap-4">
            <div class="flex items-center gap-3">
              <img
                v-if="user.photoURL"
                :src="user.photoURL"
                :alt="user.displayName || 'User'"
                class="w-8 h-8 rounded-full ring-2 ring-gray-100"
              />
              <div v-else class="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center">
                <span class="text-sm font-medium text-accent-700">
                  {{ user.displayName?.charAt(0) || user.email?.charAt(0) || '?' }}
                </span>
              </div>
              <span class="hidden sm:block text-sm font-medium text-gray-700">
                {{ user.displayName || user.email }}
              </span>
            </div>
            <NuxtLink
              to="/settings"
              class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              :title="$t('nav.settings')"
            >
              <Icon name="lucide:settings" class="w-5 h-5" />
            </NuxtLink>
            <button
              @click="handleSignOut"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {{ $t('nav.signOut') }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { user, signOut } = useAuth()

const handleSignOut = async () => {
  await signOut()
}
</script>
