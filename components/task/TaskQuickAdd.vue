<template>
  <div>
    <!-- Collapsed state (hidden in edit mode) -->
    <button
      v-if="!expanded && !editTask"
      @click="expand"
      class="group w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
    >
      <span class="flex items-center justify-center w-5 h-5 rounded-full text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </span>
      <span class="text-gray-400 group-hover:text-orange-500 transition-colors">{{ $t('task.task.addTask') }}</span>
    </button>

    <!-- Expanded state -->
    <div v-if="expanded || editTask" class="relative px-3 pb-3 pt-3">
      <div class="border border-gray-300 rounded-xl shadow-sm">
        <div class="px-3 pt-3 pb-2 space-y-2">
          <div class="flex items-center gap-2">
            <!-- Wish indicator -->
            <Icon
              v-if="wishId"
              name="lucide:star"
              class="w-4 h-4 text-teal-500 shrink-0"
            />
            <input
              ref="inputRef"
              v-model="title"
              type="text"
              :placeholder="$t('task.form.titlePlaceholder')"
              class="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none font-medium"
              @keydown.enter.prevent="submit"
              @keydown.escape="collapse"
            />
          </div>
          <textarea
            v-model="description"
            rows="2"
            :placeholder="$t('task.form.descriptionPlaceholder')"
            class="w-full text-sm text-gray-700 placeholder-gray-400 bg-transparent border-none outline-none resize-none"
            @keydown.escape="collapse"
          />
        </div>
        <!-- Blocker pills -->
        <div v-if="blockedByTaskIds.length > 0" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span
            v-for="bid in blockedByTaskIds"
            :key="bid"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700"
          >
            <Icon name="lucide:lock" class="w-3 h-3" />
            <span class="truncate max-w-[120px]">{{ getBlockerTitle(bid) }}</span>
            <button @click="removeBlocker(bid)" class="ml-0.5 hover:text-red-900">
              <Icon name="lucide:x" class="w-3 h-3" />
            </button>
          </span>
        </div>
        <div class="flex items-center justify-end gap-2 px-3 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <button
            @click="collapse"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="submit"
            :disabled="!title.trim()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ editTask ? $t('common.save') : $t('task.task.addTask') }}
          </button>
        </div>
      </div>
      <!-- Wish Picker (outside overflow container) -->
      <TaskWishPicker
        v-model="showWishPicker"
        @select="handleWishSelect"
      />
      <!-- Blocker Picker -->
      <TaskBlockerPicker
        v-model="showBlockerPicker"
        :exclude-task-ids="blockedByTaskIds"
        @select="handleBlockerSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, Wish } from '~/types'

interface Props {
  questId?: string
  subQuestId?: string
  tripId?: string
  destinationId?: string
  experienceId?: string
  editTask?: Task | null
}

const props = withDefaults(defineProps<Props>(), {
  questId: '',
  subQuestId: '',
  tripId: '',
  destinationId: '',
  experienceId: '',
  editTask: null,
})

const emit = defineEmits<{
  add: [data: { title: string; description: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[] }]
  update: [id: string, data: { title: string; description: string }]
  cancelEdit: []
}>()

const expanded = ref(false)
const title = ref('')
const description = ref('')
const wishId = ref('')
const blockedByTaskIds = ref<string[]>([])
const showWishPicker = ref(false)
const showBlockerPicker = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const { tasks: allTasks } = useTasks()

// When editTask is provided, pre-fill fields
watch(() => props.editTask, (task) => {
  if (task) {
    title.value = task.title
    description.value = task.description || ''
    wishId.value = task.wishId || ''
    blockedByTaskIds.value = task.blockedByTaskIds ? [...task.blockedByTaskIds] : []
    nextTick(() => inputRef.value?.focus())
  }
}, { immediate: true })

function expand() {
  expanded.value = true
  nextTick(() => inputRef.value?.focus())
}

function collapse() {
  if (props.editTask) {
    emit('cancelEdit')
    return
  }
  expanded.value = false
  title.value = ''
  description.value = ''
  wishId.value = ''
  blockedByTaskIds.value = []
  showWishPicker.value = false
  showBlockerPicker.value = false
}

function handleWishSelect(wish: Wish) {
  title.value = wish.title
  wishId.value = wish.id
  showWishPicker.value = false
}

// Detect /wish command
watch(title, (val) => {
  if (val === '/wish') {
    title.value = ''
    showWishPicker.value = true
  }
  if (val === '/block') {
    title.value = ''
    showBlockerPicker.value = true
  }
})

function handleBlockerSelect(task: Task) {
  if (!blockedByTaskIds.value.includes(task.id)) {
    blockedByTaskIds.value.push(task.id)
  }
  showBlockerPicker.value = false
}

function removeBlocker(id: string) {
  blockedByTaskIds.value = blockedByTaskIds.value.filter(bid => bid !== id)
}

function getBlockerTitle(id: string): string {
  const task = allTasks.value.find(t => t.id === id)
  return task?.title || id
}

function submit() {
  if (!title.value.trim()) return
  if (props.editTask) {
    emit('update', props.editTask.id, {
      title: title.value.trim(),
      description: description.value.trim(),
    })
    return
  }
  emit('add', {
    title: title.value.trim(),
    description: description.value.trim(),
    questId: props.questId,
    subQuestId: props.subQuestId,
    tripId: props.tripId,
    destinationId: props.destinationId,
    experienceId: props.experienceId,
    wishId: wishId.value,
    blockedByTaskIds: [...blockedByTaskIds.value],
  })
  title.value = ''
  description.value = ''
  wishId.value = ''
  blockedByTaskIds.value = []
  nextTick(() => inputRef.value?.focus())
}
</script>
