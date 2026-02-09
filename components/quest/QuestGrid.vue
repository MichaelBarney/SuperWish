<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse"
      >
        <div class="aspect-[16/9] bg-gray-200" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
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
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Native Quests -->
      <QuestCard
        v-for="quest in sortedQuests"
        :key="`quest-${quest.id}`"
        :quest="quest"
      />
      <!-- Trips as Quests -->
      <QuestTripQuestCard
        v-for="trip in sortedTrips"
        :key="`trip-${trip.id}`"
        :trip="trip"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Quest, Trip } from '~/types'

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

// Sort quests: in_progress first, then planning, then others
const questStatusOrder: Record<string, number> = {
  in_progress: 0,
  planning: 1,
  on_hold: 2,
  completed: 3,
}

const sortedQuests = computed(() => {
  return [...props.quests].sort((a, b) => {
    const orderA = questStatusOrder[a.status] ?? 99
    const orderB = questStatusOrder[b.status] ?? 99
    return orderA - orderB
  })
})

// Sort trips: upcoming first, then planning, then others
const tripStatusOrder: Record<string, number> = {
  upcoming: 0,
  planning: 1,
  active: 2,
  completed: 3,
}

const sortedTrips = computed(() => {
  return [...props.trips].sort((a, b) => {
    const orderA = tripStatusOrder[a.status] ?? 99
    const orderB = tripStatusOrder[b.status] ?? 99
    return orderA - orderB
  })
})
</script>
