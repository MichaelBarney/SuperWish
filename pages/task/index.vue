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

          <!-- Status-grouped sections -->
          <div v-for="group in sidebarGroups" :key="group.key" class="pt-4">
            <p class="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {{ group.label }}
            </p>
            <!-- Quests in this group -->
            <div v-for="quest in group.quests" :key="quest.id">
              <div class="flex items-center">
                <button
                  v-if="getSubquestsByQuestId(quest.id).length > 0"
                  @click="toggleQuestExpand(quest.id)"
                  class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon
                    name="lucide:chevron-right"
                    class="w-3.5 h-3.5 transition-transform"
                    :class="expandedQuestIds[quest.id] ? 'rotate-90' : ''"
                  />
                </button>
                <div v-else class="w-5.5" />
                <button
                  @click="selectQuestView(quest.id)"
                  class="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="currentView === 'quest' && selectedQuestId === quest.id
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
                >
                  <Icon :name="quest.icon || 'lucide:target'" class="w-4 h-4" />
                  <span class="flex-1 text-left truncate">{{ quest.name }}</span>
                </button>
              </div>
              <!-- SubQuests (expanded) -->
              <div v-if="expandedQuestIds[quest.id]" class="ml-5">
                <button
                  v-for="subquest in getSubquestsByQuestId(quest.id)"
                  :key="subquest.id"
                  @click="selectSubQuestView(quest.id, subquest.id)"
                  class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  :class="currentView === 'subquest' && selectedSubQuestId === subquest.id
                    ? 'bg-orange-50 text-orange-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
                >
                  <Icon name="lucide:circle-dot" class="w-3.5 h-3.5" />
                  <span class="flex-1 text-left truncate">{{ subquest.name }}</span>
                </button>
              </div>
            </div>
            <!-- Trips in this group -->
            <div v-for="trip in group.trips" :key="trip.id">
              <div class="flex items-center">
                <button
                  v-if="getDestinationsByTripId(trip.id).length > 0"
                  @click="toggleTripExpand(trip.id)"
                  class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon
                    name="lucide:chevron-right"
                    class="w-3.5 h-3.5 transition-transform"
                    :class="expandedTripIds[trip.id] ? 'rotate-90' : ''"
                  />
                </button>
                <div v-else class="w-5.5" />
                <button
                  @click="selectTripView(trip.id)"
                  class="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="currentView === 'trip' && selectedTripId === trip.id
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
                >
                  <Icon name="lucide:plane" class="w-4 h-4" />
                  <span class="flex-1 text-left truncate">{{ trip.name }}</span>
                </button>
              </div>
              <!-- Destinations (expanded) -->
              <div v-if="expandedTripIds[trip.id]" class="ml-5">
                <button
                  v-for="destination in getDestinationsByTripId(trip.id)"
                  :key="destination.id"
                  @click="selectDestinationView(trip.id, destination.id)"
                  class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                  :class="currentView === 'destination' && selectedDestinationId === destination.id
                    ? 'bg-orange-50 text-orange-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
                >
                  <Icon name="lucide:map-pin" class="w-3.5 h-3.5" />
                  <span class="flex-1 text-left truncate">{{ destination.name }}</span>
                </button>
              </div>
            </div>
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
          <optgroup v-for="group in sidebarGroups" :key="group.key" :label="group.label">
            <template v-for="quest in group.quests" :key="quest.id">
              <option :value="'quest:' + quest.id">
                {{ quest.name }}
              </option>
              <option
                v-for="subquest in getSubquestsByQuestId(quest.id)"
                :key="subquest.id"
                :value="'subquest:' + quest.id + ':' + subquest.id"
              >
                &nbsp;&nbsp;&nbsp;&nbsp;{{ subquest.name }}
              </option>
            </template>
            <template v-for="trip in group.trips" :key="trip.id">
              <option :value="'trip:' + trip.id">
                {{ trip.name }}
              </option>
              <option
                v-for="destination in getDestinationsByTripId(trip.id)"
                :key="destination.id"
                :value="'destination:' + trip.id + ':' + destination.id"
              >
                &nbsp;&nbsp;&nbsp;&nbsp;{{ destination.name }}
              </option>
            </template>
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
        <div v-else>
          <!-- Sectioned view for quest/trip with subquests/destinations -->
          <div v-if="showSectionedView && activeSections.length > 0" class="space-y-2">
            <div
              v-for="(section, idx) in activeSections"
              :key="section.id"
              class="bg-white rounded-xl shadow-soft"
            >
              <div class="flex items-center gap-2 px-4 pt-3 pb-1">
                <Icon v-if="section.icon" :name="section.icon" class="w-3.5 h-3.5 text-gray-400" />
                <span class="text-sm font-bold text-gray-700">{{ section.label }}</span>
              </div>
              <TaskList
                :tasks="section.tasks"
                :quest-names="questNameMap"
                :quest-icons="questIconMap"
                :trip-names="tripNameMap"
                :quest-id="section.questId"
                :sub-quest-id="section.subQuestId"
                :trip-id="section.tripId"
                :destination-id="section.destinationId"
                @toggle="handleToggle"
                @edit="openEditModal"
                @delete="handleDelete"
                @add="handleQuickAdd"
              />
            </div>
          </div>

          <!-- Flat view for inbox/today/all/subquest/destination or quest/trip without children -->
          <div v-else class="bg-white rounded-xl shadow-soft">
            <TaskList
              :tasks="filteredTasks"
              :quest-names="questNameMap"
              :quest-icons="questIconMap"
              :trip-names="tripNameMap"
              :quest-id="currentView === 'quest' || currentView === 'subquest' ? selectedQuestId : ''"
              :sub-quest-id="currentView === 'subquest' ? selectedSubQuestId : ''"
              :trip-id="currentView === 'trip' || currentView === 'destination' ? selectedTripId : ''"
              :destination-id="currentView === 'destination' ? selectedDestinationId : ''"
              :empty-message="currentEmptyMessage"
              @toggle="handleToggle"
              @edit="openEditModal"
              @delete="handleDelete"
              @add="handleQuickAdd"
            />
          </div>
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
const { tasks, loading: tasksLoading, createTask, updateTask, toggleTaskComplete, deleteTask, inboxTasks, todayTasks, getTasksByQuestId, getTasksByTripId, getTasksBySubQuestId, getTasksByDestinationId, getDirectQuestTasks, getDirectTripTasks } = useTasks()
const { quests } = useQuests()
const { trips } = useTrips()
const { getSubquestsByQuestId } = useAllSubquests()
const { getDestinationsByTripId } = useAllDestinations()

// View state
const currentView = ref<'inbox' | 'today' | 'all' | 'quest' | 'trip' | 'subquest' | 'destination'>('inbox')
const selectedQuestId = ref('')
const selectedTripId = ref('')
const selectedSubQuestId = ref('')
const selectedDestinationId = ref('')
const mobileView = ref('inbox')

// Expand state for sidebar tree
const expandedQuestIds = ref<Record<string, boolean>>({})
const expandedTripIds = ref<Record<string, boolean>>({})

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

const questIconMap = computed(() => {
  const map: Record<string, string> = {}
  quests.value.forEach(q => { if (q.icon) map[q.id] = q.icon })
  return map
})

const tripNameMap = computed(() => {
  const map: Record<string, string> = {}
  trips.value.forEach(t => { map[t.id] = t.name })
  return map
})

// Sidebar groups by status
const sidebarGroups = computed(() => {
  const groups: Array<{ key: string; label: string; quests: typeof quests.value; trips: typeof trips.value }> = []
  const ongoingQ = quests.value.filter(q => q.status === 'in_progress')
  const ongoingT = trips.value.filter(t => t.status === 'active' || t.status === 'upcoming')
  if (ongoingQ.length || ongoingT.length) {
    groups.push({ key: 'ongoing', label: t('task.sections.ongoing'), quests: ongoingQ, trips: ongoingT })
  }
  const planningQ = quests.value.filter(q => q.status === 'planning')
  const planningT = trips.value.filter(t => t.status === 'planning')
  if (planningQ.length || planningT.length) {
    groups.push({ key: 'planning', label: t('task.sections.planning'), quests: planningQ, trips: planningT })
  }
  return groups
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
    case 'subquest':
      return selectedSubQuestId.value ? getTasksBySubQuestId(selectedSubQuestId.value) : []
    case 'destination':
      return selectedDestinationId.value ? getTasksByDestinationId(selectedDestinationId.value) : []
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
    case 'subquest': {
      const subquests = selectedQuestId.value ? getSubquestsByQuestId(selectedQuestId.value) : []
      const subquest = subquests.find(s => s.id === selectedSubQuestId.value)
      return subquest?.name || t('task.sections.subquests')
    }
    case 'destination': {
      const destinations = selectedTripId.value ? getDestinationsByTripId(selectedTripId.value) : []
      const destination = destinations.find(d => d.id === selectedDestinationId.value)
      return destination?.name || t('task.sections.destinations')
    }
    default: return t('task.views.allTasks')
  }
})

// Sectioned view
const showSectionedView = computed(() => currentView.value === 'quest' || currentView.value === 'trip')

const questSections = computed(() => {
  if (currentView.value !== 'quest' || !selectedQuestId.value) return []
  const subquests = getSubquestsByQuestId(selectedQuestId.value)
  // If no subquests, don't show sections — just use flat list
  if (subquests.length === 0) return []
  const sections: Array<{ id: string; label: string; icon: string; tasks: Task[]; questId: string; subQuestId: string; tripId: string; destinationId: string }> = []
  // General section (direct quest tasks)
  sections.push({
    id: 'general',
    label: t('task.sections.general'),
    icon: '',
    tasks: getDirectQuestTasks(selectedQuestId.value),
    questId: selectedQuestId.value,
    subQuestId: '',
    tripId: '',
    destinationId: '',
  })
  // One section per subquest
  for (const sq of subquests) {
    sections.push({
      id: sq.id,
      label: sq.name,
      icon: 'lucide:circle-dot',
      tasks: getTasksBySubQuestId(sq.id),
      questId: selectedQuestId.value,
      subQuestId: sq.id,
      tripId: '',
      destinationId: '',
    })
  }
  return sections
})

const tripSections = computed(() => {
  if (currentView.value !== 'trip' || !selectedTripId.value) return []
  const destinations = getDestinationsByTripId(selectedTripId.value)
  // If no destinations, don't show sections — just use flat list
  if (destinations.length === 0) return []
  const sections: Array<{ id: string; label: string; icon: string; tasks: Task[]; questId: string; subQuestId: string; tripId: string; destinationId: string }> = []
  // General section (direct trip tasks)
  sections.push({
    id: 'general',
    label: t('task.sections.general'),
    icon: '',
    tasks: getDirectTripTasks(selectedTripId.value),
    questId: '',
    subQuestId: '',
    tripId: selectedTripId.value,
    destinationId: '',
  })
  // One section per destination
  for (const dest of destinations) {
    sections.push({
      id: dest.id,
      label: dest.name,
      icon: 'lucide:map-pin',
      tasks: getTasksByDestinationId(dest.id),
      questId: '',
      subQuestId: '',
      tripId: selectedTripId.value,
      destinationId: dest.id,
    })
  }
  return sections
})

const activeSections = computed(() => {
  if (currentView.value === 'quest') return questSections.value
  if (currentView.value === 'trip') return tripSections.value
  return []
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
    wishId: selectedTask.value.wishId || '',
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

function selectSubQuestView(questId: string, subQuestId: string) {
  currentView.value = 'subquest'
  selectedQuestId.value = questId
  selectedSubQuestId.value = subQuestId
  expandedQuestIds.value[questId] = true
}

function selectDestinationView(tripId: string, destinationId: string) {
  currentView.value = 'destination'
  selectedTripId.value = tripId
  selectedDestinationId.value = destinationId
  expandedTripIds.value[tripId] = true
}

function toggleQuestExpand(questId: string) {
  expandedQuestIds.value[questId] = !expandedQuestIds.value[questId]
}

function toggleTripExpand(tripId: string) {
  expandedTripIds.value[tripId] = !expandedTripIds.value[tripId]
}

function handleMobileViewChange() {
  const val = mobileView.value
  if (val.startsWith('subquest:')) {
    const parts = val.split(':')
    selectSubQuestView(parts[1], parts[2])
  } else if (val.startsWith('destination:')) {
    const parts = val.split(':')
    selectDestinationView(parts[1], parts[2])
  } else if (val.startsWith('quest:')) {
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

async function handleQuickAdd(data: { title: string; questId: string; subQuestId: string; tripId: string; destinationId: string; wishId: string }) {
  await createTask({
    title: data.title,
    description: '',
    questId: data.questId,
    subQuestId: data.subQuestId,
    tripId: data.tripId,
    destinationId: data.destinationId,
    wishId: data.wishId,
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
