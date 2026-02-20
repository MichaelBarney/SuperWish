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

      <!-- Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="iconBgClass"
      >
        <Icon :name="subquest.icon || 'lucide:target'" class="w-5 h-5" :class="iconTextClass" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-gray-900 truncate">
            {{ subquest.name }}
          </h3>
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
            :class="statusBadgeClass"
          >
            {{ $t(`quest.quests.status.${subquest.status}`) }}
          </span>
          <span
            v-if="pendingTaskCount > 0"
            class="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-orange-100 text-orange-700"
          >
            {{ $t('task.task.taskCount', { count: pendingTaskCount }, pendingTaskCount) }}
          </span>
        </div>
        <p v-if="subquest.goal" class="text-xs text-gray-500 truncate mt-0.5">
          {{ subquest.goal }}
        </p>
      </div>

      <!-- Date range -->
      <p v-if="dateRange" class="text-xs text-gray-400 shrink-0 hidden sm:block">
        {{ dateRange }}
      </p>

      <!-- Edit button -->
      <button
        class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        @click.stop="$emit('edit', subquest)"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>

    <!-- Expanded Tasks Section -->
    <div v-if="expanded" class="border-t border-gray-100 px-4 pb-3">
      <TaskList
        :tasks="tasks"
        :all-tasks="allTasks"
        :quest-id="questId"
        :trip-id="tripId"
        :sub-quest-id="subquest.id"
        @toggle="(id, completed) => $emit('toggleTask', id, completed)"
        @edit="(task) => $emit('editTask', task)"
        @delete="(id) => $emit('deleteTask', id)"
        @add="(data) => $emit('addTask', data)"
        @inline-update="(id, data) => $emit('inlineUpdateTask', id, data)"
        @update-time-horizon="(id, th) => $emit('updateTimeHorizonTask', id, th)"
        @update-estimated-time="(id, et) => $emit('updateEstimatedTimeTask', id, et)"
        @update-blocked-by="(id, ids) => $emit('updateBlockedByTask', id, ids)"
        @update-due-date="(id, d) => $emit('updateDueDateTask', id, d)"
        @update-recurrence="(id, r) => $emit('updateRecurrenceTask', id, r)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SubQuest, Task } from '~/types'

interface Props {
  subquest: SubQuest
  tasks?: Task[]
  allTasks?: Task[]
  questId?: string
  tripId?: string
}

const props = withDefaults(defineProps<Props>(), {
  tasks: () => [],
  allTasks: () => [],
  questId: '',
  tripId: '',
})

defineEmits<{
  edit: [subquest: SubQuest]
  toggleTask: [id: string, completed: boolean]
  editTask: [task: Task]
  deleteTask: [id: string]
  addTask: [data: { title: string; description: string; dueDate: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[]; recurrence: string }]
  inlineUpdateTask: [id: string, data: { title: string; description: string; dueDate?: string }]
  updateTimeHorizonTask: [id: string, timeHorizon: string | null]
  updateEstimatedTimeTask: [id: string, estimatedTime: string | null]
  updateBlockedByTask: [id: string, blockedByTaskIds: string[]]
  updateDueDateTask: [id: string, dueDate: Date | null]
  updateRecurrenceTask: [id: string, recurrence: import('~/types').TaskRecurrence | null]
}>()

const { locale, t } = useI18n()

const expanded = ref(false)

const pendingTaskCount = computed(() =>
  props.tasks.filter(t => !t.completed).length
)

const statusBadgeClass = computed(() => {
  switch (props.subquest.status) {
    case 'planning':
      return 'bg-gray-100 text-gray-700'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'on_hold':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

const iconBgClass = computed(() => {
  switch (props.subquest.status) {
    case 'completed':
      return 'bg-emerald-100'
    case 'in_progress':
      return 'bg-green-100'
    case 'on_hold':
      return 'bg-amber-100'
    default:
      return 'bg-green-100'
  }
})

const iconTextClass = computed(() => {
  switch (props.subquest.status) {
    case 'completed':
      return 'text-emerald-600'
    case 'in_progress':
      return 'text-green-600'
    case 'on_hold':
      return 'text-amber-600'
    default:
      return 'text-green-600'
  }
})

const dateRange = computed(() => {
  const { startDate, endDate } = props.subquest
  if (!startDate && !endDate) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }

  if (startDate && endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)

    if (start.getFullYear() === end.getFullYear()) {
      return `${localeDateString(start, dateLocale, formatOptions)} - ${localeDateString(end, dateLocale, { ...formatOptions, year: 'numeric' })}`
    }

    return `${localeDateString(start, dateLocale, { ...formatOptions, year: 'numeric' })} - ${localeDateString(end, dateLocale, { ...formatOptions, year: 'numeric' })}`
  }

  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    return t('quest.quests.dateStarts', { date: localeDateString(start, dateLocale, { ...formatOptions, year: 'numeric' }) })
  }

  if (endDate) {
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    return t('quest.quests.dateDue', { date: localeDateString(end, dateLocale, { ...formatOptions, year: 'numeric' }) })
  }

  return null
})
</script>
