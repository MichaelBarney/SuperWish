<template>
  <GridLayout
    columns="auto, *"
    rows="auto, auto"
    class="task-item"
    @tap="$emit('tap', task)"
  >
    <!-- Checkbox (Switch) -->
    <Switch
      col="0"
      row="0"
      rowSpan="2"
      :checked="task.completed"
      :isEnabled="!isWishLinked && !isBlocked"
      :color="switchColor"
      verticalAlignment="top"
      style="margin-right: 8; margin-top: 2;"
      @checkedChange="onCheckedChange"
    />

    <!-- Title -->
    <Label
      col="1"
      row="0"
      :text="task.title"
      :class="['text-body', task.completed ? 'text-completed' : '']"
      textWrap="true"
    />

    <!-- Badge row -->
    <FlexboxLayout
      col="1"
      row="1"
      flexWrap="wrap"
      style="margin-top: 4;"
    >
      <!-- Time horizon pill -->
      <Label
        v-if="task.timeHorizon"
        :text="horizonLabel"
        :class="['pill', horizonPillClass]"
      />

      <!-- Estimated time pill -->
      <Label
        v-if="task.estimatedTime"
        :text="estimatedTimeLabel"
        :class="['pill', estimatedTimePillClass]"
      />

      <!-- Due date pill -->
      <Label
        v-if="task.dueDate && !task.completed"
        :text="formattedDueDate"
        :class="['pill', isOverdue ? 'pill-due-date-overdue' : 'pill-due-date']"
      />

      <!-- Blocker count pill -->
      <Label
        v-if="incompleteBlockerCount > 0"
        :text="`${incompleteBlockerCount} blocker${incompleteBlockerCount > 1 ? 's' : ''}`"
        class="pill pill-blockers"
      />

      <!-- Recurrence pill -->
      <Label
        v-if="task.recurrence"
        :text="recurrenceLabel"
        class="pill pill-recurrence"
      />
    </FlexboxLayout>
  </GridLayout>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue'
import type { Task } from '@superwish/shared'
import { formatDueDate, isDueDateOverdue, formatRecurrence } from '@superwish/shared'

const props = defineProps<{
  task: Task
  allTasks: readonly Task[]
}>()

const emit = defineEmits<{
  (e: 'toggle', task: Task): void
  (e: 'tap', task: Task): void
}>()

const isWishLinked = computed(() => !!props.task.wishId)

const isBlocked = computed(() => {
  const blockerIds = props.task.blockedByTaskIds || []
  return blockerIds.some(id => {
    const blocker = props.allTasks.find(t => t.id === id)
    return blocker && !blocker.completed
  })
})

const incompleteBlockerCount = computed(() => {
  const blockerIds = props.task.blockedByTaskIds || []
  return blockerIds.filter(id => {
    const blocker = props.allTasks.find(t => t.id === id)
    return blocker && !blocker.completed
  }).length
})

const switchColor = computed(() => {
  if (isBlocked.value) return '#ef4444' // red
  if (isWishLinked.value) return '#14b8a6' // teal
  return '#f97316' // orange
})

const horizonLabel = computed(() => {
  const labels: Record<string, string> = {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    long_term: 'Long Term',
  }
  return labels[props.task.timeHorizon || ''] || ''
})

const horizonPillClass = computed(() => {
  const classes: Record<string, string> = {
    today: 'pill-today',
    this_week: 'pill-this-week',
    this_month: 'pill-this-month',
    long_term: 'pill-long-term',
  }
  return classes[props.task.timeHorizon || ''] || ''
})

const estimatedTimeLabel = computed(() => {
  const labels: Record<string, string> = {
    '5min': '5min',
    '12min': '12min',
    '25min': '25min',
    '1h_plus': '1h+',
  }
  return labels[props.task.estimatedTime || ''] || ''
})

const estimatedTimePillClass = computed(() => {
  const classes: Record<string, string> = {
    '5min': 'pill-5min',
    '12min': 'pill-12min',
    '25min': 'pill-25min',
    '1h_plus': 'pill-1h-plus',
  }
  return classes[props.task.estimatedTime || ''] || ''
})

const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  const date = props.task.dueDate instanceof Date ? props.task.dueDate : new Date(props.task.dueDate as any)
  // Simple translation stub for mobile — can be enhanced with i18n later
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'task.dueDate.today': 'Today',
      'task.dueDate.tomorrow': 'Tomorrow',
    }
    return translations[key] || key
  }
  return formatDueDate(date, 'en', t)
})

const isOverdue = computed(() => {
  if (!props.task.dueDate || props.task.completed) return false
  const date = props.task.dueDate instanceof Date ? props.task.dueDate : new Date(props.task.dueDate as any)
  return isDueDateOverdue(date)
})

const recurrenceLabel = computed(() => {
  if (!props.task.recurrence) return ''
  const t = (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      'task.recurrence.daily': 'Daily',
      'task.recurrence.weekly': 'Weekly',
      'task.recurrence.monthly': 'Monthly',
      'task.recurrence.yearly': 'Yearly',
    }
    if (key === 'task.recurrence.dayOfMonth' && params?.day) {
      return `Every ${params.day}${getOrdinalSuffix(params.day as number)}`
    }
    return translations[key] || key
  }
  return formatRecurrence(props.task.recurrence, 'en', t)
})

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function onCheckedChange(event: any) {
  // Prevent re-emitting when programmatically set
  if (event.value !== props.task.completed) {
    emit('toggle', props.task)
  }
}
</script>
