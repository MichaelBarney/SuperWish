<template>
  <div class="flex items-center gap-4 py-3">
    <!-- Drag Handle (only for destinations, not origin) -->
    <div
      v-if="draggable && !isOrigin"
      class="drag-handle cursor-grab active:cursor-grabbing p-1 -ml-2 text-gray-300 hover:text-gray-500 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>
    </div>

    <!-- Point Marker -->
    <div
      class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      :class="isOrigin ? 'bg-green-100' : 'bg-purple-100'"
    >
      <template v-if="isOrigin">
        <svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </template>
      <template v-else>
        <span class="text-sm font-semibold text-purple-700">{{ order }}</span>
      </template>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h3 class="font-medium text-gray-900">{{ label }}</h3>
      <p v-if="sublabel && !compact" class="text-sm text-gray-500">
        <span v-if="countryFlag">{{ countryFlag }} &nbsp;</span>{{ sublabel }}
      </p>

      <!-- Datas com destaque -->
      <div v-if="arrivalDate || departureDate" class="mt-1.5 flex items-center gap-3 text-sm">
        <!-- Chegada -->
        <div v-if="arrivalDate" class="flex items-center gap-1">
          <span class="text-gray-400 text-xs">{{ $t('travel.itinerary.arrives') }}</span>
          <span class="font-medium text-gray-700">{{ arrivalDate }}</span>
        </div>

        <!-- Separador visual -->
        <span v-if="arrivalDate && departureDate" class="text-gray-300">→</span>

        <!-- Saída -->
        <div v-if="departureDate" class="flex items-center gap-1">
          <span class="text-gray-400 text-xs">{{ $t('travel.itinerary.leaves') }}</span>
          <span class="font-medium text-gray-700">{{ departureDate }}</span>
        </div>

        <!-- Duração (badge) -->
        <span v-if="durationDays" class="ml-auto px-2 py-0.5 bg-purple-50 text-purple-600 text-xs font-medium rounded-full">
          {{ durationDays }}
        </span>
      </div>
    </div>

    <!-- Edit Button (only for destinations, not origin) -->
    <button
      v-if="!isOrigin && showEdit"
      @click="$emit('click')"
      class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>

    <!-- Add Origin Button (when origin not set) -->
    <button
      v-if="isOrigin && !label"
      @click="$emit('click')"
      class="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
    >
      {{ $t('travel.itinerary.setOrigin') }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  sublabel?: string
  countryCode?: string
  arrivalDate?: string
  departureDate?: string
  durationDays?: string
  order?: number
  isOrigin?: boolean
  showEdit?: boolean
  draggable?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOrigin: false,
  showEdit: true,
  draggable: false,
  compact: false,
})

defineEmits<{
  click: []
}>()

// Computed para flag do país
const countryFlag = computed(() => {
  if (!props.countryCode) return ''
  const codePoints = props.countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
})
</script>
