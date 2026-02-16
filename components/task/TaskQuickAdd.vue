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
  add: [data: { title: string; description: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string }]
  update: [id: string, data: { title: string; description: string }]
  cancelEdit: []
}>()

const expanded = ref(false)
const title = ref('')
const description = ref('')
const wishId = ref('')
const showWishPicker = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// When editTask is provided, pre-fill fields
watch(() => props.editTask, (task) => {
  if (task) {
    title.value = task.title
    description.value = task.description || ''
    wishId.value = task.wishId || ''
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
  showWishPicker.value = false
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
})

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
  })
  title.value = ''
  description.value = ''
  wishId.value = ''
  nextTick(() => inputRef.value?.focus())
}
</script>
