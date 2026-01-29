<template>
  <NuxtLink
    v-if="to"
    :to="to"
    class="flex items-center rounded-lg transition-all duration-200 group"
    :class="[
      isActive
        ? activeClass
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
    ]"
    :title="label"
  >
    <slot name="icon">
      <span class="w-5 h-5 flex items-center justify-center shrink-0">
        <component :is="icon" v-if="icon" class="w-5 h-5" />
      </span>
    </slot>
    <span
      v-if="!collapsed"
      class="text-sm font-medium truncate"
    >
      {{ label }}
    </span>
    <span
      v-if="badge && !collapsed"
      class="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
      :class="badgeClass"
    >
      {{ badge }}
    </span>
  </NuxtLink>
  <button
    v-else
    @click="$emit('click')"
    class="w-full flex items-center rounded-lg transition-all duration-200 group"
    :class="[
      isActive
        ? activeClass
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
    ]"
    :title="label"
  >
    <slot name="icon">
      <span class="w-5 h-5 flex items-center justify-center shrink-0">
        <component :is="icon" v-if="icon" class="w-5 h-5" />
      </span>
    </slot>
    <span
      v-if="!collapsed"
      class="text-sm font-medium truncate"
    >
      {{ label }}
    </span>
    <span
      v-if="badge && !collapsed"
      class="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
      :class="badgeClass"
    >
      {{ badge }}
    </span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  to?: string
  label: string
  icon?: Component
  isActive?: boolean
  collapsed?: boolean
  badge?: string | number
  variant?: 'teal' | 'purple'
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  collapsed: true,
  variant: 'teal',
})

defineEmits<{
  click: []
}>()

const activeClass = computed(() => {
  if (props.variant === 'purple') {
    return 'bg-purple-50 text-purple-700 font-semibold'
  }
  return 'bg-accent-50 text-accent-700 font-semibold'
})

const badgeClass = computed(() => {
  if (props.variant === 'purple') {
    return 'bg-purple-100 text-purple-700'
  }
  return 'bg-accent-100 text-accent-700'
})
</script>
