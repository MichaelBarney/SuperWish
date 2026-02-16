<template>
  <div
    class="group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-gray-50"
  >
    <!-- Checkbox -->
    <button
      @click="handleToggle"
      class="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
      :class="isWishLinked
        ? (effectiveCompleted
          ? 'bg-teal-500 border-teal-500 cursor-not-allowed'
          : 'border-teal-300 cursor-not-allowed')
        : (effectiveCompleted
          ? 'bg-orange-500 border-orange-500'
          : 'border-gray-300 hover:border-orange-400')"
      :disabled="isWishLinked"
    >
      <svg
        v-if="effectiveCompleted"
        class="w-3 h-3 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="cursor-pointer" @click="$emit('edit', task)">
        <p
          class="text-sm font-medium transition-all"
          :class="effectiveCompleted ? 'text-gray-400 line-through' : 'text-gray-900'"
        >
          {{ task.title }}
        </p>
        <p
          v-if="task.description"
          class="text-xs text-gray-400 mt-0.5 truncate"
        >
          {{ task.description }}
        </p>
        <!-- Project badge -->
        <div v-if="projectLabel" class="flex items-center gap-1 mt-1">
          <Icon :name="projectIcon" class="w-3 h-3 text-gray-400" />
          <span class="text-xs text-gray-400">{{ projectLabel }}</span>
        </div>
      </div>
      <!-- Wish badge (outside content click area so it navigates to wish) -->
      <div
        v-if="isWishLinked && linkedWish"
        class="flex items-center gap-2 mt-1 cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-teal-50"
        @click.stop="navigateToWish"
      >
        <div class="w-4 h-4 rounded bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          <img v-if="linkedWish.imageUrl" :src="linkedWish.imageUrl" :alt="linkedWish.title" class="w-full h-full object-cover" />
          <Icon v-else name="lucide:star" class="w-2.5 h-2.5 text-teal-400" />
        </div>
        <WishesWishStatusBadge :status="linkedWish.status" />
        <span v-if="linkedWish.targetPrice" class="text-xs text-gray-400">
          {{ getCurrencySymbol(linkedWish.currency) }}{{ linkedWish.targetPrice }}
        </span>
        <Icon name="lucide:external-link" class="w-3 h-3 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>

    <!-- Badge group -->
    <div class="flex items-start gap-1 mt-0.5 shrink-0">
      <!-- Time horizon pill -->
      <div class="relative min-w-[4rem] flex justify-center" ref="horizonDropdownRef">
        <button
          v-if="task.timeHorizon"
          @click.stop="toggleHorizonDropdown"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
          :class="horizonPillClass"
        >
          <Icon :name="horizonIcon" class="w-3 h-3 shrink-0" />
          <span>{{ horizonLabel }}</span>
        </button>
        <button
          v-else
          @click.stop="toggleHorizonDropdown"
          class="p-1 text-gray-300 hover:text-gray-500 transition-all"
        >
          <Icon name="lucide:calendar-clock" class="w-4 h-4" />
        </button>

        <!-- Dropdown -->
        <div
          v-if="showHorizonDropdown"
          class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          <button
            v-for="option in horizonOptions"
            :key="option.value"
            @click.stop="selectHorizon(option.value)"
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
            :class="task.timeHorizon === option.value
              ? 'bg-orange-50 text-orange-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'"
          >
            <Icon :name="option.icon" class="w-3.5 h-3.5" />
            <span>{{ option.label }}</span>
          </button>
          <div v-if="task.timeHorizon" class="border-t border-gray-100 mt-1 pt-1">
            <button
              @click.stop="selectHorizon(null)"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
              <span>{{ $t('task.timeHorizon.none') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Estimated time pill -->
      <div class="relative min-w-[4rem] flex justify-center" ref="estimateDropdownRef">
        <button
          v-if="task.estimatedTime"
          @click.stop="toggleEstimateDropdown"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
          :class="estimatePillClass"
        >
          <Icon :name="estimateIcon" class="w-3 h-3 shrink-0" />
          <span>{{ estimateLabel }}</span>
        </button>
        <button
          v-else
          @click.stop="toggleEstimateDropdown"
          class="p-1 text-gray-300 hover:text-gray-500 transition-all"
        >
          <Icon name="lucide:timer" class="w-4 h-4" />
        </button>

        <!-- Dropdown -->
        <div
          v-if="showEstimateDropdown"
          class="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        >
          <button
            v-for="option in estimateOptions"
            :key="option.value"
            @click.stop="selectEstimate(option.value)"
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
            :class="task.estimatedTime === option.value
              ? option.activeClass
              : 'text-gray-700 hover:bg-gray-50'"
          >
            <Icon :name="option.icon" class="w-3.5 h-3.5" />
            <span>{{ option.label }}</span>
          </button>
          <div v-if="task.estimatedTime" class="border-t border-gray-100 mt-1 pt-1">
            <button
              @click.stop="selectEstimate(null)"
              class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
              <span>{{ $t('task.estimatedTime.none') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit button (on hover) -->
    <button
      @click.stop="$emit('startEdit', task.id)"
      class="mt-0.5 p-1 text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"
    >
      <Icon name="lucide:pencil" class="w-4 h-4" />
    </button>

    <!-- Delete button (on hover) -->
    <button
      @click.stop="$emit('delete', task.id)"
      class="mt-0.5 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Task, Wish, TaskTimeHorizon, TaskEstimatedTime } from '~/types'
import { isOwnedStatus, getCurrencySymbol } from '~/types'

interface Props {
  task: Task
  projectLabel?: string
  projectIcon?: string
  linkedWish?: Wish | null
}

const props = withDefaults(defineProps<Props>(), {
  projectLabel: '',
  projectIcon: 'lucide:hash',
  linkedWish: null,
})

const emit = defineEmits<{
  toggle: [id: string, completed: boolean]
  edit: [task: Task]
  delete: [id: string]
  startEdit: [id: string]
  updateTimeHorizon: [id: string, timeHorizon: TaskTimeHorizon | null]
  updateEstimatedTime: [id: string, estimatedTime: TaskEstimatedTime | null]
}>()

const { t } = useI18n()

const isWishLinked = computed(() => !!props.task.wishId)

const effectiveCompleted = computed(() => {
  if (isWishLinked.value && props.linkedWish) {
    return isOwnedStatus(props.linkedWish.status)
  }
  return props.task.completed
})

function handleToggle() {
  if (isWishLinked.value) return
  emit('toggle', props.task.id, !effectiveCompleted.value)
}

function navigateToWish() {
  if (!props.task.wishId) return
  const wishId = props.task.wishId
  const listId = props.linkedWish?.listId
  if (listId) {
    navigateTo(`/wish/list/${listId}?editWishId=${wishId}`)
  } else {
    navigateTo(`/wish?editWishId=${wishId}`)
  }
}

// Time horizon dropdown
const showHorizonDropdown = ref(false)
const horizonDropdownRef = ref<HTMLElement | null>(null)

const horizonOptions = computed(() => [
  { value: 'today' as const, label: t('task.timeHorizon.today'), icon: 'lucide:sun' },
  { value: 'this_week' as const, label: t('task.timeHorizon.thisWeek'), icon: 'lucide:calendar-days' },
  { value: 'this_month' as const, label: t('task.timeHorizon.thisMonth'), icon: 'lucide:calendar' },
  { value: 'long_term' as const, label: t('task.timeHorizon.longTerm'), icon: 'lucide:clock' },
])

const horizonIcon = computed(() => {
  const option = horizonOptions.value.find(o => o.value === props.task.timeHorizon)
  return option?.icon || 'lucide:calendar-clock'
})

const horizonLabel = computed(() => {
  const option = horizonOptions.value.find(o => o.value === props.task.timeHorizon)
  return option?.label || ''
})

const horizonPillClass = computed(() => {
  switch (props.task.timeHorizon) {
    case 'today': return 'bg-amber-50 text-amber-700 hover:bg-amber-100'
    case 'this_week': return 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    case 'this_month': return 'bg-purple-50 text-purple-700 hover:bg-purple-100'
    case 'long_term': return 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    default: return 'bg-gray-100 text-gray-500'
  }
})

function toggleHorizonDropdown() {
  showHorizonDropdown.value = !showHorizonDropdown.value
}

function selectHorizon(value: TaskTimeHorizon | null) {
  emit('updateTimeHorizon', props.task.id, value)
  showHorizonDropdown.value = false
}

// Estimated time dropdown
const showEstimateDropdown = ref(false)
const estimateDropdownRef = ref<HTMLElement | null>(null)

const estimateOptions = computed(() => [
  { value: '5min' as const, label: t('task.estimatedTime.5min'), icon: 'lucide:zap', activeClass: 'bg-yellow-50 text-yellow-700 font-medium' },
  { value: '12min' as const, label: t('task.estimatedTime.12min'), icon: 'noto:direct-hit', activeClass: 'bg-blue-50 text-blue-700 font-medium' },
  { value: '25min' as const, label: t('task.estimatedTime.25min'), icon: 'noto:tomato', activeClass: 'bg-green-50 text-green-700 font-medium' },
  { value: '1h_plus' as const, label: t('task.estimatedTime.1hPlus'), icon: 'noto:mantelpiece-clock', activeClass: 'bg-red-50 text-red-700 font-medium' },
])

const estimateIcon = computed(() => {
  const option = estimateOptions.value.find(o => o.value === props.task.estimatedTime)
  return option?.icon || 'lucide:timer'
})

const estimateLabel = computed(() => {
  const option = estimateOptions.value.find(o => o.value === props.task.estimatedTime)
  return option?.label || ''
})

const estimatePillClass = computed(() => {
  switch (props.task.estimatedTime) {
    case '5min': return 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
    case '12min': return 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    case '25min': return 'bg-green-50 text-green-700 hover:bg-green-100'
    case '1h_plus': return 'bg-red-50 text-red-700 hover:bg-red-100'
    default: return 'bg-gray-100 text-gray-500'
  }
})

function toggleEstimateDropdown() {
  showEstimateDropdown.value = !showEstimateDropdown.value
}

function selectEstimate(value: TaskEstimatedTime | null) {
  emit('updateEstimatedTime', props.task.id, value)
  showEstimateDropdown.value = false
}

// Close dropdowns on outside click
function handleClickOutside(e: MouseEvent) {
  if (horizonDropdownRef.value && !horizonDropdownRef.value.contains(e.target as Node)) {
    showHorizonDropdown.value = false
  }
  if (estimateDropdownRef.value && !estimateDropdownRef.value.contains(e.target as Node)) {
    showEstimateDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
