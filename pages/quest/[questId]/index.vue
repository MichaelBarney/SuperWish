<template>
  <div>
    <!-- Loading State -->
    <div v-if="questsLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Quest Not Found -->
    <div v-else-if="!quest" class="text-center py-20">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Quest not found</h2>
      <p class="text-gray-500 mb-6">This quest doesn't exist or you don't have access to it.</p>
      <UiButton to="/quest">
        Back to Quests
      </UiButton>
    </div>

    <!-- Quest Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <NuxtLink to="/quest" class="hover:text-green-600 transition-colors">
            {{ $t('quest.nav.quests') }}
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900">{{ quest.name }}</span>
        </div>

        <!-- Title Row -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ quest.name }}</h1>
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="statusBadgeClass"
              >
                {{ $t(`quest.quests.status.${quest.status}`) }}
              </span>
            </div>
            <p v-if="quest.goal" class="text-gray-600 mt-1 font-medium">{{ quest.goal }}</p>
            <p v-if="quest.description" class="text-gray-500 mt-1">{{ quest.description }}</p>

            <!-- Meta Info -->
            <div class="flex items-center gap-4 mt-3 text-sm">
              <div v-if="dateRange" class="flex items-center gap-1.5 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ dateRange }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UiButton variant="ghost" @click="showEditModal = true">
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {{ $t('common.edit') }}
            </UiButton>
            <UiButton variant="danger" @click="showDeleteModal = true">
              <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {{ $t('common.delete') }}
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow-soft p-4">
          <div class="flex items-center gap-3">
            <QuestProgress :completed="completedCount" :total="subquests.length" />
            <div>
              <p class="text-sm font-medium text-gray-900">
                {{ $t('quest.subquests.progress', { completed: completedCount, total: subquests.length }) }}
              </p>
              <p class="text-xs text-gray-500">{{ $t('quest.subquests.title') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-soft p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon :name="quest.icon || 'lucide:target'" class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ subquests.length }}</p>
              <p class="text-sm text-gray-500">{{ $t('quest.subquests.title') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">{{ $t('task.task.title') }}</h2>
        </div>

        <div class="bg-white rounded-xl shadow-soft">
          <TaskList
            :tasks="questTasks"
            :quest-id="questId"
            @toggle="handleToggleTask"
            @edit="openEditTaskModal"
            @delete="handleDeleteTask"
            @add="handleQuickAddTask"
            @inline-update="handleInlineUpdateTask"
          />
        </div>
      </div>

      <!-- Sub-Quests Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">{{ $t('quest.subquests.title') }}</h2>
          <UiButton v-if="subquests.length > 0" @click="showCreateSubQuestModal = true">
            <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
            {{ $t('quest.subquests.newSubQuest') }}
          </UiButton>
        </div>

        <QuestSubQuestList
          :subquests="subquests"
          :loading="subquestsLoading"
          @create="showCreateSubQuestModal = true"
          @edit="openEditSubQuestModal"
        />
      </div>

    </template>

    <!-- Edit Quest Modal -->
    <UiModal
      v-model="showEditModal"
      :title="$t('quest.quests.editQuest')"
    >
      <QuestForm
        :initial-data="quest || undefined"
        @submit="handleUpdateQuest"
        @cancel="showEditModal = false"
      />
    </UiModal>

    <!-- Delete Quest Confirmation -->
    <UiModal
      v-model="showDeleteModal"
      :title="$t('quest.quests.deleteQuest')"
      size="sm"
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

    <!-- Create Sub-Quest Modal -->
    <UiModal
      v-model="showCreateSubQuestModal"
      :title="$t('quest.subquests.newSubQuest')"
    >
      <QuestSubQuestForm
        @submit="handleCreateSubQuest"
        @cancel="showCreateSubQuestModal = false"
      />
    </UiModal>

    <!-- Edit Sub-Quest Modal -->
    <UiModal
      v-model="showEditSubQuestModal"
      :title="$t('quest.subquests.editSubQuest')"
    >
      <QuestSubQuestForm
        :initial-data="selectedSubQuest || undefined"
        @submit="handleUpdateSubQuest"
        @cancel="showEditSubQuestModal = false"
        @delete="handleDeleteSubQuest"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { QuestForm, SubQuestForm, SubQuest, Task, TaskForm } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const route = useRoute()
const { locale } = useI18n()
const questId = computed(() => route.params.questId as string)

// Set app context to SuperQuest
const { setApp } = useAppContext()
onMounted(() => {
  setApp('superquest')
})

// Quests
const { quests, loading: questsLoading, getQuestById, updateQuest, deleteQuest } = useQuests()
const quest = computed(() => getQuestById(questId.value))

// Sub-Quests
const { subquests, loading: subquestsLoading, createSubQuest, updateSubQuest, deleteSubQuest } = useSubquests(questId)

// Tasks
const { getTasksByQuestId, createTask, updateTask, toggleTaskComplete, deleteTask } = useTasks()
const questTasks = computed(() => getTasksByQuestId(questId.value))

// Progress
const completedCount = computed(() => subquests.value.filter(s => s.status === 'completed').length)

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showCreateSubQuestModal = ref(false)
const showEditSubQuestModal = ref(false)
const showEditTaskModal = ref(false)

// State
const deleting = ref(false)
const selectedSubQuest = ref<SubQuest | null>(null)
const selectedTask = ref<Task | null>(null)

// Computed
const statusBadgeClass = computed(() => {
  switch (quest.value?.status) {
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

const dateRange = computed(() => {
  if (!quest.value) return null
  const { startDate, endDate } = quest.value
  if (!startDate && !endDate) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }

  if (startDate && endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    return `${start.toLocaleDateString(dateLocale, formatOptions)} - ${end.toLocaleDateString(dateLocale, formatOptions)}`
  }

  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    return `Starts ${start.toLocaleDateString(dateLocale, formatOptions)}`
  }

  return null
})

// Handlers
function openEditSubQuestModal(subquest: SubQuest) {
  selectedSubQuest.value = subquest
  showEditSubQuestModal.value = true
}

async function handleUpdateQuest(data: QuestForm) {
  const result = await updateQuest(questId.value, data)
  if (result.success) {
    showEditModal.value = false
  }
}

async function handleDeleteQuest() {
  deleting.value = true
  const result = await deleteQuest(questId.value)
  if (result.success) {
    navigateTo('/quest')
  }
  deleting.value = false
}

async function handleCreateSubQuest(data: SubQuestForm) {
  const result = await createSubQuest(questId.value, data)
  if (result.success) {
    showCreateSubQuestModal.value = false
  }
}

async function handleUpdateSubQuest(data: SubQuestForm) {
  if (!selectedSubQuest.value) return

  const result = await updateSubQuest(selectedSubQuest.value.id, data)
  if (result.success) {
    showEditSubQuestModal.value = false
    selectedSubQuest.value = null
  }
}

async function handleDeleteSubQuest() {
  if (!selectedSubQuest.value) return

  const result = await deleteSubQuest(selectedSubQuest.value.id)
  if (result.success) {
    showEditSubQuestModal.value = false
    selectedSubQuest.value = null
  }
}

// Task handlers
async function handleToggleTask(id: string, completed: boolean) {
  await toggleTaskComplete(id, completed)
}

function openEditTaskModal(task: Task) {
  selectedTask.value = task
  showEditTaskModal.value = true
}

async function handleDeleteTask(id: string) {
  await deleteTask(id)
}

async function handleInlineUpdateTask(id: string, data: { title: string; description: string }) {
  await updateTask(id, data)
}

async function handleQuickAddTask(data: { title: string; description: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string }) {
  await createTask({
    title: data.title,
    description: data.description || '',
    questId: questId.value,
    subQuestId: '',
    tripId: '',
    destinationId: '',
    accommodationId: '',
    experienceId: '',
    wishId: data.wishId || '',
    timeHorizon: '',
    estimatedTime: '',
  })
}
</script>
