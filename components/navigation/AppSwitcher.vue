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
      <Icon name="lucide:star" class="w-5 h-5 shrink-0" />
      <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superWish') }}</span>
    </button>

    <!-- SuperTrip Button -->
    <button
      @click="handleSwitch('supertrip')"
      class="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200"
      :class="[
        currentApp === 'supertrip'
          ? 'bg-white shadow-soft text-purple-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        collapsed ? 'w-full' : 'flex-1'
      ]"
      :title="$t('nav.superTrip')"
    >
      <!-- Plane icon for SuperTrip -->
      <Icon name="lucide:plane" class="w-5 h-5 shrink-0" />
      <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superTrip') }}</span>
    </button>

    <!-- SuperQuest Button -->
    <button
      @click="handleSwitch('superquest')"
      class="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200"
      :class="[
        currentApp === 'superquest'
          ? 'bg-white shadow-soft text-green-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        collapsed ? 'w-full' : 'flex-1'
      ]"
      :title="$t('nav.superQuest')"
    >
      <!-- Target icon for SuperQuest -->
      <Icon name="lucide:target" class="w-5 h-5 shrink-0" />
      <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superQuest') }}</span>
    </button>

    <!-- SuperTask Button -->
    <button
      @click="handleSwitch('supertask')"
      class="flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all duration-200"
      :class="[
        currentApp === 'supertask'
          ? 'bg-white shadow-soft text-orange-600'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        collapsed ? 'w-full' : 'flex-1'
      ]"
      :title="$t('nav.superTask')"
    >
      <!-- Check icon for SuperTask -->
      <Icon name="lucide:square-check-big" class="w-5 h-5 shrink-0" />
      <span v-if="!collapsed" class="text-sm font-medium">{{ $t('nav.superTask') }}</span>
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
  // Navigate to the appropriate app
  if (app === 'supertrip') {
    router.push('/trip')
  } else if (app === 'superquest') {
    router.push('/quest')
  } else if (app === 'supertask') {
    router.push('/task')
  } else {
    router.push('/wish')
  }
}
</script>
