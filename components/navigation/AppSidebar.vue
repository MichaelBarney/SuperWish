<template>
  <!-- Mobile overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="mobileOpen && isMobile"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="closeMobile"
      />
    </Transition>
  </Teleport>

  <!-- Sidebar (always collapsed on desktop, full on mobile) -->
  <aside
    class="flex flex-col bg-white border-r border-gray-150 z-50"
    :class="[
      isMobile ? 'fixed inset-y-0 left-0 w-64 transform transition-transform duration-300' : 'sticky top-0 h-screen w-[72px]',
      isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0',
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-center h-16 border-b border-gray-150">
      <NuxtLink
        :to="isSuperTravel ? '/travel' : '/dashboard'"
        class="flex items-center justify-center"
        :title="isSuperTravel ? $t('nav.superTravel') : $t('nav.superWish')"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          :class="isSuperTravel ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-accent-400 to-accent-600'"
        >
          <!-- Star icon for SuperWish -->
          <svg v-if="!isSuperTravel" class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <!-- Plane icon for SuperTravel -->
          <svg v-else class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      </NuxtLink>

      <!-- Close button (mobile only) -->
      <button
        v-if="isMobile"
        @click="closeMobile"
        class="absolute right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- App Switcher -->
    <div class="px-2 py-4 border-b border-gray-150">
      <NavigationAppSwitcher :collapsed="!isMobile" />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      <!-- SuperWish Navigation -->
      <template v-if="!isSuperTravel">
        <NavigationAppSidebarItem
          to="/dashboard"
          :label="$t('nav.dashboard')"
          :is-active="route.path === '/dashboard'"
          :collapsed="!isMobile"
          variant="teal"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </template>
        </NavigationAppSidebarItem>
      </template>

      <!-- SuperTravel Navigation -->
      <template v-else>
        <NavigationAppSidebarItem
          to="/travel"
          :label="$t('travel.nav.trips')"
          :is-active="route.path === '/travel'"
          :collapsed="!isMobile"
          variant="purple"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </template>
        </NavigationAppSidebarItem>

        <!-- Current trip navigation (when in a trip) -->
        <template v-if="currentTripId">
          <div v-if="isMobile" class="pt-4 pb-2 px-3">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {{ $t('travel.nav.currentTrip') }}
            </span>
          </div>
          <div v-else class="py-2">
            <div class="h-px bg-gray-200 mx-2" />
          </div>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}`"
            :label="$t('travel.nav.overview')"
            :is-active="route.path === `/travel/${currentTripId}`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </template>
          </NavigationAppSidebarItem>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}/destinations`"
            :label="$t('travel.nav.destinations')"
            :is-active="route.path === `/travel/${currentTripId}/destinations`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
          </NavigationAppSidebarItem>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}/transportation`"
            :label="$t('travel.nav.transportation')"
            :is-active="route.path === `/travel/${currentTripId}/transportation`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </template>
          </NavigationAppSidebarItem>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}/accommodations`"
            :label="$t('travel.nav.accommodations')"
            :is-active="route.path === `/travel/${currentTripId}/accommodations`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </template>
          </NavigationAppSidebarItem>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}/experiences`"
            :label="$t('travel.nav.experiences')"
            :is-active="route.path === `/travel/${currentTripId}/experiences`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </template>
          </NavigationAppSidebarItem>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}/budget`"
            :label="$t('travel.nav.budget')"
            :is-active="route.path === `/travel/${currentTripId}/budget`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </template>
          </NavigationAppSidebarItem>

          <NavigationAppSidebarItem
            :to="`/travel/${currentTripId}/calendar`"
            :label="$t('travel.nav.calendar')"
            :is-active="route.path === `/travel/${currentTripId}/calendar`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </template>
          </NavigationAppSidebarItem>
        </template>
      </template>
    </nav>

    <!-- Footer - User Profile (links to settings) -->
    <div v-if="user" class="px-2 py-4 border-t border-gray-150">
      <!-- Desktop: Profile picture links to settings (hidden on mobile via lg:flex) -->
      <NuxtLink
        to="/settings"
        class="hidden lg:flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
        :class="route.path === '/settings' ? (isSuperTravel ? 'bg-purple-50' : 'bg-accent-50') : ''"
        :title="$t('nav.settings')"
      >
        <img
          v-if="user.photoURL"
          :src="user.photoURL"
          :alt="user.displayName || 'User'"
          class="w-9 h-9 rounded-full ring-2 ring-gray-100"
        />
        <div
          v-else
          class="w-9 h-9 rounded-full flex items-center justify-center"
          :class="isSuperTravel ? 'bg-purple-100' : 'bg-accent-100'"
        >
          <span
            class="text-sm font-medium"
            :class="isSuperTravel ? 'text-purple-700' : 'text-accent-700'"
          >
            {{ user.displayName?.charAt(0) || user.email?.charAt(0) || '?' }}
          </span>
        </div>
      </NuxtLink>

      <!-- Mobile: Profile with settings link and sign out (hidden on desktop via lg:hidden) -->
      <div class="lg:hidden space-y-2">
        <NuxtLink
          to="/settings"
          class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
          :class="route.path === '/settings' ? (isSuperTravel ? 'bg-purple-50' : 'bg-accent-50') : ''"
        >
          <img
            v-if="user.photoURL"
            :src="user.photoURL"
            :alt="user.displayName || 'User'"
            class="w-9 h-9 rounded-full ring-2 ring-gray-100 shrink-0"
          />
          <div
            v-else
            class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            :class="isSuperTravel ? 'bg-purple-100' : 'bg-accent-100'"
          >
            <span
              class="text-sm font-medium"
              :class="isSuperTravel ? 'text-purple-700' : 'text-accent-700'"
            >
              {{ user.displayName?.charAt(0) || user.email?.charAt(0) || '?' }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ user.displayName || user.email }}
            </p>
            <span class="text-xs text-gray-500">
              {{ $t('nav.settings') }}
            </span>
          </div>
        </NuxtLink>

        <button
          @click="handleSignOut"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <svg class="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="text-sm font-medium">{{ $t('nav.signOut') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface Props {
  mobileOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mobileOpen: false,
})

const emit = defineEmits<{
  'update:mobileOpen': [value: boolean]
}>()

const route = useRoute()
const { user, signOut } = useAuth()
const { isSuperTravel } = useAppContext()

// Check if we're on mobile
const isMobile = ref(false)

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 1024
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  onUnmounted(() => window.removeEventListener('resize', checkMobile))
})

// Get current trip ID from route if we're in a trip
const currentTripId = computed(() => {
  const tripId = route.params.tripId
  return typeof tripId === 'string' ? tripId : undefined
})

const closeMobile = () => {
  emit('update:mobileOpen', false)
}

const handleSignOut = async () => {
  await signOut()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
