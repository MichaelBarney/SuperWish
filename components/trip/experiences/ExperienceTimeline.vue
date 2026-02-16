<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Empty -->
    <div v-else-if="experiences.length === 0" class="text-center py-8">
      <Icon name="lucide:sparkles" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 text-sm">{{ $t('travel.experiences.empty.description') }}</p>
    </div>

    <!-- Timeline -->
    <div v-else class="relative">
      <!-- Vertical line -->
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div v-for="(group, groupIndex) in groupedExperiences" :key="group.dateKey" class="relative">
        <!-- Date marker -->
        <div class="flex items-center gap-3 mb-3" :class="groupIndex > 0 ? 'mt-6' : ''">
          <div class="relative z-10 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <Icon name="lucide:calendar" class="w-4 h-4 text-purple-600" />
          </div>
          <h4 class="text-sm font-semibold text-gray-900">
            {{ group.label }}
          </h4>
        </div>

        <!-- Experience cards within this date group -->
        <div class="ml-12 space-y-3 mb-2">
          <TripExperiencesExperienceCard
            v-for="experience in group.experiences"
            :key="experience.id"
            :experience="experience"
            @edit="$emit('edit', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Experience } from '~/types'

interface Props {
  experiences: Experience[]
  loading?: boolean
}

const props = defineProps<Props>()

defineEmits<{
  edit: [experience: Experience]
}>()

const { locale, t } = useI18n()

interface ExperienceGroup {
  dateKey: string
  label: string
  experiences: Experience[]
}

const groupedExperiences = computed<ExperienceGroup[]>(() => {
  const dated: Record<string, Experience[]> = {}
  const undated: Experience[] = []

  for (const exp of props.experiences) {
    if (exp.scheduledDate) {
      const d = exp.scheduledDate instanceof Date ? exp.scheduledDate : new Date(exp.scheduledDate)
      const key = d.toISOString().split('T')[0]
      if (!dated[key]) dated[key] = []
      dated[key].push(exp)
    } else {
      undated.push(exp)
    }
  }

  // Sort each group by scheduledTime
  for (const key of Object.keys(dated)) {
    dated[key].sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''))
  }

  // Sort date keys chronologically
  const sortedKeys = Object.keys(dated).sort()
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }

  const groups: ExperienceGroup[] = sortedKeys.map(key => ({
    dateKey: key,
    label: new Date(key + 'T00:00:00Z').toLocaleDateString(dateLocale, formatOptions),
    experiences: dated[key],
  }))

  // Add undated group at the end
  if (undated.length > 0) {
    groups.push({
      dateKey: '_unscheduled',
      label: t('travel.destinations.detail.unscheduled'),
      experiences: undated,
    })
  }

  return groups
})
</script>
