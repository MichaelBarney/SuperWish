<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Hero Section -->
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-4xl">
        <!-- Logo & Title -->
        <div class="text-center mb-10">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-soft mb-6">
            <span class="text-3xl font-bold text-white">X</span>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">SuperX</h1>
          <p class="text-gray-500 text-lg">{{ $t('landing.tagline') }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center py-12">
          <Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-gray-500 mb-4" />
          <p class="text-gray-500">{{ $t('auth.checkingAuth') }}</p>
        </div>

        <!-- Logged In: App Selector -->
        <template v-else-if="user">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- SuperWish Card -->
            <NuxtLink
              to="/wish"
              class="group flex flex-col bg-white rounded-2xl shadow-soft p-6 text-center transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 border-2 border-transparent hover:border-accent-200"
            >
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                <Icon name="lucide:star" class="w-8 h-8 text-white" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">SuperWish</h2>
              <p class="text-gray-500 text-sm flex-1">{{ $t('landing.superWishDescription') }}</p>
            </NuxtLink>

            <!-- SuperTrip Card -->
            <NuxtLink
              to="/trip"
              class="group flex flex-col bg-white rounded-2xl shadow-soft p-6 text-center transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 border-2 border-transparent hover:border-purple-200"
            >
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                <Icon name="lucide:plane" class="w-8 h-8 text-white" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">SuperTrip</h2>
              <p class="text-gray-500 text-sm flex-1">{{ $t('landing.superTripDescription') }}</p>
            </NuxtLink>

            <!-- SuperQuest Card -->
            <NuxtLink
              to="/quest"
              class="group flex flex-col bg-white rounded-2xl shadow-soft p-6 text-center transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 border-2 border-transparent hover:border-green-200"
            >
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                <Icon name="lucide:target" class="w-8 h-8 text-white" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">SuperQuest</h2>
              <p class="text-gray-500 text-sm flex-1">{{ $t('landing.superQuestDescription') }}</p>
            </NuxtLink>

            <!-- SuperTask Card -->
            <NuxtLink
              to="/task"
              class="group flex flex-col bg-white rounded-2xl shadow-soft p-6 text-center transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 border-2 border-transparent hover:border-orange-200"
            >
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
                <Icon name="lucide:square-check-big" class="w-8 h-8 text-white" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">SuperTask</h2>
              <p class="text-gray-500 text-sm flex-1">{{ $t('landing.superTaskDescription') }}</p>
            </NuxtLink>
          </div>

          <!-- User info -->
          <div class="text-center text-sm text-gray-500">
            <span>{{ $t('landing.signedInAs') }} &nbsp; </span>
            <span class="font-medium text-gray-700">{{ user.displayName || user.email }}</span>
            <span class="mx-2">·</span>
            <button
              @click="handleSignOut"
              class="text-gray-500 hover:text-gray-700 underline"
            >
              {{ $t('nav.signOut') }}
            </button>
          </div>
        </template>

        <!-- Not Logged In: Sign In -->
        <template v-else>
          <div class="bg-white rounded-2xl shadow-soft p-8 max-w-md mx-auto">
            <h2 class="text-xl font-semibold text-gray-900 text-center mb-6">
              {{ $t('landing.welcomeBack') }}
            </h2>
            <AuthGoogleSignIn />
            <p class="mt-6 text-xs text-gray-400 text-center">
              {{ $t('auth.termsNotice') }}
            </p>
          </div>

          <!-- Features -->
          <div class="mt-12 grid grid-cols-4 gap-4 text-center max-w-lg mx-auto">
            <div class="p-4">
              <div class="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-3">
                <Icon name="lucide:archive" class="w-5 h-5 text-accent-600" />
              </div>
              <p class="text-sm font-medium text-gray-700">{{ $t('landing.organizeLists') }}</p>
            </div>
            <div class="p-4">
              <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                <Icon name="lucide:plane" class="w-5 h-5 text-purple-600" />
              </div>
              <p class="text-sm font-medium text-gray-700">{{ $t('landing.planTrips') }}</p>
            </div>
            <div class="p-4">
              <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                <Icon name="lucide:target" class="w-5 h-5 text-green-600" />
              </div>
              <p class="text-sm font-medium text-gray-700">{{ $t('landing.trackQuests') }}</p>
            </div>
            <div class="p-4">
              <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                <Icon name="lucide:square-check-big" class="w-5 h-5 text-orange-600" />
              </div>
              <p class="text-sm font-medium text-gray-700">{{ $t('landing.manageTasks') }}</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-6 text-center">
      <p class="text-sm text-gray-400">{{ $t('landing.footer') }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { user, loading, initAuth, signOut } = useAuth()

onMounted(() => {
  initAuth()
})

async function handleSignOut() {
  await signOut()
}
</script>
