<template>
  <div class="relative flex flex-col items-center py-2">
    <!-- Timeline line above button -->
    <div class="w-0.5 h-4 bg-gray-300" />

    <!-- Green Circular + Button -->
    <button
      ref="buttonRef"
      @click="toggleMenu"
      class="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
    >
      <Icon name="lucide:plus" class="w-6 h-6" />
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
        class="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2"
      >
        <!-- Add Destination Option -->
        <button
          @click="handleAddDestination"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
        >
          <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Icon name="lucide:map-pin" class="w-4 h-4 text-purple-600" />
          </div>
          <span class="font-medium">{{ $t('travel.destinations.addDestination') }}</span>
        </button>

        <!-- Add Transport Option -->
        <button
          @click="handleAddTransport"
          class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        >
          <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Icon name="lucide:plane" class="w-4 h-4 text-blue-600" />
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
