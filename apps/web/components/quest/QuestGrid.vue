<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white rounded-xl shadow-soft overflow-hidden animate-pulse"
      >
        <div class="aspect-[2/1] bg-gray-200" />
        <div class="px-3 py-2 space-y-2">
          <div class="h-3 bg-gray-200 rounded w-3/4" />
          <div class="h-2.5 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="quests.length === 0 && trips.length === 0"
      class="text-center py-16 bg-gray-50 rounded-2xl"
    >
      <div class="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Icon name="lucide:target" class="w-10 h-10 text-green-500" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ $t('quest.quests.empty.title') }}
      </h3>
      <p class="text-gray-500 mb-6">
        {{ $t('quest.quests.empty.description') }}
      </p>
      <UiButton variant="primary" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('quest.quests.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Quest Grid -->
    <div v-else class="space-y-8">
      <div v-for="section in sections" :key="section.key">
        <h2 class="text-lg font-semibold text-gray-500 mb-3">
          {{ $t(`quest.sections.${section.key}`) }}
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <template v-for="item in section.items" :key="`${item.type}-${item.data.id}`">
            <QuestCard v-if="item.type === 'quest'" :quest="item.data" />
            <QuestTripQuestCard v-else :trip="item.data" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Quest, Trip } from '~/types'

type QuestGridItem =
  | { type: 'quest'; data: Quest }
  | { type: 'trip'; data: Trip }

interface Props {
  quests: readonly Quest[]
  trips: readonly Trip[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  create: []
}>()

function getSortDate(item: QuestGridItem): Date | null {
  const d = item.data.endDate ?? item.data.startDate
  return d instanceof Date ? d : null
}

function byDate(a: QuestGridItem, b: QuestGridItem): number {
  const dateA = getSortDate(a)
  const dateB = getSortDate(b)
  if (dateA && dateB) return dateA.getTime() - dateB.getTime()
  if (dateA && !dateB) return -1
  if (!dateA && dateB) return 1
  return 0
}

const sections = computed(() => {
  const all: QuestGridItem[] = [
    ...props.quests.map((q): QuestGridItem => ({ type: 'quest', data: q })),
    ...props.trips.map((t): QuestGridItem => ({ type: 'trip', data: t })),
  ]

  const defs = [
    { key: 'ongoing', statuses: ['in_progress', 'upcoming', 'active'] },
    { key: 'on_hold', statuses: ['on_hold'] },
    { key: 'planning', statuses: ['planning'] },
    { key: 'completed', statuses: ['completed'] },
  ]

  return defs
    .map(def => ({
      key: def.key,
      items: all.filter(i => def.statuses.includes(i.data.status)).sort(byDate),
    }))
    .filter(s => s.items.length > 0)
})
</script>
