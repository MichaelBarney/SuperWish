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
    <svg 
      v-if="loading" 
      class="animate-spin -ml-1 h-4 w-4" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
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
const { isSuperTravel } = useAppContext()

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
      // Use purple for SuperTravel, teal for SuperWish
      return isSuperTravel.value
        ? 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-300 shadow-sm hover:shadow-md'
        : 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-300 shadow-sm hover:shadow-md'
  }
})
</script>
