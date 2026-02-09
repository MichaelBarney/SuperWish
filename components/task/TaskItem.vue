<template>
  <div
    class="group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50"
  >
    <!-- Checkbox -->
    <button
      @click="$emit('toggle', task.id, !task.completed)"
      class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
      :class="task.completed
        ? 'bg-orange-500 border-orange-500'
        : 'border-gray-300 hover:border-orange-400'"
    >
      <svg
        v-if="task.completed"
        class="w-3 h-3 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Content -->
    <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('edit', task)">
      <p
        class="text-sm font-medium transition-all"
        :class="task.completed ? 'text-gray-400 line-through' : 'text-gray-900'"
      >
        {{ task.title }}
      </p>
      <p
        v-if="task.description"
        class="text-xs text-gray-400 mt-0.5 truncate"
      >
        {{ task.description }}
      </p>
      <!-- Project badge -->
      <div v-if="projectLabel" class="flex items-center gap-1 mt-1">
        <Icon :name="projectIcon" class="w-3 h-3 text-gray-400" />
        <span class="text-xs text-gray-400">{{ projectLabel }}</span>
      </div>
    </div>

    <!-- Delete button (on hover) -->
    <button
      @click.stop="$emit('delete', task.id)"
      class="mt-0.5 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types'

interface Props {
  task: Task
  projectLabel?: string
  projectIcon?: string
}

withDefaults(defineProps<Props>(), {
  projectLabel: '',
  projectIcon: 'lucide:hash',
})

defineEmits<{
  toggle: [id: string, completed: boolean]
  edit: [task: Task]
  delete: [id: string]
}>()
</script>
