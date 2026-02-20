<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-soft animate-pulse"
      >
        <div class="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-1/3" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="subquests.length === 0"
      class="text-center py-16 bg-gray-50 rounded-2xl"
    >
      <UiButton variant="primary" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('quest.subquests.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Sub-Quest List -->
    <div v-else class="space-y-2">
      <QuestSubQuestCard
        v-for="subquest in subquests"
        :key="subquest.id"
        :subquest="subquest"
        :tasks="getTasksBySubQuestId ? getTasksBySubQuestId(subquest.id) : []"
        :all-tasks="allTasks"
        :quest-id="questId"
        :trip-id="tripId"
        @edit="$emit('edit', subquest)"
        @toggle-task="(id, completed) => $emit('toggleTask', id, completed)"
        @edit-task="(task) => $emit('editTask', task)"
        @delete-task="(id) => $emit('deleteTask', id)"
        @add-task="(data) => $emit('addTask', data)"
        @inline-update-task="(id, data) => $emit('inlineUpdateTask', id, data)"
        @update-time-horizon-task="(id, th) => $emit('updateTimeHorizonTask', id, th)"
        @update-estimated-time-task="(id, et) => $emit('updateEstimatedTimeTask', id, et)"
        @update-blocked-by-task="(id, ids) => $emit('updateBlockedByTask', id, ids)"
        @update-due-date-task="(id, d) => $emit('updateDueDateTask', id, d)"
        @update-recurrence-task="(id, r) => $emit('updateRecurrenceTask', id, r)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SubQuest, Task } from '~/types'

interface Props {
  subquests: readonly SubQuest[]
  allTasks?: Task[]
  loading?: boolean
  getTasksBySubQuestId?: (subQuestId: string) => Task[]
  questId?: string
  tripId?: string
}

withDefaults(defineProps<Props>(), {
  allTasks: () => [],
  loading: false,
  questId: '',
  tripId: '',
})

defineEmits<{
  create: []
  edit: [subquest: SubQuest]
  toggleTask: [id: string, completed: boolean]
  editTask: [task: Task]
  deleteTask: [id: string]
  addTask: [data: { title: string; description: string; dueDate: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[]; recurrence: string }]
  inlineUpdateTask: [id: string, data: Record<string, any>]
  updateTimeHorizonTask: [id: string, timeHorizon: string | null]
  updateEstimatedTimeTask: [id: string, estimatedTime: string | null]
  updateBlockedByTask: [id: string, blockedByTaskIds: string[]]
  updateDueDateTask: [id: string, dueDate: Date | null]
  updateRecurrenceTask: [id: string, recurrence: import('~/types').TaskRecurrence | null]
}>()
</script>
