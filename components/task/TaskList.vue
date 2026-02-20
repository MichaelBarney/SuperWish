<template>
  <div>
    <!-- Active tasks -->
    <div v-if="activeTasks.length > 0" class="divide-y divide-gray-100">
      <template v-for="task in activeTasks" :key="task.id">
        <TaskQuickAdd
          v-if="editingTaskId === task.id"
          :edit-task="task"
          @update="(id, data) => { $emit('inlineUpdate', id, data); cancelEdit() }"
          @cancel-edit="cancelEdit"
        />
        <TaskItem
          v-else
          :task="task"
          :all-tasks="props.allTasks || []"
          :project-label="getProjectLabel(task)"
          :project-icon="getProjectIcon(task)"
          :linked-wish="task.wishId ? getWishById(task.wishId) || null : null"
          @toggle="handleToggle"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @start-edit="startEdit"
          @update-time-horizon="(id, th) => $emit('updateTimeHorizon', id, th)"
          @update-estimated-time="(id, et) => $emit('updateEstimatedTime', id, et)"
          @update-blocked-by="(id, ids) => $emit('updateBlockedBy', id, ids)"
          @update-due-date="(id, d) => $emit('updateDueDate', id, d)"
          @update-recurrence="(id, r) => $emit('updateRecurrence', id, r)"
        />
      </template>
    </div>

    <!-- Quick add -->
    <TaskQuickAdd
      :quest-id="questId"
      :sub-quest-id="subQuestId"
      :trip-id="tripId"
      :destination-id="destinationId"
      :experience-id="experienceId"
      @add="$emit('add', $event)"
    />

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
        <template v-for="task in completedTasks" :key="task.id">
          <TaskQuickAdd
            v-if="editingTaskId === task.id"
            :edit-task="task"
            @update="(id, data) => { $emit('inlineUpdate', id, data); cancelEdit() }"
            @cancel-edit="cancelEdit"
          />
          <TaskItem
            v-else
            :task="task"
            :all-tasks="props.allTasks || []"
            :project-label="getProjectLabel(task)"
            :project-icon="getProjectIcon(task)"
            :linked-wish="task.wishId ? getWishById(task.wishId) || null : null"
            @toggle="handleToggle"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @start-edit="startEdit"
            @update-time-horizon="(id, th) => $emit('updateTimeHorizon', id, th)"
            @update-estimated-time="(id, et) => $emit('updateEstimatedTime', id, et)"
            @update-blocked-by="(id, ids) => $emit('updateBlockedBy', id, ids)"
            @update-due-date="(id, d) => $emit('updateDueDate', id, d)"
            @update-recurrence="(id, r) => $emit('updateRecurrence', id, r)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskTimeHorizon, TaskEstimatedTime, TaskRecurrence } from '~/types'
import { isOwnedStatus } from '~/types'

interface Props {
  tasks: Task[]
  allTasks?: Task[]
  questId?: string
  subQuestId?: string
  tripId?: string
  destinationId?: string
  experienceId?: string
  questNames?: Record<string, string>
  questIcons?: Record<string, string>
  tripNames?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  questId: '',
  subQuestId: '',
  tripId: '',
  destinationId: '',
  experienceId: '',
})

const emit = defineEmits<{
  toggle: [id: string, completed: boolean]
  edit: [task: Task]
  delete: [id: string]
  add: [data: { title: string; description: string; dueDate: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[]; recurrence: string }]
  inlineUpdate: [id: string, data: Record<string, any>]
  updateTimeHorizon: [id: string, timeHorizon: TaskTimeHorizon | null]
  updateEstimatedTime: [id: string, estimatedTime: TaskEstimatedTime | null]
  updateBlockedBy: [id: string, blockedByTaskIds: string[]]
  updateDueDate: [id: string, dueDate: Date | null]
  updateRecurrence: [id: string, recurrence: TaskRecurrence | null]
}>()

const { getWishById } = useAllWishes()

const showCompleted = ref(false)
const editingTaskId = ref<string | null>(null)

function startEdit(id: string) {
  editingTaskId.value = id
}

function cancelEdit() {
  editingTaskId.value = null
}

function isTaskCompleted(task: Task): boolean {
  if (task.wishId) {
    const wish = getWishById(task.wishId)
    return wish ? isOwnedStatus(wish.status) : false
  }
  return task.completed
}

const HORIZON_PRIORITY: Record<string, number> = {
  today: 0,
  this_week: 1,
  this_month: 2,
  long_term: 3,
}

function timeHorizonPriority(horizon: TaskTimeHorizon | null | undefined): number {
  if (!horizon) return 4
  return HORIZON_PRIORITY[horizon] ?? 4
}

const activeTasks = computed(() =>
  props.tasks
    .filter(t => !isTaskCompleted(t))
    .sort((a, b) => timeHorizonPriority(a.timeHorizon) - timeHorizonPriority(b.timeHorizon))
)

const completedTasks = computed(() =>
  props.tasks
    .filter(t => isTaskCompleted(t))
    .sort((a, b) => timeHorizonPriority(a.timeHorizon) - timeHorizonPriority(b.timeHorizon))
)

function handleToggle(id: string, completed: boolean) {
  emit('toggle', id, completed)
}

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
  if (task.questId) {
    return (props.questIcons?.[task.questId]) || 'lucide:target'
  }
  if (task.tripId) return 'lucide:plane'
  return 'lucide:hash'
}
</script>
