<template>
  <TaskInlineSearchPicker
    :model-value="modelValue"
    :items="incompleteTasks"
    :search-placeholder="$t('task.blockerPicker.blockedByPlaceholder')"
    :no-results-text="$t('task.blockerPicker.noResults')"
    accent-color="red"
    search-field="title"
    :exclude-ids="excludeTaskIds"
    @update:model-value="$emit('update:modelValue', $event)"
    @select="handleSelect"
  >
    <template #item="{ item }">
      <!-- Icon -->
      <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
        <Icon name="lucide:lock" class="w-4 h-4 text-red-400" />
      </div>
      <!-- Info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 truncate">{{ item.title }}</p>
        <div v-if="item.timeHorizon" class="flex items-center gap-1 mt-0.5">
          <span
            class="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
            :class="horizonBadgeClass(item.timeHorizon)"
          >
            {{ horizonLabel(item.timeHorizon) }}
          </span>
        </div>
      </div>
    </template>
  </TaskInlineSearchPicker>
</template>

<script setup lang="ts">
import type { Task, TaskTimeHorizon } from '~/types'

interface Props {
  modelValue: boolean
  excludeTaskIds?: string[]
}

withDefaults(defineProps<Props>(), {
  excludeTaskIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [task: Task]
}>()

const { t } = useI18n()
const { tasks } = useTasks()

const incompleteTasks = computed(() => tasks.value.filter(task => !task.completed))

function horizonBadgeClass(horizon: TaskTimeHorizon): string {
  switch (horizon) {
    case 'today': return 'bg-amber-50 text-amber-700'
    case 'this_week': return 'bg-blue-50 text-blue-700'
    case 'this_month': return 'bg-purple-50 text-purple-700'
    case 'long_term': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function horizonLabel(horizon: TaskTimeHorizon): string {
  switch (horizon) {
    case 'today': return t('task.timeHorizon.today')
    case 'this_week': return t('task.timeHorizon.thisWeek')
    case 'this_month': return t('task.timeHorizon.thisMonth')
    case 'long_term': return t('task.timeHorizon.longTerm')
    default: return ''
  }
}

function handleSelect(item: any) {
  emit('select', item as Task)
}
</script>
