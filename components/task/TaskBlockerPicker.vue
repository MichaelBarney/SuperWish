<template>
  <div v-if="modelValue" class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
    <!-- Search -->
    <div class="p-2 border-b border-gray-100">
      <input
        ref="searchRef"
        v-model="searchQuery"
        type="text"
        :placeholder="$t('task.blockerPicker.searchPlaceholder')"
        class="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        @keydown.escape="$emit('update:modelValue', false)"
      />
    </div>

    <!-- Results -->
    <div class="max-h-64 overflow-y-auto">
      <div v-if="filteredTasks.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
        {{ $t('task.blockerPicker.noResults') }}
      </div>
      <button
        v-for="task in filteredTasks"
        :key="task.id"
        @click="selectTask(task)"
        class="w-full flex items-center gap-3 px-3 py-2 hover:bg-orange-50 transition-colors text-left"
      >
        <!-- Icon -->
        <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <Icon name="lucide:square-check-big" class="w-4 h-4 text-orange-400" />
        </div>
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ task.title }}</p>
          <div v-if="task.timeHorizon" class="flex items-center gap-1 mt-0.5">
            <span
              class="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              :class="horizonBadgeClass(task.timeHorizon)"
            >
              {{ horizonLabel(task.timeHorizon) }}
            </span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskTimeHorizon } from '~/types'

interface Props {
  modelValue: boolean
  excludeTaskIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  excludeTaskIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [task: Task]
}>()

const { t } = useI18n()
const { tasks } = useTasks()

const searchQuery = ref('')
const searchRef = ref<HTMLInputElement | null>(null)

const filteredTasks = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return tasks.value.filter(task => {
    if (props.excludeTaskIds.includes(task.id)) return false
    if (task.completed) return false
    if (!q) return true
    return task.title.toLowerCase().includes(q)
  })
})

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

function selectTask(task: Task) {
  emit('select', task)
  emit('update:modelValue', false)
  searchQuery.value = ''
}

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => searchRef.value?.focus())
  }
})
</script>
