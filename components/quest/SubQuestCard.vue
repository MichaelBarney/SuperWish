<template>
  <div
    class="group flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-0.5 cursor-pointer"
    @click="$emit('click', subquest)"
  >
    <!-- Icon -->
    <div
      class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      :class="iconBgClass"
    >
      <Icon :name="subquest.icon || 'lucide:target'" class="w-5 h-5" :class="iconTextClass" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-semibold text-gray-900 truncate">
          {{ subquest.name }}
        </h3>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
          :class="statusBadgeClass"
        >
          {{ $t(`quest.quests.status.${subquest.status}`) }}
        </span>
      </div>
      <p v-if="subquest.goal" class="text-xs text-gray-500 truncate mt-0.5">
        {{ subquest.goal }}
      </p>
    </div>

    <!-- Date range -->
    <p v-if="dateRange" class="text-xs text-gray-400 shrink-0 hidden sm:block">
      {{ dateRange }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { SubQuest } from '~/types'

interface Props {
  subquest: SubQuest
}

const props = defineProps<Props>()
defineEmits<{
  click: [subquest: SubQuest]
}>()

const { locale, t } = useI18n()

const statusBadgeClass = computed(() => {
  switch (props.subquest.status) {
    case 'planning':
      return 'bg-gray-100 text-gray-700'
    case 'in_progress':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700'
    case 'on_hold':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

const iconBgClass = computed(() => {
  switch (props.subquest.status) {
    case 'completed':
      return 'bg-emerald-100'
    case 'in_progress':
      return 'bg-green-100'
    case 'on_hold':
      return 'bg-amber-100'
    default:
      return 'bg-green-100'
  }
})

const iconTextClass = computed(() => {
  switch (props.subquest.status) {
    case 'completed':
      return 'text-emerald-600'
    case 'in_progress':
      return 'text-green-600'
    case 'on_hold':
      return 'text-amber-600'
    default:
      return 'text-green-600'
  }
})

const dateRange = computed(() => {
  const { startDate, endDate } = props.subquest
  if (!startDate && !endDate) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }

  if (startDate && endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)

    if (start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString(dateLocale, formatOptions)} - ${end.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })}`
    }

    return `${start.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })} - ${end.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' })}`
  }

  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    return t('quest.quests.dateStarts', { date: start.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' }) })
  }

  if (endDate) {
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    return t('quest.quests.dateDue', { date: end.toLocaleDateString(dateLocale, { ...formatOptions, year: 'numeric' }) })
  }

  return null
})
</script>
