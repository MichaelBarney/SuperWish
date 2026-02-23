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
          <div class="relative">
            <div class="flex items-center gap-2">
              <!-- Wish indicator -->
              <Icon
                v-if="createWishFlag"
                name="lucide:star"
                class="w-4 h-4 text-teal-500 shrink-0"
              />
              <!-- Experience indicator -->
              <Icon
                v-if="createExperienceFlag"
                name="lucide:sparkles"
                class="w-4 h-4 text-rose-500 shrink-0"
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
                @keydown="handleKeydown"
                @paste.prevent="onPaste"
                @compositionstart="_composing = true"
                @compositionend="onCompositionEnd"
              ></div>
            </div>
            <!-- Pickers anchored below title input -->
            <TaskMentionPicker
              ref="mentionPickerRef"
              v-model="showMentionPicker"
              :query="mentionQuery"
              @select="handleMentionSelect"
            />
            <TaskExperiencePicker
              v-model="showExperiencePicker"
              @select="handleExperienceSelect"
            />
            <TaskBlockerPicker
              v-model="showBlockerPicker"
              :exclude-task-ids="blockedByTaskIds"
              @select="handleBlockerSelect"
            />
            <TaskQuestPicker
              v-model="showQuestPicker"
              @select="handleQuestSelect"
            />
            <TaskDatePicker
              v-model="showDatePicker"
              :current-date="dueDate"
              @select="handleDateSelect"
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
        <!-- Wish pill -->
        <div v-if="createWishFlag" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
            <Icon name="lucide:star" class="w-3 h-3" />
            <span>{{ $t('task.mentions.createWish') }}</span>
            <button @click="createWishFlag = false" class="ml-0.5 hover:text-teal-900">
              <Icon name="lucide:x" class="w-3 h-3" />
            </button>
          </span>
        </div>
        <!-- Experience pill -->
        <div v-if="createExperienceFlag && createExperienceData" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
            <Icon name="lucide:sparkles" class="w-3 h-3" />
            <span>{{ experiencePillLabel }}</span>
            <button @click="clearExperienceCreation" class="ml-0.5 hover:text-rose-900">
              <Icon name="lucide:x" class="w-3 h-3" />
            </button>
          </span>
        </div>
        <!-- Quest pill -->
        <div v-if="effectiveQuestId" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
          >
            <Icon name="lucide:target" class="w-3 h-3" />
            <span class="truncate max-w-[160px]">{{ questPillLabel }}</span>
            <button v-if="localQuestId" @click="removeProjectLink" class="ml-0.5 hover:text-green-900">
              <Icon name="lucide:x" class="w-3 h-3" />
            </button>
          </span>
        </div>
        <!-- Trip pill -->
        <div v-if="effectiveTripId" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
          >
            <Icon name="lucide:plane" class="w-3 h-3" />
            <span class="truncate max-w-[160px]">{{ tripPillLabel }}</span>
            <button v-if="localTripId" @click="removeProjectLink" class="ml-0.5 hover:text-purple-900">
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
        <!-- Recurrence pill -->
        <div v-if="nlpRecurrenceMatch" class="flex flex-wrap gap-1.5 px-3 pb-2">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700"
          >
            <Icon name="lucide:repeat" class="w-3 h-3" />
            <span>{{ formattedRecurrence }}</span>
            <button @click="clearRecurrence" class="ml-0.5 hover:text-violet-900">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Task, ExperienceCategory } from '~/types'
import type { CreateExperienceData } from '~/composables/useResolveExperienceCreation'
import { EXPERIENCE_CATEGORIES } from '~/types'
import { watchDebounced } from '@vueuse/core'
import { parseDateFromText, stripDateTextFromTitle, formatDueDate, isDueDateOverdue } from '~/utils/taskDueDate'
import type { NlpDateMatch } from '~/utils/taskDueDate'
import { parseRecurrenceFromText, stripRecurrenceTextFromTitle, formatRecurrence, computeInitialDueDateFromRecurrence } from '~/utils/taskRecurrence'
import type { NlpRecurrenceMatch } from '~/utils/taskRecurrence'

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
  add: [data: { title: string; description: string; dueDate: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds: string[]; recurrence: string; createExperienceData?: CreateExperienceData }]
  update: [id: string, data: Record<string, any>]
  cancelEdit: []
}>()

const { t, locale } = useI18n()

const expanded = ref(false)
const title = ref('')
const description = ref('')
const createWishFlag = ref(false)
const blockedByTaskIds = ref<string[]>([])
const dueDate = ref<Date | null>(null)
const nlpMatch = ref<NlpDateMatch | null>(null)
const nlpRecurrenceMatch = ref<NlpRecurrenceMatch | null>(null)
const showBlockerPicker = ref(false)
const showDatePicker = ref(false)
const showQuestPicker = ref(false)
const showMentionPicker = ref(false)
const showExperiencePicker = ref(false)
const createExperienceFlag = ref(false)
const createExperienceData = ref<CreateExperienceData | null>(null)
const mentionQuery = ref('')
const mentionPickerRef = ref<{ moveUp: () => void; moveDown: () => void; confirmActive: () => void } | null>(null)
const localQuestId = ref('')
const localSubQuestId = ref('')
const localTripId = ref('')
const localDestinationId = ref('')
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
  const dateMatch = nlpMatch.value
  const recMatch = nlpRecurrenceMatch.value

  const caretPos = document.activeElement === el ? getCaretOffset(el) : -1

  // Collect highlight regions
  type Region = { start: number; end: number; cls: string }
  const regions: Region[] = []

  if (dateMatch && dateMatch.index >= 0 && dateMatch.end <= text.length
      && text.slice(dateMatch.index, dateMatch.end) === dateMatch.matchedText) {
    regions.push({ start: dateMatch.index, end: dateMatch.end, cls: 'bg-orange-100 text-orange-700 rounded px-0.5' })
  }
  if (recMatch && recMatch.index >= 0 && recMatch.end <= text.length
      && text.slice(recMatch.index, recMatch.end) === recMatch.matchedText) {
    regions.push({ start: recMatch.index, end: recMatch.end, cls: 'bg-violet-100 text-violet-700 rounded px-0.5' })
  }

  if (regions.length > 0) {
    // Sort by start index
    regions.sort((a, b) => a.start - b.start)
    // Remove overlaps: keep the first one if they overlap
    const filtered: Region[] = [regions[0]]
    for (let i = 1; i < regions.length; i++) {
      if (regions[i].start >= filtered[filtered.length - 1].end) {
        filtered.push(regions[i])
      }
    }

    let html = ''
    let cursor = 0
    for (const r of filtered) {
      html += escapeHtml(text.slice(cursor, r.start))
      html += `<span class="${r.cls}">${escapeHtml(text.slice(r.start, r.end))}</span>`
      cursor = r.end
    }
    html += escapeHtml(text.slice(cursor))
    el.innerHTML = html
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
const { quests } = useQuests()
const { trips } = useTrips()
const { getSubquestsByQuestId } = useAllSubquests()
const { getDestinationsByTripId } = useAllDestinations()

const formattedDueDate = computed(() => {
  if (!dueDate.value) return ''
  return formatDueDate(dueDate.value, locale.value, t)
})

const dueDateOverdue = computed(() => {
  if (!dueDate.value) return false
  return isDueDateOverdue(dueDate.value)
})

const formattedRecurrence = computed(() => {
  if (!nlpRecurrenceMatch.value) return ''
  return formatRecurrence(nlpRecurrenceMatch.value.recurrence, locale.value, t)
})

// Effective quest/trip IDs (local override or prop, mutually exclusive)
// If user locally picked a trip, hide any quest from props (and vice versa)
const effectiveQuestId = computed(() => {
  if (localTripId.value) return '' // trip overrides quest
  return localQuestId.value || props.questId
})
const effectiveSubQuestId = computed(() => {
  if (localTripId.value) return ''
  return localSubQuestId.value || props.subQuestId
})
const effectiveTripId = computed(() => {
  if (localQuestId.value) return '' // quest overrides trip
  return localTripId.value || props.tripId
})
const effectiveDestinationId = computed(() => {
  if (localQuestId.value) return ''
  return localDestinationId.value || props.destinationId
})

const questPillLabel = computed(() => {
  const qId = effectiveQuestId.value
  if (!qId) return ''
  const quest = quests.value.find(q => q.id === qId)
  if (!quest) return qId
  const sqId = effectiveSubQuestId.value
  if (sqId) {
    const subs = getSubquestsByQuestId(qId)
    const sub = subs.find(s => s.id === sqId)
    if (sub) return `${quest.name} / ${sub.name}`
  }
  return quest.name
})

const tripPillLabel = computed(() => {
  const tId = effectiveTripId.value
  if (!tId) return ''
  const trip = trips.value.find(t => t.id === tId)
  if (!trip) return tId
  const dId = effectiveDestinationId.value
  if (dId) {
    const dests = getDestinationsByTripId(tId)
    const dest = dests.find(d => d.id === dId)
    if (dest) return `${trip.name} / ${dest.name}`
  }
  return trip.name
})

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: 'lucide:utensils',
  attraction: 'lucide:landmark',
  museum: 'lucide:building-2',
  outdoor: 'lucide:trees',
  activity: 'lucide:dumbbell',
  nightlife: 'lucide:moon',
  shopping: 'lucide:shopping-bag',
  day_trip: 'lucide:map-pin',
  event: 'lucide:party-popper',
  other: 'lucide:circle-dot',
}

const experiencePillLabel = computed(() => {
  if (!createExperienceData.value) return ''
  const catLabel = t(`trip.experiences.categories.${createExperienceData.value.category}`)
  if (createExperienceData.value.city) {
    return `${catLabel} - ${createExperienceData.value.city}`
  }
  return catLabel
})

// When editTask is provided, pre-fill fields
watch(() => props.editTask, (task) => {
  if (task) {
    title.value = task.title
    description.value = task.description || ''
    createWishFlag.value = !!task.wishId
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
  createWishFlag.value = false
  createExperienceFlag.value = false
  createExperienceData.value = null
  blockedByTaskIds.value = []
  dueDate.value = null
  nlpMatch.value = null
  nlpRecurrenceMatch.value = null
  localQuestId.value = ''
  localSubQuestId.value = ''
  localTripId.value = ''
  localDestinationId.value = ''
  showBlockerPicker.value = false
  showDatePicker.value = false
  showQuestPicker.value = false
  showMentionPicker.value = false
  showExperiencePicker.value = false
  mentionQuery.value = ''
}

// Detect @, !, # triggers; sync contenteditable on code-driven changes
watch(title, (val) => {
  // @ mention trigger: opens mention picker
  const atMatch = val.match(/(^|.*\s)@(\w*)$/)
  if (atMatch) {
    const partialQuery = atMatch[2] // text after @
    mentionQuery.value = partialQuery

    // Check for exact match "@wish"
    if (val === '@wish' || val.endsWith(' @wish')) {
      showMentionPicker.value = false
      title.value = val === '@wish' ? '' : val.slice(0, -5).trimEnd()
      createWishFlag.value = true
      return
    }

    // Check for exact match "@xp" or "@experience"
    if (val === '@xp' || val.endsWith(' @xp')) {
      showMentionPicker.value = false
      title.value = val === '@xp' ? '' : val.slice(0, -3).trimEnd()
      showExperiencePicker.value = true
      return
    }
    if (val === '@experience' || val.endsWith(' @experience')) {
      showMentionPicker.value = false
      title.value = val === '@experience' ? '' : val.slice(0, -11).trimEnd()
      showExperiencePicker.value = true
      return
    }

    // Show mention picker
    showMentionPicker.value = true
  } else {
    if (showMentionPicker.value) {
      showMentionPicker.value = false
      mentionQuery.value = ''
    }
  }

  // ! blocker trigger
  if (val === '!' || val.endsWith(' !')) {
    title.value = val === '!' ? '' : val.slice(0, -2).trimEnd()
    showBlockerPicker.value = true
  }

  // # quest trigger
  if (val === '#' || val.endsWith(' #')) {
    title.value = val === '#' ? '' : val.slice(0, -2).trimEnd()
    showQuestPicker.value = true
  }

  // When title is set from code (wish select, triggers, collapse/reset),
  // sync the contenteditable div
  if (!_suppressRender) {
    nextTick(() => renderHighlight())
  }
})

// NLP date + recurrence detection (debounced)
watchDebounced(title, (val) => {
  // Recurrence detection
  const recResult = parseRecurrenceFromText(val, locale.value)
  if (recResult) {
    nlpRecurrenceMatch.value = recResult

    // If recurrence implies a date (e.g. "every monday") or has no impliedDate (e.g. "daily"), auto-set dueDate
    if (!dueDate.value) {
      dueDate.value = recResult.impliedDate || computeInitialDueDateFromRecurrence(recResult.recurrence)
      // Suppress chrono date detection for the same region
      nlpMatch.value = null
    }

    // Only run chrono date detection on the portion of text outside the recurrence match
    if (!dueDate.value || nlpMatch.value) {
      const textWithoutRec = val.slice(0, recResult.index) + ' '.repeat(recResult.end - recResult.index) + val.slice(recResult.end)
      const dateResult = parseDateFromText(textWithoutRec, locale.value)
      if (dateResult) {
        nlpMatch.value = dateResult
        dueDate.value = dateResult.date
      } else if (nlpMatch.value) {
        dueDate.value = recResult.impliedDate || null
        nlpMatch.value = null
      }
    }
  } else {
    if (nlpRecurrenceMatch.value) {
      nlpRecurrenceMatch.value = null
    }

    // Normal date detection
    if (dueDate.value && !nlpMatch.value) return

    const result = parseDateFromText(val, locale.value)
    if (result) {
      nlpMatch.value = result
      dueDate.value = result.date
    } else {
      if (nlpMatch.value) {
        dueDate.value = null
      }
      nlpMatch.value = null
    }
  }
}, { debounce: 150 })

// Re-render highlight when NLP match changes
watch([nlpMatch, nlpRecurrenceMatch], () => {
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

function clearRecurrence() {
  nlpRecurrenceMatch.value = null
}

function handleQuestSelect(data: { questId?: string; subQuestId?: string; tripId?: string; destinationId?: string }) {
  // Clear both so they're mutually exclusive
  localQuestId.value = ''
  localSubQuestId.value = ''
  localTripId.value = ''
  localDestinationId.value = ''

  if (data.questId) {
    localQuestId.value = data.questId
    localSubQuestId.value = data.subQuestId || ''
  } else if (data.tripId) {
    localTripId.value = data.tripId
    localDestinationId.value = data.destinationId || ''
  }
  showQuestPicker.value = false
}

function removeProjectLink() {
  localQuestId.value = ''
  localSubQuestId.value = ''
  localTripId.value = ''
  localDestinationId.value = ''
}

function handleMentionSelect(type: string) {
  // Strip the @ + partial text from title
  const val = title.value
  const atMatch = val.match(/(^|.*\s)@(\w*)$/)
  if (atMatch) {
    const beforeAt = atMatch[1] || ''
    title.value = beforeAt.trimEnd()
  }
  showMentionPicker.value = false
  mentionQuery.value = ''

  if (type === 'wish') {
    createWishFlag.value = true
  } else if (type === 'experience') {
    showExperiencePicker.value = true
  }
}

function handleExperienceSelect(data: { category: ExperienceCategory; city: string; country: string; countryCode: string }) {
  createExperienceFlag.value = true
  createExperienceData.value = data
  showExperiencePicker.value = false
}

function clearExperienceCreation() {
  createExperienceFlag.value = false
  createExperienceData.value = null
}

function handleKeydown(e: KeyboardEvent) {
  if (showMentionPicker.value) {
    if (e.key === 'ArrowUp') {
      mentionPickerRef.value?.moveUp()
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowDown') {
      mentionPickerRef.value?.moveDown()
      e.preventDefault()
      return
    }
    if (e.key === 'Enter') {
      mentionPickerRef.value?.confirmActive()
      e.preventDefault()
      return
    }
  }
  if (e.key === 'Enter') {
    submit()
    e.preventDefault()
  } else if (e.key === 'Escape') {
    collapse()
  }
}

function submit() {
  if (!title.value.trim()) return
  if (props.editTask) {
    let editTitle = title.value.trim()
    if (nlpMatch.value) {
      editTitle = stripDateTextFromTitle(title.value, nlpMatch.value.matchedText, nlpMatch.value.index).trim()
      if (!editTitle) editTitle = title.value.trim()
    }
    const updateData: Record<string, any> = {
      title: editTitle,
      description: description.value.trim(),
      dueDate: dueDate.value ? dueDate.value.toISOString() : '',
    }
    // Include wish link if user toggled createWishFlag
    if (createWishFlag.value && !props.editTask.wishId) {
      updateData.wishId = '__create__'
    }
    // Include quest/trip link if user changed it via # picker
    if (localQuestId.value) {
      updateData.questId = localQuestId.value
      updateData.subQuestId = localSubQuestId.value
      updateData.tripId = ''
      updateData.destinationId = ''
    }
    if (localTripId.value) {
      updateData.tripId = localTripId.value
      updateData.destinationId = localDestinationId.value
      updateData.questId = ''
      updateData.subQuestId = ''
    }
    console.log('[TaskQuickAdd] edit submit, updateData:', updateData)
    emit('update', props.editTask.id, updateData)
    return
  }

  // Strip NLP-detected date and recurrence text from title
  let finalTitle = title.value.trim()

  // Collect regions to strip (recurrence first if it comes earlier in text)
  type StripRegion = { text: string; index: number }
  const strips: StripRegion[] = []
  if (nlpRecurrenceMatch.value) {
    strips.push({ text: nlpRecurrenceMatch.value.matchedText, index: nlpRecurrenceMatch.value.index })
  }
  if (nlpMatch.value) {
    strips.push({ text: nlpMatch.value.matchedText, index: nlpMatch.value.index })
  }
  // Strip from end to start to preserve indices
  strips.sort((a, b) => b.index - a.index)
  for (const s of strips) {
    finalTitle = stripDateTextFromTitle(finalTitle, s.text, s.index)
  }
  finalTitle = finalTitle.trim()
  if (!finalTitle) finalTitle = title.value.trim()

  emit('add', {
    title: finalTitle,
    description: description.value.trim(),
    dueDate: dueDate.value ? dueDate.value.toISOString() : '',
    questId: localQuestId.value || props.questId,
    subQuestId: localSubQuestId.value || props.subQuestId,
    tripId: localTripId.value || props.tripId,
    destinationId: localDestinationId.value || props.destinationId,
    experienceId: createExperienceFlag.value ? '__create__' : (props.experienceId || ''),
    wishId: createWishFlag.value ? '__create__' : '',
    blockedByTaskIds: [...blockedByTaskIds.value],
    recurrence: nlpRecurrenceMatch.value ? JSON.stringify(nlpRecurrenceMatch.value.recurrence) : '',
    createExperienceData: createExperienceData.value || undefined,
  })
  title.value = ''
  description.value = ''
  createWishFlag.value = false
  createExperienceFlag.value = false
  createExperienceData.value = null
  blockedByTaskIds.value = []
  dueDate.value = null
  nlpMatch.value = null
  nlpRecurrenceMatch.value = null
  localQuestId.value = ''
  localSubQuestId.value = ''
  localTripId.value = ''
  localDestinationId.value = ''
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
