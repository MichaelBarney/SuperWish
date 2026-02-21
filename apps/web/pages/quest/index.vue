<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('quest.quests.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ $t('quest.quests.questCount', totalCount) }}</p>
      </div>

      <UiButton @click="showCreateModal = true">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('quest.quests.newQuest') }}
      </UiButton>
    </div>

    <!-- Quest Grid (includes both quests and trips) -->
    <QuestGrid
      :quests="quests"
      :trips="trips"
      :loading="questsLoading || tripsLoading"
      @create="showCreateModal = true"
    />

    <!-- Create Quest Modal -->
    <UiModal
      v-model="showCreateModal"
      :title="$t('quest.quests.newQuest')"
    >
      <QuestForm
        @submit="handleCreateQuest"
        @cancel="showCreateModal = false"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { QuestForm } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

// Set app context to SuperQuest
const { setApp } = useAppContext()
onMounted(() => {
  setApp('superquest')
})

// Quests
const { quests, loading: questsLoading, createQuest } = useQuests()

// Trips (shown as quests)
const { trips, loading: tripsLoading } = useTrips()

// Total count
const totalCount = computed(() => quests.value.length + trips.value.length)

// Modals
const showCreateModal = ref(false)

// Handlers
async function handleCreateQuest(data: QuestForm) {
  const result = await createQuest(data)

  if (result.success) {
    showCreateModal.value = false
    if (result.id) {
      navigateTo(`/quest/${result.id}`)
    }
  }
}
</script>
