<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      badgeClasses
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full', dotClass]" />
    {{ displayLabel }}
  </span>
</template>

<script setup lang="ts">
import type { WishStatus } from '~/types'
import { getStatusConfig } from '~/types'

interface Props {
  status: WishStatus
  sinceText?: string
}

const props = defineProps<Props>()

const displayLabel = computed(() => {
  const label = statusConfig.value.label
  if (props.status === 'wanted' && props.sinceText) {
    return `${label} ${props.sinceText}`
  }
  return label
})

const statusConfig = computed(() => getStatusConfig(props.status))

const badgeClasses = computed(() => {
  switch (statusConfig.value.color) {
    case 'blue':
      return 'bg-blue-50 text-blue-700'
    case 'amber':
      return 'bg-amber-50 text-amber-700'
    case 'green':
      return 'bg-green-50 text-green-700'
    case 'purple':
      return 'bg-purple-50 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
})

const dotClass = computed(() => {
  switch (statusConfig.value.color) {
    case 'blue':
      return 'bg-blue-500'
    case 'amber':
      return 'bg-amber-500'
    case 'green':
      return 'bg-green-500'
    case 'purple':
      return 'bg-purple-500'
    default:
      return 'bg-gray-400'
  }
})
</script>
