<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      sizeClasses,
      variantClasses,
    ]"
  >
    <Icon v-if="loading" name="svg-spinners:ring-resize" class="-ml-1 h-4 w-4" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
})

// Get app context for theme-aware styling
const { isSuperTrip, isSuperQuest, isSuperTask, isSuperXP } = useAppContext()

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'px-3 py-1.5 text-sm'
    case 'lg': return 'px-6 py-3 text-base'
    default: return 'px-4 py-2 text-sm'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'
    case 'ghost':
      return 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-300'
    case 'danger':
      return 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-300'
    default:
      // Use purple for SuperTrip, green for SuperQuest, teal for SuperWish
      if (isSuperTrip.value) {
        return 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-300 shadow-sm hover:shadow-md'
      }
      if (isSuperQuest.value) {
        return 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300 shadow-sm hover:shadow-md'
      }
      if (isSuperTask.value) {
        return 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-300 shadow-sm hover:shadow-md'
      }
      if (isSuperXP.value) {
        return 'bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-300 shadow-sm hover:shadow-md'
      }
      return 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-300 shadow-sm hover:shadow-md'
  }
})
</script>
