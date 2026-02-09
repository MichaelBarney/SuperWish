<template>
  <div>
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Left Panel: Navigation (desktop) -->
      <div class="hidden md:block w-56 shrink-0">
        <div class="sticky top-8 space-y-1">
          <!-- View buttons -->
          <button
            v-for="view in views"
            :key="view.key"
            @click="currentView = view.key"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="currentView === view.key
              ? 'bg-orange-50 text-orange-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
          >
            <Icon :name="view.icon" class="w-4 h-4" />
            <span class="flex-1 text-left">{{ view.label }}</span>
            <span
              v-if="view.count > 0"
              class="text-xs px-1.5 py-0.5 rounded-full"
              :class="currentView === view.key ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ view.count }}
            </span>
          </button>

          <!-- Quests section -->
          <div v-if="quests.length > 0" class="pt-4">
            <p class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {{ $t('task.sections.quests') }}
            </p>
            <button
              v-for="quest in quests"
              :key="quest.id"
              @click="selectQuestView(quest.id)"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="currentView === 'quest' && selectedQuestId === quest.id
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
            >
              <Icon name="lucide:target" class="w-4 h-4" />
              <span class="flex-1 text-left truncate">{{ quest.name }}</span>
            </button>
          </div>

          <!-- Trips section -->
          <div v-if="trips.length > 0" class="pt-4">
            <p class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {{ $t('task.sections.trips') }}
            </p>
            <button
              v-for="trip in trips"
              :key="trip.id"
              @click="selectTripView(trip.id)"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="currentView === 'trip' && selectedTripId === trip.id
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
            >
              <Icon name="lucide:plane" class="w-4 h-4" />
              <span class="flex-1 text-left truncate">{{ trip.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile: View selector dropdown -->
      <div class="md:hidden">
        <select
          v-model="mobileView"
          @change="handleMobileViewChange"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option v-for="view in views" :key="view.key" :value="view.key">
            {{ view.label }} ({{ view.count }})
          </option>
          <optgroup v-if="quests.length > 0" :label="$t('task.sections.quests')">
            <option v-for="quest in quests" :key="quest.id" :value="'quest:' + quest.id">
              {{ quest.name }}
            </option>
          </optgroup>
          <optgroup v-if="trips.length > 0" :label="$t('task.sections.trips')">
            <option v-for="trip in trips" :key="trip.id" :value="'trip:' + trip.id">
              {{ trip.name }}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Right Panel: Task list -->
      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-bold text-gray-900">{{ currentViewTitle }}</h1>
          <UiButton @click="showCreateModal = true">
            <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
            {{ $t('task.task.newTask') }}
          </UiButton>
        </div>

        <!-- Loading -->
        <div v-if="tasksLoading" class="flex items-center justify-center py-12">
          <Icon name="svg-spinners:ring-resize" class="h-6 w-6 text-orange-500" />
        </div>

        <!-- Task list -->
        <div v-else class="bg-white rounded-xl shadow-soft">
          <TaskList
            :tasks="filteredTasks"
            :quest-names="questNameMap"
            :trip-names="tripNameMap"
            :quest-id="currentView === 'quest' ? selectedQuestId : ''"
            :trip-id="currentView === 'trip' ? selectedTripId : ''"
            :empty-message="currentEmptyMessage"
            @toggle="handleToggle"
            @edit="openEditModal"
            @delete="handleDelete"
            @add="handleQuickAdd"
          />
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <UiModal v-model="showCreateModal" :title="$t('task.task.newTask')">
      <TaskForm
        :quests="quests"
        :trips="trips"
        @submit="handleCreate"
        @cancel="showCreateModal = false"
      />
    </UiModal>

    <!-- Edit Task Modal -->
    <UiModal v-model="showEditModal" :title="$t('task.task.editTask')">
      <TaskForm
        :initial-data="selectedTaskForm"
        :quests="quests"
        :trips="trips"
        @submit="handleUpdate"
        @cancel="showEditModal = false"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { Task, TaskForm } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const { t } = useI18n()

// Set app context
const { setApp } = useAppContext()
onMounted(() => {
  setApp('supertask')
})

// Data
const { tasks, loading: tasksLoading, createTask, updateTask, toggleTaskComplete, deleteTask, inboxTasks, todayTasks, getTasksByQuestId, getTasksByTripId } = useTasks()
const { quests } = useQuests()
const { trips } = useTrips()

// View state
const currentView = ref<'inbox' | 'today' | 'all' | 'quest' | 'trip'>('inbox')
const selectedQuestId = ref('')
const selectedTripId = ref('')
const mobileView = ref('inbox')

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedTask = ref<Task | null>(null)

// Name maps for project labels
const questNameMap = computed(() => {
  const map: Record<string, string> = {}
  quests.value.forEach(q => { map[q.id] = q.name })
  return map
})

const tripNameMap = computed(() => {
  const map: Record<string, string> = {}
  trips.value.forEach(t => { map[t.id] = t.name })
  return map
})

// Views config
const views = computed(() => [
  {
    key: 'inbox' as const,
    label: t('task.views.inbox'),
    icon: 'lucide:inbox',
    count: inboxTasks.value.filter(t => !t.completed).length,
  },
  {
    key: 'today' as const,
    label: t('task.views.today'),
    icon: 'lucide:calendar',
    count: todayTasks.value.filter(t => !t.completed).length,
  },
  {
    key: 'all' as const,
    label: t('task.views.allTasks'),
    icon: 'lucide:list',
    count: tasks.value.filter(t => !t.completed).length,
  },
])

// Filtered tasks based on current view
const filteredTasks = computed(() => {
  switch (currentView.value) {
    case 'inbox':
      return inboxTasks.value
    case 'today':
      return todayTasks.value
    case 'quest':
      return selectedQuestId.value ? getTasksByQuestId(selectedQuestId.value) : []
    case 'trip':
      return selectedTripId.value ? getTasksByTripId(selectedTripId.value) : []
    default:
      return tasks.value
  }
})

const currentViewTitle = computed(() => {
  switch (currentView.value) {
    case 'inbox': return t('task.views.inbox')
    case 'today': return t('task.views.today')
    case 'quest': {
      const quest = quests.value.find(q => q.id === selectedQuestId.value)
      return quest?.name || t('task.sections.quests')
    }
    case 'trip': {
      const trip = trips.value.find(tr => tr.id === selectedTripId.value)
      return trip?.name || t('task.sections.trips')
    }
    default: return t('task.views.allTasks')
  }
})

const currentEmptyMessage = computed(() => {
  switch (currentView.value) {
    case 'inbox': return t('task.empty.inboxDescription')
    case 'today': return t('task.empty.todayDescription')
    default: return t('task.empty.description')
  }
})

const selectedTaskForm = computed(() => {
  if (!selectedTask.value) return undefined
  return {
    title: selectedTask.value.title,
    description: selectedTask.value.description || '',
    questId: selectedTask.value.questId || '',
    subQuestId: selectedTask.value.subQuestId || '',
    tripId: selectedTask.value.tripId || '',
    destinationId: selectedTask.value.destinationId || '',
  }
})

// Navigation helpers
function selectQuestView(questId: string) {
  currentView.value = 'quest'
  selectedQuestId.value = questId
}

function selectTripView(tripId: string) {
  currentView.value = 'trip'
  selectedTripId.value = tripId
}

function handleMobileViewChange() {
  const val = mobileView.value
  if (val.startsWith('quest:')) {
    selectQuestView(val.replace('quest:', ''))
  } else if (val.startsWith('trip:')) {
    selectTripView(val.replace('trip:', ''))
  } else {
    currentView.value = val as 'inbox' | 'today' | 'all'
  }
}

// CRUD handlers
async function handleCreate(data: TaskForm) {
  const result = await createTask(data)
  if (result.success) {
    showCreateModal.value = false
  }
}

async function handleQuickAdd(data: { title: string; questId: string; subQuestId: string; tripId: string; destinationId: string }) {
  await createTask({
    title: data.title,
    description: '',
    questId: data.questId,
    subQuestId: data.subQuestId,
    tripId: data.tripId,
    destinationId: data.destinationId,
  })
}

function openEditModal(task: Task) {
  selectedTask.value = task
  showEditModal.value = true
}

async function handleUpdate(data: TaskForm) {
  if (!selectedTask.value) return
  const result = await updateTask(selectedTask.value.id, data)
  if (result.success) {
    showEditModal.value = false
    selectedTask.value = null
  }
}

async function handleToggle(id: string, completed: boolean) {
  await toggleTaskComplete(id, completed)
}

async function handleDelete(id: string) {
  await deleteTask(id)
}
</script>
