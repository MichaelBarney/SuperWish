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
            <div
              ref="inputRef"
              contenteditable="true"
              role="textbox"
              :aria-placeholder="$t('task.form.titlePlaceholder')"
              aria-multiline="false"
              :data-placeholder="$t('task.form.titlePlaceholder')"
              class="task-quick-add-input flex-1 text-sm text-gray-900 bg-transparent border-none outline-none font-medium whitespace-nowrap overflow-hidden"
              @input="onInput"
              @keydown.enter.prevent="submit"
              @keydown.escape="collapse"
              @paste.prevent="onPaste"
              @compositionstart="_composing = true"
              @compositionend="onCompositionEnd"
            ></div>
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
        <!-- Due date pill -->
        <div v-if="dueDate" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="dueDateOverdue ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'"
          >
            <Icon name="lucide:calendar" class="w-3 h-3" />
            <span>{{ formattedDueDate }}</span>
            <button @click="clearDueDate" class="ml-0.5 hover:text-red-900">
              <Icon name="lucide:x" class="w-3 h-3" />
            </button>
          </span>
        </div>
        <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <!-- Calendar button -->
          <button
            @click="showDatePicker = !showDatePicker"
            class="p-1.5 rounded-lg transition-colors"
            :class="dueDate ? 'text-orange-500 hover:bg-orange-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'"
          >
            <Icon name="lucide:calendar" class="w-4 h-4" />
          </button>
          <div class="flex-1" />
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
      <!-- Date Picker -->
      <TaskDatePicker
        v-model="showDatePicker"
        :current-date="dueDate"
        @select="handleDateSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, Wish } from '~/types'
import { watchDebounced } from '@vueuse/core'
import { parseDateFromText, stripDateTextFromTitle, formatDueDate, isDueDateOverdue } from '~/utils/taskDueDate'
import type { NlpDateMatch } from '~/utils/taskDueDate'

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
  add: [data: { title: string; description: string; dueDate: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[] }]
  update: [id: string, data: { title: string; description: string; dueDate: string }]
  cancelEdit: []
}>()

const { t, locale } = useI18n()

const expanded = ref(false)
const title = ref('')
const description = ref('')
const wishId = ref('')
const blockedByTaskIds = ref<string[]>([])
const dueDate = ref<Date | null>(null)
const nlpMatch = ref<NlpDateMatch | null>(null)
const showWishPicker = ref(false)
const showBlockerPicker = ref(false)
const showDatePicker = ref(false)
const inputRef = ref<HTMLDivElement | null>(null)

let _suppressRender = false
let _composing = false

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return el.textContent?.length ?? 0
  const range = sel.getRangeAt(0)
  const preRange = document.createRange()
  preRange.selectNodeContents(el)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().length
}

function setCaretOffset(el: HTMLElement, offset: number) {
  const sel = window.getSelection()
  if (!sel) return
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remaining = offset
  let node: Text | null = null
  while (walker.nextNode()) {
    node = walker.currentNode as Text
    if (remaining <= node.length) {
      const range = document.createRange()
      range.setStart(node, remaining)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
      return
    }
    remaining -= node.length
  }
  // If offset exceeds text length, place at end
  if (node) {
    const range = document.createRange()
    range.setStart(node, node.length)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

function focusAtEnd() {
  const el = inputRef.value
  if (!el) return
  el.focus()
  const len = el.textContent?.length ?? 0
  setCaretOffset(el, len)
}

function renderHighlight() {
  const el = inputRef.value
  if (!el || _composing) return
  const text = title.value
  const match = nlpMatch.value

  const caretPos = document.activeElement === el ? getCaretOffset(el) : -1

  if (match && match.index >= 0 && match.end <= text.length
      && text.slice(match.index, match.end) === match.matchedText) {
    const before = escapeHtml(text.slice(0, match.index))
    const highlighted = escapeHtml(text.slice(match.index, match.end))
    const after = escapeHtml(text.slice(match.end))
    el.innerHTML = `${before}<span class="bg-orange-100 text-orange-700 rounded px-0.5">${highlighted}</span>${after}`
  } else {
    el.textContent = text
  }

  if (caretPos >= 0) {
    setCaretOffset(el, caretPos)
  }
}

function onInput() {
  const el = inputRef.value
  if (!el) return
  _suppressRender = true
  title.value = el.textContent || ''
  _suppressRender = false
}

function onPaste(e: ClipboardEvent) {
  const text = (e.clipboardData?.getData('text/plain') || '').replace(/[\r\n]+/g, ' ')
  document.execCommand('insertText', false, text)
}

function onCompositionEnd() {
  _composing = false
  onInput()
}

const { tasks: allTasks } = useTasks()

const formattedDueDate = computed(() => {
  if (!dueDate.value) return ''
  return formatDueDate(dueDate.value, locale.value, t)
})

const dueDateOverdue = computed(() => {
  if (!dueDate.value) return false
  return isDueDateOverdue(dueDate.value)
})

// When editTask is provided, pre-fill fields
watch(() => props.editTask, (task) => {
  if (task) {
    title.value = task.title
    description.value = task.description || ''
    wishId.value = task.wishId || ''
    blockedByTaskIds.value = task.blockedByTaskIds ? [...task.blockedByTaskIds] : []
    dueDate.value = task.dueDate || null
    nextTick(() => {
      renderHighlight()
      focusAtEnd()
    })
  }
}, { immediate: true })

function expand() {
  expanded.value = true
  nextTick(() => focusAtEnd())
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
  dueDate.value = null
  nlpMatch.value = null
  showWishPicker.value = false
  showBlockerPicker.value = false
  showDatePicker.value = false
}

function handleWishSelect(wish: Wish) {
  title.value = wish.title
  wishId.value = wish.id
  showWishPicker.value = false
}

// Detect /wish and /block and /date commands, and sync contenteditable on code-driven changes
watch(title, (val) => {
  if (val === '/wish') {
    title.value = ''
    showWishPicker.value = true
  }
  if (val === '/block') {
    title.value = ''
    showBlockerPicker.value = true
  }
  if (val === '/date') {
    title.value = ''
    showDatePicker.value = true
  }

  // When title is set from code (wish select, slash commands, collapse/reset),
  // sync the contenteditable div
  if (!_suppressRender) {
    nextTick(() => renderHighlight())
  }
})

// NLP date detection (debounced)
watchDebounced(title, (val) => {
  // Don't NLP parse if a date was manually set (via picker, not NLP)
  if (dueDate.value && !nlpMatch.value) return

  const result = parseDateFromText(val, locale.value)
  if (result) {
    nlpMatch.value = result
    dueDate.value = result.date
  } else {
    // Clear dueDate only if it was previously set by NLP
    if (nlpMatch.value) {
      dueDate.value = null
    }
    nlpMatch.value = null
  }
}, { debounce: 150 })

// Re-render highlight when NLP match changes
watch(nlpMatch, () => {
  nextTick(() => renderHighlight())
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

function handleDateSelect(date: Date | null) {
  dueDate.value = date
  nlpMatch.value = null // Clear NLP match since user picked manually
  showDatePicker.value = false
}

function clearDueDate() {
  dueDate.value = null
  nlpMatch.value = null
}

function submit() {
  if (!title.value.trim()) return
  if (props.editTask) {
    let editTitle = title.value.trim()
    if (nlpMatch.value) {
      editTitle = stripDateTextFromTitle(title.value, nlpMatch.value.matchedText, nlpMatch.value.index).trim()
      if (!editTitle) editTitle = title.value.trim()
    }
    emit('update', props.editTask.id, {
      title: editTitle,
      description: description.value.trim(),
      dueDate: dueDate.value ? dueDate.value.toISOString() : '',
    })
    return
  }

  // Strip NLP-detected date text from title
  let finalTitle = title.value.trim()
  if (nlpMatch.value) {
    finalTitle = stripDateTextFromTitle(title.value, nlpMatch.value.matchedText, nlpMatch.value.index).trim()
    if (!finalTitle) finalTitle = title.value.trim() // Fallback if stripping removes everything
  }

  emit('add', {
    title: finalTitle,
    description: description.value.trim(),
    dueDate: dueDate.value ? dueDate.value.toISOString() : '',
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
  dueDate.value = null
  nlpMatch.value = null
  nextTick(() => focusAtEnd())
}
</script>

<style scoped>
.task-quick-add-input:empty::before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}
.task-quick-add-input br { display: none; }
.task-quick-add-input * { display: inline; }
</style>
