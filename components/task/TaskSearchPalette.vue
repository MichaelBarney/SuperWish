<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40" @click="close" />

        <!-- Panel -->
        <div class="relative max-w-lg mx-auto mt-[15vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <!-- Search input -->
          <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
            <Icon name="lucide:search" class="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              :placeholder="$t('task.search.placeholder')"
              class="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              @keydown="handleKeydown"
            />
            <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">esc</kbd>
          </div>

          <!-- Results -->
          <div ref="listRef" class="max-h-[320px] overflow-y-auto">
            <div v-if="results.length === 0 && query.trim()" class="px-4 py-8 text-center">
              <Icon name="lucide:search-x" class="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p class="text-sm text-gray-500">{{ $t('task.search.noResults') }}</p>
            </div>

            <div v-else-if="results.length > 0" class="py-1">
              <button
                v-for="(task, idx) in results"
                :key="task.id"
                :ref="el => setItemRef(el, idx)"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                :class="idx === highlightedIndex ? 'bg-orange-50' : 'hover:bg-gray-50'"
                @click="select(task)"
                @mouseenter="highlightedIndex = idx"
              >
                <!-- Checkbox state -->
                <Icon
                  :name="task.completed ? 'lucide:check-circle-2' : 'lucide:circle'"
                  class="w-4 h-4 shrink-0"
                  :class="task.completed ? 'text-green-500' : 'text-gray-300'"
                />

                <!-- Title -->
                <span
                  class="flex-1 text-sm truncate"
                  :class="task.completed ? 'text-gray-400 line-through' : 'text-gray-900'"
                >{{ task.title }}</span>

                <!-- Project badge -->
                <span
                  v-if="projectLabel(task)"
                  class="shrink-0 text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 max-w-[120px] truncate"
                >{{ projectLabel(task) }}</span>

                <!-- Time horizon pill -->
                <span
                  v-if="task.timeHorizon"
                  class="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  :class="horizonClass(task.timeHorizon)"
                >{{ horizonLabel(task.timeHorizon) }}</span>
              </button>
            </div>

            <div v-else class="px-4 py-6 text-center">
              <p class="text-sm text-gray-400">{{ $t('task.search.placeholder') }}</p>
            </div>
          </div>

          <!-- Footer hint -->
          <div class="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p class="text-[11px] text-gray-400 text-center">{{ $t('task.search.paletteHint') }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Task, TaskTimeHorizon } from '~/types'

const props = defineProps<{
  modelValue: boolean
  tasks: Task[]
  questNames: Record<string, string>
  tripNames: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  navigate: [task: Task]
}>()

const { t } = useI18n()

const query = ref('')
const highlightedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLElement | null)[]>([])

function setItemRef(el: any, idx: number) {
  itemRefs.value[idx] = el as HTMLElement | null
}

const MAX_RESULTS = 8

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return props.tasks
    .filter(task => {
      const title = task.title.toLowerCase()
      const desc = (task.description || '').toLowerCase()
      return title.includes(q) || desc.includes(q)
    })
    .slice(0, MAX_RESULTS)
})

watch(results, () => {
  highlightedIndex.value = 0
})

// Auto-focus when opened
watch(() => props.modelValue, (open) => {
  if (open) {
    query.value = ''
    highlightedIndex.value = 0
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function close() {
  emit('update:modelValue', false)
}

function select(task: Task) {
  emit('navigate', task)
  close()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (results.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value + 1) % results.value.length
      scrollToHighlighted()
    }
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (results.value.length > 0) {
      highlightedIndex.value = (highlightedIndex.value - 1 + results.value.length) % results.value.length
      scrollToHighlighted()
    }
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    const task = results.value[highlightedIndex.value]
    if (task) {
      select(task)
    }
    return
  }
}

function scrollToHighlighted() {
  nextTick(() => {
    const el = itemRefs.value[highlightedIndex.value]
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function projectLabel(task: Task): string {
  if (task.questId && props.questNames[task.questId]) return props.questNames[task.questId]
  if (task.tripId && props.tripNames[task.tripId]) return props.tripNames[task.tripId]
  return ''
}

function horizonLabel(horizon: TaskTimeHorizon): string {
  const map: Record<TaskTimeHorizon, string> = {
    today: t('task.timeHorizon.today'),
    this_week: t('task.timeHorizon.thisWeek'),
    this_month: t('task.timeHorizon.thisMonth'),
    long_term: t('task.timeHorizon.longTerm'),
  }
  return map[horizon] || ''
}

function horizonClass(horizon: TaskTimeHorizon): string {
  const map: Record<TaskTimeHorizon, string> = {
    today: 'bg-amber-100 text-amber-700',
    this_week: 'bg-blue-100 text-blue-700',
    this_month: 'bg-purple-100 text-purple-700',
    long_term: 'bg-gray-100 text-gray-600',
  }
  return map[horizon] || 'bg-gray-100 text-gray-600'
}
</script>
