<template>
  <div class="relative inline-flex items-center justify-center">
    <svg :width="size" :height="size" class="transform -rotate-90">
      <!-- Background circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="#e5e7eb"
        :stroke-width="strokeWidth"
      />
      <!-- Progress circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="#22c55e"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        class="transition-all duration-700 ease-out"
      />
    </svg>
    <!-- Center text -->
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-sm font-semibold text-gray-700">{{ completed }}/{{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  completed: number
  total: number
  size?: number
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 80,
  strokeWidth: 6,
})

const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - props.strokeWidth) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const progress = computed(() => props.total > 0 ? props.completed / props.total : 0)
const dashOffset = computed(() => circumference.value * (1 - progress.value))
</script>
