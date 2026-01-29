<template>
  <div class="flex flex-col gap-1 rounded-lg p-1 bg-gray-100">
    <!-- SuperWish Button -->
    <button
      @click="handleSwitch('superwish')"
      class="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200"
      :class="[
        currentApp === 'superwish'
          ? 'bg-white shadow-soft text-accent-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        collapsed ? 'w-full' : 'flex-1'
      ]"
      :title="$t('nav.superWish')"
    >
      <!-- Star icon for SuperWish -->
      <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superWish') }}</span>
    </button>

    <!-- SuperTravel Button -->
    <button
      @click="handleSwitch('supertravel')"
      class="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200"
      :class="[
        currentApp === 'supertravel'
          ? 'bg-white shadow-soft text-purple-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        collapsed ? 'w-full' : 'flex-1'
      ]"
      :title="$t('nav.superTravel')"
    >
      <!-- Plane icon for SuperTravel -->
      <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superTravel') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AppType } from '~/composables/useAppContext'

interface Props {
  collapsed?: boolean
}

withDefaults(defineProps<Props>(), {
  collapsed: true,
})

const { currentApp, setApp } = useAppContext()
const router = useRouter()

const handleSwitch = (app: AppType) => {
  setApp(app)
  // Navigate to the appropriate dashboard
  if (app === 'supertravel') {
    router.push('/travel')
  } else {
    router.push('/dashboard')
  }
}
</script>
