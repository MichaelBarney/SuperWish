<template>
  <div
    class="flex flex-col items-center gap-1 px-2 py-1 cursor-pointer group"
    @click="$emit('click')"
  >
    <!-- Linha conectora com ícone -->
    <div class="flex items-center gap-1 text-gray-300 group-hover:text-purple-400 transition-colors">
      <div class="w-6 h-px bg-current" />
      <div
        class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        :class="transportation ? iconBgClass : 'bg-gray-100 group-hover:bg-purple-100'"
      >
        <template v-if="transportation">
          <!-- Flight icon -->
          <svg v-if="transportation.type === 'flight'" class="w-3.5 h-3.5" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <!-- Train icon -->
          <svg v-else-if="transportation.type === 'train'" class="w-3.5 h-3.5" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17l-2 4m10-4l2 4M12 17V3m-4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H8a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
          <!-- Bus icon -->
          <svg v-else-if="transportation.type === 'bus'" class="w-3.5 h-3.5" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M5 11h14M5 7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
          </svg>
          <!-- Car icon -->
          <svg v-else-if="transportation.type === 'car'" class="w-3.5 h-3.5" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h.01M16 17h.01M3 11l2-6h14l2 6M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6H5z" />
          </svg>
          <!-- Ferry icon -->
          <svg v-else-if="transportation.type === 'ferry'" class="w-3.5 h-3.5" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v6m0 0l-3-2m3 2l3-2M5 19h14l2-4H3l2 4zm0 0l1 2h12l1-2" />
          </svg>
          <!-- Default arrow icon -->
          <svg v-else class="w-3.5 h-3.5" :class="iconClass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </template>
        <template v-else>
          <!-- Plus icon for empty state -->
          <svg class="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </template>
      </div>
      <div class="w-6 h-px bg-current" />
    </div>

    <!-- Info compacta -->
    <span v-if="transportation" class="text-xs text-gray-500 truncate max-w-[80px]">
      {{ transportation.carrier || transportTypeLabel }}
    </span>
    <span v-else class="text-xs text-gray-400 group-hover:text-purple-500 transition-colors">
      + {{ $t('travel.transportation.addTransport') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Transportation, TransportType } from '~/types'
import { TRANSPORT_TYPES } from '~/types'

interface Props {
  transportation?: Transportation | null
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const transportTypeLabel = computed(() => {
  if (!props.transportation) return ''
  const type = TRANSPORT_TYPES.find(t => t.value === props.transportation?.type)
  return type?.label || props.transportation.type
})

const iconBgClass = computed(() => {
  if (!props.transportation) return 'bg-gray-100'
  const colorMap: Record<TransportType, string> = {
    flight: 'bg-blue-100',
    train: 'bg-green-100',
    bus: 'bg-amber-100',
    car: 'bg-purple-100',
    ferry: 'bg-cyan-100',
    other: 'bg-gray-100',
  }
  return colorMap[props.transportation.type] || 'bg-gray-100'
})

const iconClass = computed(() => {
  if (!props.transportation) return 'text-gray-500'
  const colorMap: Record<TransportType, string> = {
    flight: 'text-blue-600',
    train: 'text-green-600',
    bus: 'text-amber-600',
    car: 'text-purple-600',
    ferry: 'text-cyan-600',
    other: 'text-gray-600',
  }
  return colorMap[props.transportation.type] || 'text-gray-600'
})
</script>
