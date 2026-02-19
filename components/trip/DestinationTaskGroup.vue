<template>
  <div class="bg-white rounded-xl shadow-soft transition-all duration-300 hover:shadow-soft-lg">
    <!-- Header (clickable to toggle) -->
    <div
      class="group flex items-center gap-4 px-4 py-3 cursor-pointer select-none"
      @click="expanded = !expanded"
    >
      <!-- Chevron -->
      <svg
        class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
        :class="expanded ? 'rotate-90' : ''"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>

      <!-- Country Flag -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-purple-100"
      >
        <span v-if="countryFlag" class="text-lg">{{ countryFlag }}</span>
        <Icon v-else name="lucide:map-pin" class="w-5 h-5 text-purple-600" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-gray-900 truncate">
            {{ destination.name }}
          </h3>
          <span
            v-if="pendingTaskCount > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-orange-100 text-orange-700"
          >
            {{ $t('task.task.taskCount', { count: pendingTaskCount }, pendingTaskCount) }}
          </span>
        </div>
        <p v-if="destination.country" class="text-xs text-gray-500 truncate mt-0.5">
          {{ destination.country }}
        </p>
      </div>
    </div>

    <!-- Expanded Tasks Section -->
    <div v-if="expanded" class="border-t border-gray-100 px-4 pb-3">
      <TaskList
        :tasks="tasks"
        :all-tasks="allTasks"
        :trip-id="tripId"
        :destination-id="destination.id"
        @toggle="(id, completed) => $emit('toggleTask', id, completed)"
        @edit="(task) => $emit('editTask', task)"
        @delete="(id) => $emit('deleteTask', id)"
        @add="(data) => $emit('addTask', data)"
        @inline-update="(id, data) => $emit('inlineUpdateTask', id, data)"
        @update-time-horizon="(id, th) => $emit('updateTimeHorizonTask', id, th)"
        @update-estimated-time="(id, et) => $emit('updateEstimatedTimeTask', id, et)"
        @update-blocked-by="(id, ids) => $emit('updateBlockedByTask', id, ids)"
        @update-due-date="(id, d) => $emit('updateDueDateTask', id, d)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Destination, Task } from '~/types'

interface Props {
  destination: Destination
  tasks?: Task[]
  allTasks?: Task[]
  tripId: string
}

const props = withDefaults(defineProps<Props>(), {
  tasks: () => [],
  allTasks: () => [],
})

defineEmits<{
  toggleTask: [id: string, completed: boolean]
  editTask: [task: Task]
  deleteTask: [id: string]
  addTask: [data: { title: string; description: string; dueDate: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[] }]
  inlineUpdateTask: [id: string, data: { title: string; description: string; dueDate?: string }]
  updateTimeHorizonTask: [id: string, timeHorizon: string | null]
  updateEstimatedTimeTask: [id: string, estimatedTime: string | null]
  updateBlockedByTask: [id: string, blockedByTaskIds: string[]]
  updateDueDateTask: [id: string, dueDate: Date | null]
}>()

const expanded = ref(false)

const pendingTaskCount = computed(() =>
  props.tasks.filter(t => !t.completed).length
)

const countryFlag = computed(() => {
  if (!props.destination.countryCode) return ''
  const codePoints = props.destination.countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
})
</script>
