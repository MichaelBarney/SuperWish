<template>
  <div>
    <!-- Active tasks -->
    <div v-if="activeTasks.length > 0" class="divide-y divide-gray-100">
      <TaskItem
        v-for="task in activeTasks"
        :key="task.id"
        :task="task"
        :project-label="getProjectLabel(task)"
        :project-icon="getProjectIcon(task)"
        @toggle="$emit('toggle', $event, !task.completed)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

    <!-- Quick add -->
    <TaskQuickAdd
      :quest-id="questId"
      :sub-quest-id="subQuestId"
      :trip-id="tripId"
      :destination-id="destinationId"
      @add="$emit('add', $event)"
    />

    <!-- Empty state -->
    <div v-if="activeTasks.length === 0 && completedTasks.length === 0" class="py-8 text-center">
      <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
        <Icon name="lucide:square-check-big" class="w-6 h-6 text-orange-400" />
      </div>
      <p class="text-sm text-gray-500">{{ emptyMessage || $t('task.empty.title') }}</p>
    </div>

    <!-- Completed tasks toggle -->
    <div v-if="completedTasks.length > 0" class="mt-4">
      <button
        @click="showCompleted = !showCompleted"
        class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          class="w-3 h-3 transition-transform"
          :class="showCompleted ? 'rotate-90' : ''"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {{ showCompleted ? $t('task.task.hideCompleted') : $t('task.task.showCompleted') }}
        ({{ completedTasks.length }})
      </button>

      <div v-if="showCompleted" class="divide-y divide-gray-100 mt-1">
        <TaskItem
          v-for="task in completedTasks"
          :key="task.id"
          :task="task"
          :project-label="getProjectLabel(task)"
          :project-icon="getProjectIcon(task)"
          @toggle="$emit('toggle', $event, !task.completed)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task } from '~/types'

interface Props {
  tasks: Task[]
  questId?: string
  subQuestId?: string
  tripId?: string
  destinationId?: string
  emptyMessage?: string
  questNames?: Record<string, string>
  tripNames?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  questId: '',
  subQuestId: '',
  tripId: '',
  destinationId: '',
  emptyMessage: '',
})

defineEmits<{
  toggle: [id: string, completed: boolean]
  edit: [task: Task]
  delete: [id: string]
  add: [data: { title: string; questId: string; subQuestId: string; tripId: string; destinationId: string }]
}>()

const showCompleted = ref(false)

const activeTasks = computed(() => props.tasks.filter(t => !t.completed))
const completedTasks = computed(() => props.tasks.filter(t => t.completed))

function getProjectLabel(task: Task): string {
  if (task.questId && props.questNames?.[task.questId]) {
    return props.questNames[task.questId]
  }
  if (task.tripId && props.tripNames?.[task.tripId]) {
    return props.tripNames[task.tripId]
  }
  return ''
}

function getProjectIcon(task: Task): string {
  if (task.questId) return 'lucide:target'
  if (task.tripId) return 'lucide:plane'
  return 'lucide:hash'
}
</script>
