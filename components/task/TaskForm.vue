<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Title -->
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.title') }}
      </label>
      <div class="flex items-center gap-2">
        <Icon
          v-if="form.wishId || linkType === 'wish'"
          name="lucide:star"
          class="w-4 h-4 text-teal-500 shrink-0"
        />
        <input
          v-model="form.title"
          type="text"
          :placeholder="$t('task.form.titlePlaceholder')"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
          required
        />
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.description') }}
      </label>
      <textarea
        v-model="form.description"
        :placeholder="$t('task.form.descriptionPlaceholder')"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      />
    </div>

    <!-- Due Date -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.dueDate') }}
      </label>
      <div class="flex gap-2">
        <input
          v-model="dueDateValue"
          type="date"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
        <input
          v-model="dueTimeValue"
          type="time"
          :placeholder="$t('task.dueDate.time')"
          class="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
        <button
          v-if="dueDateValue"
          type="button"
          @click="clearDueDate"
          class="p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Time Horizon -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.timeHorizon') }}
      </label>
      <select
        v-model="form.timeHorizon"
        :disabled="!!dueDateValue"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="">{{ $t('task.timeHorizon.none') }}</option>
        <option value="today">{{ $t('task.timeHorizon.today') }}</option>
        <option value="this_week">{{ $t('task.timeHorizon.thisWeek') }}</option>
        <option value="this_month">{{ $t('task.timeHorizon.thisMonth') }}</option>
        <option value="long_term">{{ $t('task.timeHorizon.longTerm') }}</option>
      </select>
    </div>

    <!-- Recurrence -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.recurrence') }}
      </label>
      <select
        v-model="recurrenceFrequency"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
      >
        <option value="">{{ $t('task.recurrence.none') }}</option>
        <option value="daily">{{ $t('task.recurrence.daily') }}</option>
        <option value="weekly">{{ $t('task.recurrence.weekly') }}</option>
        <option value="monthly">{{ $t('task.recurrence.monthly') }}</option>
        <option value="yearly">{{ $t('task.recurrence.yearly') }}</option>
      </select>
    </div>

    <!-- Link to -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.linkTo') }}
      </label>
      <select
        v-model="linkType"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      >
        <option value="none">{{ $t('task.form.linkNone') }}</option>
        <option value="quest">{{ $t('task.form.linkQuest') }}</option>
        <option value="trip">{{ $t('task.form.linkTrip') }}</option>
        <option v-if="!initialData?.wishId" value="wish">{{ $t('task.form.linkWish') }}</option>
      </select>
    </div>

    <!-- Quest selector -->
    <div v-if="linkType === 'quest'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.selectQuest') }}
      </label>
      <select
        v-model="form.questId"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      >
        <option value="">--</option>
        <option v-for="q in quests" :key="q.id" :value="q.id">{{ q.name }}</option>
      </select>
    </div>

    <!-- Trip selector -->
    <div v-if="linkType === 'trip'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.selectTrip') }}
      </label>
      <select
        v-model="form.tripId"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      >
        <option value="">--</option>
        <option v-for="t in trips" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </div>

    <!-- Wish create indicator -->
    <div v-if="linkType === 'wish'">
      <!-- Edit mode: read-only wish info -->
      <div v-if="initialData?.wishId && selectedWish" class="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
        <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="selectedWish.imageUrl" :src="selectedWish.imageUrl" :alt="selectedWish.title" class="w-full h-full object-cover" />
          <Icon v-else name="lucide:star" class="w-5 h-5 text-teal-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ selectedWish.title }}</p>
          <p class="text-xs text-gray-500 mt-0.5">{{ $t('task.form.linkedToWish') }}</p>
        </div>
      </div>
      <!-- Create mode: indicator -->
      <div v-else class="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
        <Icon name="lucide:star" class="w-4 h-4 text-teal-500" />
        <span class="text-sm text-teal-700">{{ $t('task.form.wishWillBeCreated') }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-2">
      <UiButton variant="secondary" type="button" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton type="submit">
        {{ initialData ? $t('common.save') : $t('task.form.createTask') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TaskForm, Quest, Trip, TaskRecurrenceFrequency } from '~/types'
import { computeTimeHorizonFromDate } from '~/utils/taskDueDate'
import { computeInitialDueDateFromRecurrence } from '~/utils/taskRecurrence'

interface Props {
  initialData?: Partial<TaskForm>
  quests?: Quest[]
  trips?: Trip[]
}

const props = withDefaults(defineProps<Props>(), {
  quests: () => [],
  trips: () => [],
})

const emit = defineEmits<{
  submit: [data: TaskForm]
  cancel: []
}>()

const { getWishById } = useAllWishes()

const form = reactive<TaskForm>({
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  dueDate: props.initialData?.dueDate || '',
  questId: props.initialData?.questId || '',
  subQuestId: props.initialData?.subQuestId || '',
  tripId: props.initialData?.tripId || '',
  destinationId: props.initialData?.destinationId || '',
  accommodationId: props.initialData?.accommodationId || '',
  experienceId: props.initialData?.experienceId || '',
  wishId: props.initialData?.wishId || '',
  timeHorizon: props.initialData?.timeHorizon || '',
  estimatedTime: props.initialData?.estimatedTime || '',
  recurrence: props.initialData?.recurrence || '',
  blockedByTaskIds: props.initialData?.blockedByTaskIds || [],
})

// Recurrence frequency local state
const recurrenceFrequency = ref('')

// Initialize from form.recurrence
if (form.recurrence) {
  try {
    const parsed = JSON.parse(form.recurrence)
    recurrenceFrequency.value = parsed.frequency || ''
  } catch { /* ignore */ }
}

// Sync recurrence frequency to form.recurrence and auto-set dueDate
watch(recurrenceFrequency, (val) => {
  if (val) {
    const recurrence = { frequency: val as TaskRecurrenceFrequency, interval: 1 }
    form.recurrence = JSON.stringify(recurrence)
    // Auto-set dueDate if not already set
    if (!dueDateValue.value) {
      const initialDate = computeInitialDueDateFromRecurrence(recurrence)
      dueDateValue.value = `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}`
    }
  } else {
    form.recurrence = ''
  }
})

// Due date local state for the two inputs
const dueDateValue = ref('')
const dueTimeValue = ref('')

// Initialize from form.dueDate
if (form.dueDate) {
  const d = new Date(form.dueDate)
  dueDateValue.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const hasTime = d.getHours() !== 12 || d.getMinutes() !== 0
  if (hasTime) {
    dueTimeValue.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
}

// Sync local date/time inputs to form.dueDate and auto-compute timeHorizon
watch([dueDateValue, dueTimeValue], ([dateVal, timeVal]) => {
  if (!dateVal) {
    form.dueDate = ''
    return
  }
  // Use T12:00:00 per CLAUDE.md date-only rule when no time specified
  const isoStr = timeVal
    ? `${dateVal}T${timeVal}:00`
    : `${dateVal}T12:00:00`
  form.dueDate = new Date(isoStr).toISOString()
  // Auto-compute timeHorizon
  form.timeHorizon = computeTimeHorizonFromDate(new Date(isoStr))
})

function clearDueDate() {
  dueDateValue.value = ''
  dueTimeValue.value = ''
  form.dueDate = ''
}

const linkType = ref<'none' | 'quest' | 'trip' | 'wish'>(
  props.initialData?.wishId ? 'wish' :
  props.initialData?.questId ? 'quest' :
  props.initialData?.tripId ? 'trip' :
  'none'
)

const selectedWish = computed(() => {
  if (!form.wishId || form.wishId === '__create__') return null
  return getWishById(form.wishId) || null
})

// Clear foreign keys when link type changes
watch(linkType, (newType) => {
  if (newType !== 'quest') {
    form.questId = ''
    form.subQuestId = ''
  }
  if (newType !== 'trip') {
    form.tripId = ''
    form.destinationId = ''
  }
  if (newType !== 'wish') {
    form.wishId = ''
  } else if (!props.initialData?.wishId) {
    // Create mode: set sentinel
    form.wishId = '__create__'
  }
})

// Detect @wish trigger in title
watch(() => form.title, (val) => {
  if (val === '@wish' || val.endsWith(' @wish')) {
    form.title = val === '@wish' ? '' : val.slice(0, -5).trimEnd()
    linkType.value = 'wish'
    form.wishId = '__create__'
  }
})

function handleSubmit() {
  if (!form.title.trim()) return
  emit('submit', { ...form })
}
</script>
