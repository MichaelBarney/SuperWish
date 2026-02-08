<template>
  <div class="relative flex flex-col items-center py-2">
    <!-- Timeline Line (Top) -->
    <div class="w-0.5 h-6 bg-gray-300" />

    <!-- Connector Badge -->
    <div class="relative">
      <template v-if="transportation">
        <!-- Filled State - clickable to edit -->
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform cursor-pointer group hover:scale-110"
          :class="badgeBgClass"
          @click="$emit('click')"
        >
          <!-- Transport Icon -->
          <Icon v-if="transportation.type === 'flight'" name="lucide:plane" class="w-6 h-6 text-white" />
          <Icon v-else-if="transportation.type === 'train'" name="lucide:train-front" class="w-6 h-6 text-white" />
          <Icon v-else-if="transportation.type === 'bus'" name="lucide:bus" class="w-6 h-6 text-white" />
          <Icon v-else-if="transportation.type === 'car'" name="lucide:car" class="w-6 h-6 text-white" />
          <Icon v-else-if="transportation.type === 'ferry'" name="lucide:ship" class="w-6 h-6 text-white" />
          <Icon v-else name="lucide:arrow-right" class="w-6 h-6 text-white" />
        </div>

        <!-- Transport Info Card -->
        <div
          class="absolute left-full top-1/2 -translate-y-1/2 ml-1 bg-white rounded-lg shadow-soft px-3 py-1.5 min-w-[120px] text-center border border-gray-100 transition-all cursor-pointer hover:shadow-md"
          @click="$emit('click')"
        >
          <!-- Carrier & Flight Number -->
          <p class="text-xs font-semibold text-gray-800 truncate">
            {{ transportation.carrier || transportTypeLabel }}
            <span v-if="transportation.flightNumber" class="font-normal text-gray-600">
              {{ transportation.flightNumber }}
            </span>
          </p>

          <!-- Date -->
          <p v-if="formattedDate" class="text-xs text-gray-600 mt-0.5">
            {{ formattedDate }}
          </p>
          
          <!-- Times -->
          <p class="text-xs text-gray-500 mt-0.5">
            {{ formattedDepartureTime }} <span class="text-gray-400">›</span> {{ formattedArrivalTime }}
          </p>

          <!-- Duration -->
          <p v-if="duration" class="text-xs text-gray-400 mt-0.5">
            ({{ duration }})
          </p>
        </div>
      </template>

      <template v-else>
        <!-- Empty State - shows dropdown menu -->
        <div
          ref="buttonRef"
          class="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors cursor-pointer"
          @click="toggleMenu"
        >
          <Icon name="lucide:plus" class="w-5 h-5" />
        </div>

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
            v-if="isMenuOpen"
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
      </template>
    </div>

    <!-- Timeline Line (Bottom) -->
    <div class="w-0.5 flex-1 min-h-[24px] bg-gray-300 mt-2" />
  </div>
</template>

<script setup lang="ts">
import type { Transportation, TransportType } from '~/types'
import { TRANSPORT_TYPES } from '~/types'

interface Props {
  transportation?: Transportation | null
  fromLabel: string
  toLabel: string
  insertPosition?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  addDestination: [position: number]
}>()

const { locale } = useI18n()

// Menu state
const isMenuOpen = ref(false)
const buttonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleAddDestination() {
  if (props.insertPosition !== undefined) {
    emit('addDestination', props.insertPosition)
  }
  closeMenu()
}

function handleAddTransport() {
  emit('click')
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

const transportTypeLabel = computed(() => {
  if (!props.transportation) return ''
  const type = TRANSPORT_TYPES.find(t => t.value === props.transportation?.type)
  return type?.label || props.transportation.type
})

// Badge background color based on transport type
const badgeBgClass = computed(() => {
  if (!props.transportation) return 'bg-gray-200'
  const colorMap: Record<TransportType, string> = {
    flight: 'bg-blue-500',
    train: 'bg-orange-500',
    bus: 'bg-amber-500',
    car: 'bg-purple-500',
    ferry: 'bg-cyan-500',
    other: 'bg-gray-500',
  }
  return colorMap[props.transportation.type] || 'bg-gray-500'
})

// Format time only (HH:MM)
const formatTime = (dateTime: Date | string | undefined): string => {
  if (!dateTime) return '--:--'
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime)
  if (isNaN(date.getTime())) return '--:--'
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
}

const formattedDepartureTime = computed(() => formatTime(props.transportation?.departureDateTime))
const formattedArrivalTime = computed(() => formatTime(props.transportation?.arrivalDateTime))

// Format date (e.g., "Jan 15")
const formattedDate = computed(() => {
  if (!props.transportation?.departureDateTime) return null
  const date = props.transportation.departureDateTime instanceof Date
    ? props.transportation.departureDateTime
    : new Date(props.transportation.departureDateTime)
  if (isNaN(date.getTime())) return null
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })
})

// Calculate duration
const duration = computed(() => {
  if (!props.transportation?.departureDateTime || !props.transportation?.arrivalDateTime) return null
  const departure = props.transportation.departureDateTime instanceof Date
    ? props.transportation.departureDateTime
    : new Date(props.transportation.departureDateTime)
  const arrival = props.transportation.arrivalDateTime instanceof Date
    ? props.transportation.arrivalDateTime
    : new Date(props.transportation.arrivalDateTime)

  if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) return null

  const diffMs = arrival.getTime() - departure.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0 && minutes > 0) {
    return `${hours}h${minutes}min`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}min`
  }
})
</script>
