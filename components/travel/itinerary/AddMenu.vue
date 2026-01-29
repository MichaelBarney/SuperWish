<template>
  <div class="relative ml-8 py-2">
    <!-- Circular + Button -->
    <button
      ref="buttonRef"
      @click="toggleMenu"
      class="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="menuRef"
        class="absolute left-10 top-0 z-50 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
      >
        <!-- Add Destination Option -->
        <button
          @click="handleAddDestination"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
        >
          <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span class="font-medium">{{ $t('travel.destinations.addDestination') }}</span>
        </button>

        <!-- Add Transport Option -->
        <button
          @click="handleAddTransport"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <span class="font-medium">{{ $t('travel.transportation.addTransport') }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  fromId: string | null
  toId: string | null
  insertPosition: number
}>()

const emit = defineEmits<{
  addDestination: [position: number]
  addTransport: [fromId: string | null, toId: string | null]
}>()

const isOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function handleAddDestination() {
  emit('addDestination', props.insertPosition)
  closeMenu()
}

function handleAddTransport() {
  emit('addTransport', props.fromId, props.toId)
  closeMenu()
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (
    buttonRef.value &&
    menuRef.value &&
    !buttonRef.value.contains(target) &&
    !menuRef.value.contains(target)
  ) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
