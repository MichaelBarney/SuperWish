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
        to="/"
        class="flex items-center justify-center"
        title="SuperX"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-gradient-to-br"
          :class="[
            isSuperTrip ? 'from-purple-400 to-purple-600' :
            isSuperQuest ? 'from-green-400 to-green-600' :
            isSuperTask ? 'from-orange-400 to-orange-600' :
            isSuperXP ? 'from-rose-400 to-rose-600' :
            'from-accent-400 to-accent-600'
          ]"
        >
          <!-- Star icon for SuperWish -->
          <Icon v-if="isSuperWish" name="lucide:star" class="w-5 h-5 text-white" />
          <!-- Plane icon for SuperTrip -->
          <Icon v-else-if="isSuperTrip" name="lucide:plane" class="w-5 h-5 text-white" />
          <!-- Target icon for SuperQuest -->
          <Icon v-else-if="isSuperQuest" name="lucide:target" class="w-5 h-5 text-white" />
          <!-- Sparkles icon for SuperXP -->
          <Icon v-else-if="isSuperXP" name="lucide:sparkles" class="w-5 h-5 text-white" />
          <!-- Check icon for SuperTask -->
          <Icon v-else name="lucide:square-check-big" class="w-5 h-5 text-white" />
        </div>
      </NuxtLink>

      <!-- Close button (mobile only) -->
      <button
        v-if="isMobile"
        @click="closeMobile"
        class="absolute right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Icon name="lucide:x" class="w-5 h-5" />
      </button>
    </div>

    <!-- App Switcher -->
    <div class="px-2 py-4 border-b border-gray-150">
      <NavigationAppSwitcher :collapsed="!isMobile" />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      <!-- SuperWish Navigation -->
      <template v-if="isSuperWish">
        <NavigationAppSidebarItem
          to="/wish"
          :label="$t('dashboard.myLists')"
          :is-active="route.path === '/wish' || route.path.startsWith('/wish/')"
          :collapsed="!isMobile"
          variant="teal"
        >
          <template #icon>
            <Icon name="lucide:star" class="w-5 h-5" />
          </template>
        </NavigationAppSidebarItem>
      </template>

      <!-- SuperTrip Navigation -->
      <template v-else-if="isSuperTrip">
        <NavigationAppSidebarItem
          to="/trip"
          :label="$t('travel.nav.trips')"
          :is-active="route.path === '/trip'"
          :collapsed="!isMobile"
          variant="purple"
        >
          <template #icon>
            <Icon name="lucide:map" class="w-5 h-5" />
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
            :to="`/trip/${currentTripId}`"
            :label="$t('travel.nav.overview')"
            :is-active="route.path === `/trip/${currentTripId}`"
            :collapsed="!isMobile"
            variant="purple"
          >
            <template #icon>
              <Icon name="lucide:layout-grid" class="w-5 h-5" />
            </template>
          </NavigationAppSidebarItem>
        </template>
      </template>

      <!-- SuperQuest Navigation -->
      <template v-else-if="isSuperQuest">
        <NavigationAppSidebarItem
          to="/quest"
          :label="$t('quest.nav.quests')"
          :is-active="route.path === '/quest' || route.path.startsWith('/quest/')"
          :collapsed="!isMobile"
          variant="green"
        >
          <template #icon>
            <Icon name="lucide:target" class="w-5 h-5" />
          </template>
        </NavigationAppSidebarItem>
      </template>

      <!-- SuperTask Navigation -->
      <template v-else-if="isSuperTask">
        <NavigationAppSidebarItem
          to="/task"
          :label="$t('task.nav.myTasks')"
          :is-active="route.path === '/task' || route.path.startsWith('/task/')"
          :collapsed="!isMobile"
          variant="orange"
        >
          <template #icon>
            <Icon name="lucide:square-check-big" class="w-5 h-5" />
          </template>
        </NavigationAppSidebarItem>
      </template>

      <!-- SuperXP Navigation -->
      <template v-else-if="isSuperXP">
        <NavigationAppSidebarItem
          to="/xp"
          :label="$t('xp.nav.myExperiences')"
          :is-active="route.path === '/xp' || route.path.startsWith('/xp/')"
          :collapsed="!isMobile"
          variant="rose"
        >
          <template #icon>
            <Icon name="lucide:sparkles" class="w-5 h-5" />
          </template>
        </NavigationAppSidebarItem>
      </template>
    </nav>

    <!-- Footer - User Profile (links to settings) -->
    <div v-if="user" class="px-2 py-4 border-t border-gray-150">
      <!-- Desktop: Profile picture links to settings (hidden on mobile via lg:flex) -->
      <NuxtLink
        to="/settings"
        class="hidden lg:flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-gray-100"
        :class="route.path === '/settings' ? (isSuperTrip ? 'bg-purple-50' : isSuperQuest ? 'bg-green-50' : isSuperTask ? 'bg-orange-50' : isSuperXP ? 'bg-rose-50' : 'bg-accent-50') : ''"
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
          :class="isSuperTrip ? 'bg-purple-100' : isSuperQuest ? 'bg-green-100' : isSuperTask ? 'bg-orange-100' : isSuperXP ? 'bg-rose-100' : 'bg-accent-100'"
        >
          <span
            class="text-sm font-medium"
            :class="isSuperTrip ? 'text-purple-700' : isSuperQuest ? 'text-green-700' : isSuperTask ? 'text-orange-700' : isSuperXP ? 'text-rose-700' : 'text-accent-700'"
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
          :class="route.path === '/settings' ? (isSuperTrip ? 'bg-purple-50' : isSuperQuest ? 'bg-green-50' : isSuperTask ? 'bg-orange-50' : isSuperXP ? 'bg-rose-50' : 'bg-accent-50') : ''"
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
            :class="isSuperTrip ? 'bg-purple-100' : isSuperQuest ? 'bg-green-100' : isSuperTask ? 'bg-orange-100' : isSuperXP ? 'bg-rose-100' : 'bg-accent-100'"
          >
            <span
              class="text-sm font-medium"
              :class="isSuperTrip ? 'text-purple-700' : isSuperQuest ? 'text-green-700' : isSuperTask ? 'text-orange-700' : isSuperXP ? 'text-rose-700' : 'text-accent-700'"
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
          <Icon name="lucide:log-out" class="w-5 h-5 ml-2" />
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
const { isSuperWish, isSuperTrip, isSuperQuest, isSuperTask, isSuperXP } = useAppContext()

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
