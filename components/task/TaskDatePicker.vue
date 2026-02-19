<template>
  <div v-if="modelValue" class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
    <!-- Quick options -->
    <div class="p-2 space-y-0.5">
      <button
        v-for="option in quickOptions"
        :key="option.key"
        @click="selectQuickOption(option.getDate())"
        class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-orange-50 rounded-lg transition-colors text-left"
      >
        <Icon :name="option.icon" class="w-4 h-4 text-gray-400" />
        <span>{{ option.label }}</span>
        <span class="ml-auto text-xs text-gray-400">{{ option.hint }}</span>
      </button>
    </div>

    <div class="border-t border-gray-100 p-3 space-y-2">
      <!-- Date input -->
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('task.dueDate.date') }}</label>
        <input
          v-model="dateValue"
          type="date"
          class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
      </div>
      <!-- Time input -->
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1">{{ $t('task.dueDate.time') }}</label>
        <input
          v-model="timeValue"
          type="time"
          class="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 p-2 border-t border-gray-100 bg-gray-50">
      <button
        v-if="currentDate"
        @click="clearDate"
        class="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        {{ $t('task.dueDate.clear') }}
      </button>
      <div class="flex-1" />
      <button
        @click="close"
        class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        @click="confirmDate"
        :disabled="!dateValue"
        class="px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {{ $t('task.dueDate.set') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  currentDate?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  currentDate: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [date: Date | null]
}>()

const { t, locale } = useI18n()

const dateValue = ref('')
const timeValue = ref('')

const quickOptions = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay() + 1)) // Next Monday

  const formatHint = (d: Date) =>
    d.toLocaleDateString(locale.value, { weekday: 'short', month: 'short', day: 'numeric' })

  return [
    {
      key: 'today',
      label: t('task.dueDate.today'),
      icon: 'lucide:sun',
      hint: formatHint(today),
      getDate: () => today,
    },
    {
      key: 'tomorrow',
      label: t('task.dueDate.tomorrow'),
      icon: 'lucide:sunrise',
      hint: formatHint(tomorrow),
      getDate: () => tomorrow,
    },
    {
      key: 'nextWeek',
      label: t('task.dueDate.nextWeek'),
      icon: 'lucide:calendar-days',
      hint: formatHint(nextWeek),
      getDate: () => nextWeek,
    },
  ]
})

// Initialize from current date
watch(() => props.modelValue, (open) => {
  if (open && props.currentDate) {
    const d = props.currentDate
    dateValue.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const hasTime = d.getHours() !== 12 || d.getMinutes() !== 0
    timeValue.value = hasTime
      ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : ''
  } else if (open) {
    dateValue.value = ''
    timeValue.value = ''
  }
})

function selectQuickOption(date: Date) {
  // Quick options are date-only, store at noon per CLAUDE.md rule
  const result = new Date(date)
  result.setHours(12, 0, 0, 0)
  emit('select', result)
  emit('update:modelValue', false)
}

function confirmDate() {
  if (!dateValue.value) return
  // Append T12:00:00 per CLAUDE.md date-only rule, unless time is specified
  const date = timeValue.value
    ? new Date(`${dateValue.value}T${timeValue.value}:00`)
    : new Date(`${dateValue.value}T12:00:00`)
  emit('select', date)
  emit('update:modelValue', false)
}

function clearDate() {
  emit('select', null)
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}
</script>
