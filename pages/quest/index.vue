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
      @edit="openEditModal"
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

    <!-- Edit Quest Modal -->
    <UiModal
      v-model="showEditModal"
      :title="$t('quest.quests.editQuest')"
    >
      <QuestForm
        :initial-data="selectedQuest"
        @submit="handleUpdateQuest"
        @cancel="showEditModal = false"
      />
    </UiModal>

    <!-- Delete Confirmation Modal -->
    <UiModal
      v-model="showDeleteModal"
      :title="$t('quest.quests.deleteQuest')"
    >
      <p class="text-gray-600 mb-6">{{ $t('quest.quests.deleteConfirm') }}</p>
      <div class="flex justify-end gap-3">
        <UiButton variant="secondary" @click="showDeleteModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="deleting" @click="handleDeleteQuest">
          {{ $t('common.delete') }}
        </UiButton>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { QuestForm, Quest } from '~/types'

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
const { quests, loading: questsLoading, createQuest, updateQuest, deleteQuest } = useQuests()

// Trips (shown as quests)
const { trips, loading: tripsLoading } = useTrips()

// Total count
const totalCount = computed(() => quests.value.length + trips.value.length)

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedQuest = ref<Quest | undefined>(undefined)
const deleting = ref(false)

// Open edit modal
function openEditModal(quest: Quest) {
  selectedQuest.value = quest
  showEditModal.value = true
}

// Handlers
async function handleCreateQuest(data: QuestForm) {
  const result = await createQuest(data)

  if (result.success) {
    showCreateModal.value = false
  }
}

async function handleUpdateQuest(data: QuestForm) {
  if (!selectedQuest.value) return

  const result = await updateQuest(selectedQuest.value.id, data)

  if (result.success) {
    showEditModal.value = false
    selectedQuest.value = undefined
  }
}

async function handleDeleteQuest() {
  if (!selectedQuest.value) return

  deleting.value = true
  const result = await deleteQuest(selectedQuest.value.id)

  if (result.success) {
    showDeleteModal.value = false
    showEditModal.value = false
    selectedQuest.value = undefined
  }
  deleting.value = false
}
</script>
