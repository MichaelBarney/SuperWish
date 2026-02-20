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

          <!-- Missions section -->
          <div v-if="hasMissions" class="pt-5">
            <p class="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {{ $t('task.sidebar.missions') }}
            </p>

            <!-- Status-grouped sub-sections -->
            <div v-for="group in sidebarGroups" :key="group.key" class="mt-1">
              <button
                @click="toggleSectionExpand(group.key)"
                class="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
              >
                <Icon
                  name="lucide:chevron-right"
                  class="w-3 h-3 transition-transform"
                  :class="expandedSectionKeys[group.key] ? 'rotate-90' : ''"
                />
                <Icon
                  :name="group.icon"
                  class="w-3 h-3"
                  :class="group.iconClass"
                />
                {{ group.label }}
                <span v-if="dragItems[group.key]?.length" class="text-[10px] text-gray-400 font-normal ml-auto">{{ dragItems[group.key].length }}</span>
              </button>

              <div v-if="expandedSectionKeys[group.key]" class="ml-4 pl-1 border-l-2" :class="group.borderClass">
                <draggable
                  v-model="dragItems[group.key]"
                  group="missions"
                  :item-key="(item: any) => `${item.type}-${item.id}`"
                  @change="(evt: any) => onMissionDragChange(evt, group.key)"
                  ghost-class="opacity-50"
                  drag-class="shadow-lg"
                  :animation="150"
                  class="min-h-[4px]"
                >
                  <template #item="{ element }">
                    <div>
                      <!-- Quest item -->
                      <template v-if="element.type === 'quest'">
                        <div class="flex items-center cursor-grab active:cursor-grabbing">
                          <div class="w-[22px] shrink-0 flex items-center justify-center">
                            <button
                              v-if="getSubquestsByQuestId(element.id).length > 0"
                              @click.stop="toggleQuestExpand(element.id)"
                              class="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Icon
                                name="lucide:chevron-right"
                                class="w-3.5 h-3.5 transition-transform"
                                :class="expandedQuestIds[element.id] ? 'rotate-90' : ''"
                              />
                            </button>
                          </div>
                          <button
                            @click="selectQuestView(element.id)"
                            class="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                            :class="currentView === 'quest' && selectedQuestId === element.id
                              ? 'bg-orange-50 text-orange-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
                          >
                            <Icon :name="element.icon" class="w-4 h-4" />
                            <span class="flex-1 text-left truncate">{{ element.name }}</span>
                          </button>
                        </div>
                        <!-- SubQuests (expanded) -->
                        <div v-if="expandedQuestIds[element.id]" class="ml-5">
                          <button
                            v-for="subquest in getSubquestsByQuestId(element.id)"
                            :key="subquest.id"
                            @click="selectSubQuestView(element.id, subquest.id)"
                            class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            :class="currentView === 'subquest' && selectedSubQuestId === subquest.id
                              ? 'bg-orange-50 text-orange-700 font-medium'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
                          >
                            <Icon name="lucide:circle-dot" class="w-3.5 h-3.5" />
                            <span class="flex-1 text-left truncate">{{ subquest.name }}</span>
                          </button>
                        </div>
                      </template>

                      <!-- Trip item -->
                      <template v-else>
                        <div class="flex items-center cursor-grab active:cursor-grabbing">
                          <div class="w-[22px] shrink-0 flex items-center justify-center">
                            <button
                              v-if="getDestinationsByTripId(element.id).length > 0 || getSubquestsByTripId(element.id).length > 0"
                              @click.stop="toggleTripExpand(element.id)"
                              class="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Icon
                                name="lucide:chevron-right"
                                class="w-3.5 h-3.5 transition-transform"
                                :class="expandedTripIds[element.id] ? 'rotate-90' : ''"
                              />
                            </button>
                          </div>
                          <button
                            @click="selectTripView(element.id)"
                            class="flex-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors"
                            :class="currentView === 'trip' && selectedTripId === element.id
                              ? 'bg-orange-50 text-orange-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
                          >
                            <Icon name="lucide:plane" class="w-4 h-4" />
                            <span class="flex-1 text-left truncate">{{ element.name }}</span>
                          </button>
                        </div>
                        <!-- SubQuests & Destinations (expanded) -->
                        <div v-if="expandedTripIds[element.id]" class="ml-5">
                          <button
                            v-for="subquest in getSubquestsByTripId(element.id)"
                            :key="subquest.id"
                            @click="selectTripSubQuestView(element.id, subquest.id)"
                            class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            :class="currentView === 'subquest' && selectedSubQuestId === subquest.id && selectedTripId === element.id
                              ? 'bg-orange-50 text-orange-700 font-medium'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
                          >
                            <Icon name="lucide:circle-dot" class="w-3.5 h-3.5" />
                            <span class="flex-1 text-left truncate">{{ subquest.name }}</span>
                          </button>
                          <button
                            v-for="destination in getDestinationsByTripId(element.id)"
                            :key="destination.id"
                            @click="selectDestinationView(element.id, destination.id)"
                            class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                            :class="currentView === 'destination' && selectedDestinationId === destination.id
                              ? 'bg-orange-50 text-orange-700 font-medium'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
                          >
                            <Icon name="lucide:map-pin" class="w-3.5 h-3.5" />
                            <span class="flex-1 text-left truncate">{{ destination.name }}</span>
                          </button>
                        </div>
                      </template>
                    </div>
                  </template>
                </draggable>
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
            <template v-for="item in group.items" :key="`${item.type}-${item.id}`">
              <template v-if="item.type === 'quest'">
                <option :value="'quest:' + item.id">
                  {{ item.name }}
                </option>
                <option
                  v-for="subquest in getSubquestsByQuestId(item.id)"
                  :key="subquest.id"
                  :value="'subquest:' + item.id + ':' + subquest.id"
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;{{ subquest.name }}
                </option>
              </template>
              <template v-else>
                <option :value="'trip:' + item.id">
                  {{ item.name }}
                </option>
                <option
                  v-for="subquest in getSubquestsByTripId(item.id)"
                  :key="subquest.id"
                  :value="'tripsubquest:' + item.id + ':' + subquest.id"
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;{{ subquest.name }}
                </option>
                <option
                  v-for="destination in getDestinationsByTripId(item.id)"
                  :key="destination.id"
                  :value="'destination:' + item.id + ':' + destination.id"
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;{{ destination.name }}
                </option>
              </template>
            </template>
          </optgroup>
        </select>
        <!-- Mobile: Group By toggle -->
        <div v-if="isTimeHorizonView" class="flex items-center gap-2 mt-2">
          <button
            @click="setTaskGroupBy(taskGroupBy === 'none' ? 'project' : 'none')"
            class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors"
            :class="taskGroupBy === 'project'
              ? 'border-orange-300 bg-orange-50 text-orange-700'
              : 'border-gray-300 text-gray-500 hover:bg-gray-50'"
          >
            <Icon name="lucide:layers" class="w-3.5 h-3.5" />
            {{ $t('task.groupBy.label') }}: {{ taskGroupBy === 'project' ? $t('task.groupBy.project') : $t('task.groupBy.none') }}
          </button>
        </div>
      </div>

      <!-- Right Panel: Task list -->
      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 min-w-0">
            <!-- Inline name editing for quest/trip views -->
            <template v-if="editingEntityName">
              <input
                ref="entityNameInput"
                v-model="editEntityNameValue"
                class="text-xl font-bold text-gray-900 border-b-2 border-orange-400 bg-transparent outline-none px-0 py-0 min-w-0"
                @keydown.enter="saveEntityName"
                @keydown.escape="cancelEditEntityName"
                @blur="saveEntityName"
              />
              <button @click="saveEntityName" class="text-gray-400 hover:text-green-600 transition-colors">
                <Icon name="lucide:check" class="w-4 h-4" />
              </button>
              <button @mousedown.prevent="cancelEditEntityName" class="text-gray-400 hover:text-red-500 transition-colors">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </template>
            <template v-else>
              <h1 class="text-xl font-bold text-gray-900 truncate">{{ currentViewTitle }}</h1>
              <button
                v-if="currentView === 'quest' && selectedQuestId"
                @click="startEditEntityName"
                class="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <Icon name="lucide:pencil" class="w-4 h-4" />
              </button>
              <NuxtLink
                v-if="currentView === 'quest' && selectedQuestId"
                :to="'/quest/' + selectedQuestId"
                class="text-gray-400 hover:text-orange-600 transition-colors shrink-0"
              >
                <Icon name="lucide:external-link" class="w-4 h-4" />
              </NuxtLink>
              <button
                v-if="currentView === 'trip' && selectedTripId"
                @click="startEditEntityName"
                class="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <Icon name="lucide:pencil" class="w-4 h-4" />
              </button>
              <NuxtLink
                v-if="currentView === 'trip' && selectedTripId"
                :to="'/trip/' + selectedTripId"
                class="text-gray-400 hover:text-orange-600 transition-colors shrink-0"
              >
                <Icon name="lucide:external-link" class="w-4 h-4" />
              </NuxtLink>
            </template>
          </div>
          <div class="flex items-center gap-2">
            <!-- Group By dropdown (desktop) -->
            <div v-if="isTimeHorizonView" class="relative hidden md:block">
              <button
                @click="showGroupByDropdown = !showGroupByDropdown"
                class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg border transition-colors"
                :class="taskGroupBy === 'project'
                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'"
              >
                <Icon name="lucide:layers" class="w-4 h-4" />
                <span>{{ $t('task.groupBy.label') }}</span>
                <Icon name="lucide:chevron-down" class="w-3 h-3" />
              </button>
              <div v-if="showGroupByDropdown" class="fixed inset-0 z-10" @click="showGroupByDropdown = false" />
              <div
                v-if="showGroupByDropdown"
                class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
              >
                <button
                  @click="setTaskGroupBy('none')"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  :class="taskGroupBy === 'none' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'"
                >
                  <Icon name="lucide:list" class="w-4 h-4" />
                  {{ $t('task.groupBy.none') }}
                </button>
                <button
                  @click="setTaskGroupBy('project')"
                  class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  :class="taskGroupBy === 'project' ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-50'"
                >
                  <Icon name="lucide:folder" class="w-4 h-4" />
                  {{ $t('task.groupBy.project') }}
                </button>
              </div>
            </div>
            <UiButton @click="showCreateModal = true">
              <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
              {{ $t('task.task.newTask') }}
            </UiButton>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="tasksLoading" class="flex items-center justify-center py-12">
          <Icon name="svg-spinners:ring-resize" class="h-6 w-6 text-orange-500" />
        </div>

        <!-- Task list -->
        <div v-else>
          <!-- Hierarchical project grouping for time horizon views -->
          <div v-if="isTimeHorizonView && taskGroupBy === 'project' && groupedByProjectSections.length > 0" class="space-y-6">
            <div v-for="project in groupedByProjectSections" :key="project.id">
              <!-- Project header -->
              <div class="flex items-center gap-2 px-1 mb-2">
                <Icon :name="project.icon" class="w-4 h-4 text-gray-500" />
                <span class="text-sm font-bold text-gray-800">{{ project.label }}</span>
              </div>
              <!-- Sub-sections -->
              <div class="space-y-2">
                <div v-for="child in project.children" :key="child.id" class="bg-white rounded-xl shadow-soft">
                  <div v-if="child.label" class="flex items-center gap-2 px-4 pt-3 pb-1">
                    <Icon v-if="child.icon" :name="child.icon" class="w-3.5 h-3.5 text-gray-400" />
                    <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ child.label }}</span>
                  </div>
                  <TaskList
                    :tasks="child.tasks"
                    :all-tasks="tasks"
                    :quest-names="questNameMap"
                    :quest-icons="questIconMap"
                    :trip-names="tripNameMap"
                    :quest-id="child.questId"
                    :sub-quest-id="child.subQuestId"
                    :trip-id="child.tripId"
                    :destination-id="child.destinationId"
                    @toggle="handleToggle"
                    @edit="openEditModal"
                    @delete="handleDelete"
                    @add="handleQuickAdd"
                    @inline-update="handleInlineUpdate"
                    @update-time-horizon="handleUpdateTimeHorizon"
                    @update-estimated-time="handleUpdateEstimatedTime"
                    @update-blocked-by="handleUpdateBlockedBy"
                @update-due-date="handleUpdateDueDate"
                @update-recurrence="handleUpdateRecurrence"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Sectioned view for quest/trip with subquests/destinations -->
          <div v-else-if="showSectionedView && activeSections.length > 0" class="space-y-2">
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
                :all-tasks="tasks"
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
                @inline-update="handleInlineUpdate"
                @update-time-horizon="handleUpdateTimeHorizon"
                @update-estimated-time="handleUpdateEstimatedTime"
                @update-blocked-by="handleUpdateBlockedBy"
                @update-due-date="handleUpdateDueDate"
                @update-recurrence="handleUpdateRecurrence"
              />
            </div>
            <!-- Add Sub-Quest button for trips and quests -->
            <div v-if="(currentView === 'trip' && selectedTripId) || (currentView === 'quest' && selectedQuestId)" class="pt-1">
              <form
                v-if="showAddSubQuestInput"
                @submit.prevent="handleAddSubQuest"
                class="flex items-center gap-2"
              >
                <input
                  v-model="newSubQuestName"
                  ref="subQuestInput"
                  type="text"
                  :placeholder="$t('quest.subquests.form.namePlaceholder')"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  @keydown.escape="showAddSubQuestInput = false"
                />
                <UiButton type="submit" :disabled="!newSubQuestName.trim()">
                  {{ $t('common.add') }}
                </UiButton>
                <button
                  type="button"
                  @click="showAddSubQuestInput = false"
                  class="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Icon name="lucide:x" class="w-4 h-4" />
                </button>
              </form>
              <button
                v-else
                @click="openAddSubQuestInput"
                class="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-orange-600 transition-colors"
              >
                <Icon name="lucide:plus" class="w-4 h-4" />
                {{ $t('task.sections.addSubQuest') }}
              </button>
            </div>
          </div>

          <!-- Flat view for inbox/today/all/subquest/destination or quest/trip without children -->
          <div v-else>
            <div class="bg-white rounded-xl shadow-soft">
              <TaskList
                :tasks="filteredTasks"
                :all-tasks="tasks"
                :quest-names="questNameMap"
                :quest-icons="questIconMap"
                :trip-names="tripNameMap"
                :quest-id="currentView === 'quest' || (currentView === 'subquest' && selectedQuestId) ? selectedQuestId : ''"
                :sub-quest-id="currentView === 'subquest' ? selectedSubQuestId : ''"
                :trip-id="currentView === 'trip' || currentView === 'destination' || (currentView === 'subquest' && selectedTripId && !selectedQuestId) ? selectedTripId : ''"
                :destination-id="currentView === 'destination' ? selectedDestinationId : ''"
                :empty-message="currentEmptyMessage"
                @toggle="handleToggle"
                @edit="openEditModal"
                @delete="handleDelete"
                @add="handleQuickAdd"
                @inline-update="handleInlineUpdate"
                @update-time-horizon="handleUpdateTimeHorizon"
                @update-estimated-time="handleUpdateEstimatedTime"
                @update-blocked-by="handleUpdateBlockedBy"
                @update-due-date="handleUpdateDueDate"
                @update-recurrence="handleUpdateRecurrence"
              />
            </div>
            <!-- Add Sub-Quest button for trips and quests (flat view) -->
            <div v-if="(currentView === 'trip' && selectedTripId) || (currentView === 'quest' && selectedQuestId)" class="pt-2">
              <form
                v-if="showAddSubQuestInput"
                @submit.prevent="handleAddSubQuest"
                class="flex items-center gap-2"
              >
                <input
                  v-model="newSubQuestName"
                  ref="subQuestInput"
                  type="text"
                  :placeholder="$t('quest.subquests.form.namePlaceholder')"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  @keydown.escape="showAddSubQuestInput = false"
                />
                <UiButton type="submit" :disabled="!newSubQuestName.trim()">
                  {{ $t('common.add') }}
                </UiButton>
                <button
                  type="button"
                  @click="showAddSubQuestInput = false"
                  class="text-gray-400 hover:text-gray-600 p-1"
                >
                  <Icon name="lucide:x" class="w-4 h-4" />
                </button>
              </form>
              <button
                v-else
                @click="openAddSubQuestInput"
                class="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-orange-600 transition-colors"
              >
                <Icon name="lucide:plus" class="w-4 h-4" />
                {{ $t('task.sections.addSubQuest') }}
              </button>
            </div>
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
import type { Task, TaskForm, TaskTimeHorizon, TaskEstimatedTime, TaskGroupBy, QuestStatus, TripStatus } from '~/types'
import { computeTimeHorizonFromDate } from '~/utils/taskDueDate'
import draggable from 'vuedraggable'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Set app context
const { setApp } = useAppContext()
onMounted(() => {
  setApp('supertask')
})

// Data
const { tasks, loading: tasksLoading, createTask, updateTask, updateTaskTimeHorizon, updateTaskEstimatedTime, updateTaskDueDate, updateTaskBlockedBy, updateTaskRecurrence, toggleTaskComplete, deleteTask, inboxTasks, todayHorizonTasks, thisWeekTasks, thisMonthTasks, longTermTasks, noHorizonTasks, getTasksByQuestId, getTasksByTripId, getTasksBySubQuestId, getTasksByDestinationId, getDirectQuestTasks, getDirectTripTasks } = useTasks()
const { quests, updateQuest, updateQuestStatus } = useQuests()
const { trips, updateTrip, updateTripStatus } = useTrips()
const { subquests: allSubquests, getSubquestsByQuestId, getSubquestsByTripId, createSubQuestForTrip, createSubQuestForQuest } = useAllSubquests()
const { destinations: allDestinations, getDestinationsByTripId } = useAllDestinations()
const { user: authUser, updateUserPreferences } = useAuth()

// Group By state
const taskGroupBy = ref<TaskGroupBy>('none')
const showGroupByDropdown = ref(false)

// Sync from Firestore when auth resolves
watch(authUser, (u) => {
  if (u?.taskGroupBy) {
    taskGroupBy.value = u.taskGroupBy
    localStorage.setItem('taskGroupBy', u.taskGroupBy)
  }
}, { immediate: true })

// Fast fallback from localStorage on mount
onMounted(() => {
  const stored = localStorage.getItem('taskGroupBy') as TaskGroupBy | null
  if (stored && (stored === 'none' || stored === 'project')) {
    taskGroupBy.value = stored
  }
})

function setTaskGroupBy(value: TaskGroupBy) {
  taskGroupBy.value = value
  showGroupByDropdown.value = false
  localStorage.setItem('taskGroupBy', value)
  updateUserPreferences({ taskGroupBy: value })
}

// View state
type ViewType = 'inbox' | 'today' | 'this_week' | 'this_month' | 'long_term' | 'no_horizon' | 'quest' | 'trip' | 'subquest' | 'destination'
const validViews: ViewType[] = ['inbox', 'today', 'this_week', 'this_month', 'long_term', 'no_horizon']

// Parse initial view from entity-based query params
function parseInitialView(): { view: ViewType; questId: string; tripId: string; subQuestId: string; destinationId: string } {
  const q = route.query
  if (q.subquest && q.quest) {
    return { view: 'subquest', questId: q.quest as string, tripId: '', subQuestId: q.subquest as string, destinationId: '' }
  }
  if (q.subquest && q.trip) {
    return { view: 'subquest', questId: '', tripId: q.trip as string, subQuestId: q.subquest as string, destinationId: '' }
  }
  if (q.destination && q.trip) {
    return { view: 'destination', questId: '', tripId: q.trip as string, subQuestId: '', destinationId: q.destination as string }
  }
  if (q.quest) {
    return { view: 'quest', questId: q.quest as string, tripId: '', subQuestId: '', destinationId: '' }
  }
  if (q.trip) {
    return { view: 'trip', questId: '', tripId: q.trip as string, subQuestId: '', destinationId: '' }
  }
  const viewParam = q.view as ViewType
  if (validViews.includes(viewParam)) {
    return { view: viewParam, questId: '', tripId: '', subQuestId: '', destinationId: '' }
  }
  return { view: 'inbox', questId: '', tripId: '', subQuestId: '', destinationId: '' }
}

const initialState = parseInitialView()
const currentView = ref<ViewType>(initialState.view)
const selectedQuestId = ref(initialState.questId)
const selectedTripId = ref(initialState.tripId)
const selectedSubQuestId = ref(initialState.subQuestId)
const selectedDestinationId = ref(initialState.destinationId)
const mobileView = ref(
  initialState.view === 'quest' ? `quest:${initialState.questId}`
  : initialState.view === 'trip' ? `trip:${initialState.tripId}`
  : initialState.view === 'subquest' && initialState.questId ? `subquest:${initialState.questId}:${initialState.subQuestId}`
  : initialState.view === 'subquest' && initialState.tripId ? `tripsubquest:${initialState.tripId}:${initialState.subQuestId}`
  : initialState.view === 'destination' ? `destination:${initialState.tripId}:${initialState.destinationId}`
  : initialState.view as string
)

// Sync view state to URL query params
const isUpdatingUrl = ref(false)
watch([currentView, selectedQuestId, selectedTripId, selectedSubQuestId, selectedDestinationId], () => {
  if (isUpdatingUrl.value) return
  isUpdatingUrl.value = true
  const v = currentView.value
  let query: Record<string, string> = {}
  if (v === 'quest' && selectedQuestId.value) {
    query = { quest: selectedQuestId.value }
  } else if (v === 'trip' && selectedTripId.value) {
    query = { trip: selectedTripId.value }
  } else if (v === 'subquest' && selectedSubQuestId.value && selectedQuestId.value) {
    query = { subquest: selectedSubQuestId.value, quest: selectedQuestId.value }
  } else if (v === 'subquest' && selectedSubQuestId.value && selectedTripId.value) {
    query = { subquest: selectedSubQuestId.value, trip: selectedTripId.value }
  } else if (v === 'destination' && selectedDestinationId.value && selectedTripId.value) {
    query = { destination: selectedDestinationId.value, trip: selectedTripId.value }
  } else if (validViews.includes(v)) {
    query = v === 'inbox' ? {} : { view: v }
  }
  router.replace({ query }).finally(() => {
    isUpdatingUrl.value = false
  })
})

// Expand state for sidebar section groups
const expandedSectionKeys = ref<Record<string, boolean>>({
  ongoing: true,
  on_hold: true,
  planning: true,
  completed: false,
})

function toggleSectionExpand(key: string) {
  expandedSectionKeys.value[key] = !expandedSectionKeys.value[key]
}

// Expand state for sidebar tree
const expandedQuestIds = ref<Record<string, boolean>>({})
const expandedTripIds = ref<Record<string, boolean>>({})

// Expand sidebar tree for restored entity selections from URL
if (initialState.questId && initialState.view === 'subquest') {
  expandedQuestIds.value[initialState.questId] = true
}
if (initialState.tripId && (initialState.view === 'subquest' || initialState.view === 'destination')) {
  expandedTripIds.value[initialState.tripId] = true
}

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedTask = ref<Task | null>(null)

// Inline entity name editing
const editingEntityName = ref(false)
const editEntityNameValue = ref('')
const entityNameInput = ref<HTMLInputElement | null>(null)

function startEditEntityName() {
  editEntityNameValue.value = currentViewTitle.value
  editingEntityName.value = true
  nextTick(() => {
    entityNameInput.value?.focus()
    entityNameInput.value?.select()
  })
}

function cancelEditEntityName() {
  editingEntityName.value = false
  editEntityNameValue.value = ''
}

async function saveEntityName() {
  if (!editingEntityName.value) return
  const newName = editEntityNameValue.value.trim()
  if (!newName) {
    cancelEditEntityName()
    return
  }
  if (currentView.value === 'quest' && selectedQuestId.value) {
    await updateQuest(selectedQuestId.value, { name: newName })
  } else if (currentView.value === 'trip' && selectedTripId.value) {
    await updateTrip(selectedTripId.value, { name: newName })
  }
  editingEntityName.value = false
  editEntityNameValue.value = ''
}

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

const subquestNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const sq of allSubquests.value) map[sq.id] = sq.name
  return map
})

const destinationNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const dest of allDestinations.value) map[dest.id] = dest.name
  return map
})

// Unified sidebar mission item type
interface SidebarMissionItem {
  type: 'quest' | 'trip'
  id: string
  name: string
  icon: string
  hasChildren: boolean
  sidebarOrder?: number
  sortDate?: Date | null
}

// Sidebar groups by status
const sidebarGroupDefs = [
  { key: 'ongoing', questStatuses: ['in_progress'], tripStatuses: ['active', 'upcoming'], icon: 'lucide:play', iconClass: 'text-green-500', borderClass: 'border-green-300' },
  { key: 'on_hold', questStatuses: ['on_hold'], tripStatuses: [] as string[], icon: 'lucide:pause', iconClass: 'text-amber-500', borderClass: 'border-amber-300' },
  { key: 'planning', questStatuses: ['planning'], tripStatuses: ['planning'], icon: 'lucide:compass', iconClass: 'text-gray-400', borderClass: 'border-gray-300' },
  { key: 'completed', questStatuses: ['completed'], tripStatuses: ['completed'], icon: 'lucide:circle-check', iconClass: 'text-emerald-500', borderClass: 'border-emerald-300' },
]

const sidebarGroups = computed(() => {
  function byOrderThenDate(a: SidebarMissionItem, b: SidebarMissionItem): number {
    if (a.sidebarOrder != null && b.sidebarOrder != null) return a.sidebarOrder - b.sidebarOrder
    if (a.sidebarOrder != null) return -1
    if (b.sidebarOrder != null) return 1
    const dateA = a.sortDate
    const dateB = b.sortDate
    if (dateA && dateB) return dateA.getTime() - dateB.getTime()
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    return 0
  }

  return sidebarGroupDefs.map(def => {
    const questItems: SidebarMissionItem[] = quests.value
      .filter(q => def.questStatuses.includes(q.status))
      .map(q => ({
        type: 'quest' as const,
        id: q.id,
        name: q.name,
        icon: q.icon || 'lucide:target',
        hasChildren: getSubquestsByQuestId(q.id).length > 0,
        sidebarOrder: q.sidebarOrder,
        sortDate: q.endDate ?? q.startDate ?? null,
      }))

    const tripItems: SidebarMissionItem[] = trips.value
      .filter(tr => def.tripStatuses.includes(tr.status))
      .map(tr => ({
        type: 'trip' as const,
        id: tr.id,
        name: tr.name,
        icon: 'lucide:plane',
        hasChildren: getDestinationsByTripId(tr.id).length > 0 || getSubquestsByTripId(tr.id).length > 0,
        sidebarOrder: tr.sidebarOrder,
        sortDate: tr.endDate ?? tr.startDate ?? null,
      }))

    const items = [...questItems, ...tripItems].sort(byOrderThenDate)

    return {
      key: def.key,
      label: t(`task.sections.${def.key}`),
      icon: def.icon,
      iconClass: def.iconClass,
      borderClass: def.borderClass,
      items,
    }
  })
})

// Whether any missions exist at all (for showing missions header)
const hasMissions = computed(() => quests.value.length > 0 || trips.value.length > 0)

// Mutable drag items synced from computed sidebarGroups
const dragItems = ref<Record<string, SidebarMissionItem[]>>({})
const isDragging = ref(false)

watch(sidebarGroups, (groups) => {
  if (isDragging.value) return
  for (const g of groups) {
    dragItems.value[g.key] = [...g.items]
  }
}, { immediate: true })

// Drag-and-drop: status mapping per group
const groupStatusMap: Record<string, { quest: QuestStatus; trip: TripStatus | null }> = {
  ongoing:   { quest: 'in_progress', trip: 'active' },
  on_hold:   { quest: 'on_hold', trip: null },
  planning:  { quest: 'planning', trip: 'planning' },
  completed: { quest: 'completed', trip: 'completed' },
}

async function onMissionDragChange(evt: any, targetGroupKey: string) {
  isDragging.value = true

  try {
    // Cross-group: item was added to this group
    if (evt.added) {
      const item = evt.added.element as SidebarMissionItem
      const mapping = groupStatusMap[targetGroupKey]
      if (!mapping) return

      if (item.type === 'quest') {
        await updateQuestStatus(item.id, mapping.quest)
      } else if (item.type === 'trip') {
        if (mapping.trip === null) {
          // Trip can't go to on_hold — revert by re-syncing from computed
          const groups = sidebarGroups.value
          for (const g of groups) {
            dragItems.value[g.key] = [...g.items]
          }
          return
        }
        await updateTripStatus(item.id, mapping.trip)
      }
    }

    // Persist sidebarOrder for all items in target group (parallel)
    const items = dragItems.value[targetGroupKey]
    if (items) {
      await Promise.all(items.map((item, i) =>
        item.type === 'quest'
          ? updateQuest(item.id, { sidebarOrder: i } as any)
          : updateTrip(item.id, { sidebarOrder: i } as any)
      ))
    }
  } finally {
    isDragging.value = false
  }
}

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
    label: t('task.timeHorizon.today'),
    icon: 'lucide:sun',
    count: todayHorizonTasks.value.filter(t => !t.completed).length,
  },
  {
    key: 'this_week' as const,
    label: t('task.timeHorizon.thisWeek'),
    icon: 'lucide:calendar-days',
    count: thisWeekTasks.value.filter(t => !t.completed).length,
  },
  {
    key: 'this_month' as const,
    label: t('task.timeHorizon.thisMonth'),
    icon: 'lucide:calendar',
    count: thisMonthTasks.value.filter(t => !t.completed).length,
  },
  {
    key: 'long_term' as const,
    label: t('task.timeHorizon.longTerm'),
    icon: 'lucide:clock',
    count: longTermTasks.value.filter(t => !t.completed).length,
  },
  {
    key: 'no_horizon' as const,
    label: t('task.views.noHorizon'),
    icon: 'lucide:circle-off',
    count: noHorizonTasks.value.filter(t => !t.completed).length,
  },
])

// Filtered tasks based on current view
const filteredTasks = computed(() => {
  switch (currentView.value) {
    case 'inbox':
      return inboxTasks.value
    case 'today':
      return todayHorizonTasks.value
    case 'this_week':
      return thisWeekTasks.value
    case 'this_month':
      return thisMonthTasks.value
    case 'long_term':
      return longTermTasks.value
    case 'no_horizon':
      return noHorizonTasks.value
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
    case 'today': return t('task.timeHorizon.today')
    case 'this_week': return t('task.timeHorizon.thisWeek')
    case 'this_month': return t('task.timeHorizon.thisMonth')
    case 'long_term': return t('task.timeHorizon.longTerm')
    case 'no_horizon': return t('task.views.noHorizon')
    case 'quest': {
      const quest = quests.value.find(q => q.id === selectedQuestId.value)
      return quest?.name || t('task.sections.quests')
    }
    case 'trip': {
      const trip = trips.value.find(tr => tr.id === selectedTripId.value)
      return trip?.name || t('task.sections.trips')
    }
    case 'subquest': {
      const sqFromQuest = selectedQuestId.value ? getSubquestsByQuestId(selectedQuestId.value) : []
      const sqFromTrip = selectedTripId.value ? getSubquestsByTripId(selectedTripId.value) : []
      const allSq = [...sqFromQuest, ...sqFromTrip]
      const subquest = allSq.find(s => s.id === selectedSubQuestId.value)
      return subquest?.name || t('task.sections.subquests')
    }
    case 'destination': {
      const destinations = selectedTripId.value ? getDestinationsByTripId(selectedTripId.value) : []
      const destination = destinations.find(d => d.id === selectedDestinationId.value)
      return destination?.name || t('task.sections.destinations')
    }
    default: return t('task.views.noHorizon')
  }
})

// Group By helpers
const isTimeHorizonView = computed(() =>
  ['inbox', 'today', 'this_week', 'this_month', 'long_term', 'no_horizon'].includes(currentView.value)
)

interface ProjectChild {
  id: string
  label: string
  icon: string
  tasks: Task[]
  questId: string
  subQuestId: string
  tripId: string
  destinationId: string
}

interface ProjectGroup {
  id: string
  label: string
  icon: string
  questId: string
  tripId: string
  children: ProjectChild[]
}

const groupedByProjectSections = computed((): ProjectGroup[] => {
  const taskList = filteredTasks.value
  const projectMap = new Map<string, { id: string; label: string; icon: string; tasks: Task[]; questId: string; tripId: string }>()
  const noProjectTasks: Task[] = []

  for (const task of taskList) {
    if (task.questId) {
      const key = `quest:${task.questId}`
      if (!projectMap.has(key)) {
        const name = questNameMap.value[task.questId] || t('task.sections.quests')
        const icon = questIconMap.value[task.questId] || 'lucide:target'
        projectMap.set(key, { id: key, label: name, icon, tasks: [], questId: task.questId, tripId: '' })
      }
      projectMap.get(key)!.tasks.push(task)
    } else if (task.tripId) {
      const key = `trip:${task.tripId}`
      if (!projectMap.has(key)) {
        const name = tripNameMap.value[task.tripId] || t('task.sections.trips')
        projectMap.set(key, { id: key, label: name, icon: 'lucide:plane', tasks: [], questId: '', tripId: task.tripId })
      }
      projectMap.get(key)!.tasks.push(task)
    } else {
      noProjectTasks.push(task)
    }
  }

  const projects: ProjectGroup[] = []

  for (const group of projectMap.values()) {
    // Skip projects with no uncompleted tasks
    if (!group.tasks.some(tk => !tk.completed)) continue

    // Group tasks by sub-project
    const directTasks: Task[] = []
    const subBuckets = new Map<string, Task[]>()

    for (const tk of group.tasks) {
      if (group.questId && tk.subQuestId) {
        const key = `sq:${tk.subQuestId}`
        if (!subBuckets.has(key)) subBuckets.set(key, [])
        subBuckets.get(key)!.push(tk)
      } else if (group.tripId && tk.destinationId) {
        const key = `dest:${tk.destinationId}`
        if (!subBuckets.has(key)) subBuckets.set(key, [])
        subBuckets.get(key)!.push(tk)
      } else if (group.tripId && tk.subQuestId) {
        const key = `sq:${tk.subQuestId}`
        if (!subBuckets.has(key)) subBuckets.set(key, [])
        subBuckets.get(key)!.push(tk)
      } else {
        directTasks.push(tk)
      }
    }

    const children: ProjectChild[] = []

    if (subBuckets.size > 0) {
      // Multi-bucket: show General + sub-sections
      if (directTasks.some(tk => !tk.completed)) {
        children.push({
          id: `${group.id}:general`,
          label: t('task.sections.general'),
          icon: '',
          tasks: directTasks,
          questId: group.questId,
          subQuestId: '',
          tripId: group.tripId,
          destinationId: '',
        })
      }

      for (const [bucketKey, bucketTasks] of subBuckets) {
        if (!bucketTasks.some(tk => !tk.completed)) continue

        if (bucketKey.startsWith('sq:')) {
          const sqId = bucketKey.slice(3)
          children.push({
            id: `${group.id}:${bucketKey}`,
            label: subquestNameMap.value[sqId] || sqId,
            icon: 'lucide:circle-dot',
            tasks: bucketTasks,
            questId: group.questId,
            subQuestId: sqId,
            tripId: group.tripId,
            destinationId: '',
          })
        } else if (bucketKey.startsWith('dest:')) {
          const destId = bucketKey.slice(5)
          children.push({
            id: `${group.id}:${bucketKey}`,
            label: destinationNameMap.value[destId] || destId,
            icon: 'lucide:map-pin',
            tasks: bucketTasks,
            questId: '',
            subQuestId: '',
            tripId: group.tripId,
            destinationId: destId,
          })
        }
      }
    } else {
      // Single bucket: all tasks are direct — no sub-header
      children.push({
        id: `${group.id}:all`,
        label: '',
        icon: '',
        tasks: group.tasks,
        questId: group.questId,
        subQuestId: '',
        tripId: group.tripId,
        destinationId: '',
      })
    }

    if (children.length > 0) {
      projects.push({
        id: group.id,
        label: group.label,
        icon: group.icon,
        questId: group.questId,
        tripId: group.tripId,
        children,
      })
    }
  }

  // No Project group
  if (noProjectTasks.some(tk => !tk.completed)) {
    projects.push({
      id: 'no-project',
      label: t('task.groupBy.noProject'),
      icon: 'lucide:inbox',
      questId: '',
      tripId: '',
      children: [{
        id: 'no-project:all',
        label: '',
        icon: '',
        tasks: noProjectTasks,
        questId: '',
        subQuestId: '',
        tripId: '',
        destinationId: '',
      }],
    })
  }

  return projects
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
  const tripSubquests = getSubquestsByTripId(selectedTripId.value)
  // If no destinations and no subquests, don't show sections — just use flat list
  if (destinations.length === 0 && tripSubquests.length === 0) return []
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
  // One section per subquest
  for (const sq of tripSubquests) {
    sections.push({
      id: sq.id,
      label: sq.name,
      icon: 'lucide:circle-dot',
      tasks: getTasksBySubQuestId(sq.id),
      questId: '',
      subQuestId: sq.id,
      tripId: selectedTripId.value,
      destinationId: '',
    })
  }
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
    dueDate: selectedTask.value.dueDate ? selectedTask.value.dueDate.toISOString() : '',
    questId: selectedTask.value.questId || '',
    subQuestId: selectedTask.value.subQuestId || '',
    tripId: selectedTask.value.tripId || '',
    destinationId: selectedTask.value.destinationId || '',
    wishId: selectedTask.value.wishId || '',
    timeHorizon: selectedTask.value.timeHorizon || '',
    recurrence: selectedTask.value.recurrence ? JSON.stringify(selectedTask.value.recurrence) : '',
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

function selectTripSubQuestView(tripId: string, subQuestId: string) {
  currentView.value = 'subquest'
  selectedTripId.value = tripId
  selectedQuestId.value = ''
  selectedSubQuestId.value = subQuestId
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
  if (val.startsWith('tripsubquest:')) {
    const parts = val.split(':')
    selectTripSubQuestView(parts[1], parts[2])
  } else if (val.startsWith('subquest:')) {
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
    currentView.value = val as 'inbox' | 'today' | 'this_week' | 'this_month' | 'long_term' | 'no_horizon'
  }
}

// Add Sub-Quest for trip
const showAddSubQuestInput = ref(false)
const newSubQuestName = ref('')
const subQuestInput = ref<HTMLInputElement | null>(null)

function openAddSubQuestInput() {
  showAddSubQuestInput.value = true
  newSubQuestName.value = ''
  nextTick(() => {
    subQuestInput.value?.focus()
  })
}

async function handleAddSubQuest() {
  if (!newSubQuestName.value.trim()) return
  if (currentView.value === 'quest' && selectedQuestId.value) {
    await createSubQuestForQuest(selectedQuestId.value, { name: newSubQuestName.value.trim(), icon: 'lucide:target', goal: '', description: '', startDate: '', endDate: '', status: 'in_progress' })
  } else if (currentView.value === 'trip' && selectedTripId.value) {
    await createSubQuestForTrip(selectedTripId.value, { name: newSubQuestName.value.trim(), icon: 'lucide:target', goal: '', description: '', startDate: '', endDate: '', status: 'in_progress' })
  } else {
    return
  }
  newSubQuestName.value = ''
  showAddSubQuestInput.value = false
}

// CRUD handlers
async function handleCreate(data: TaskForm) {
  const result = await createTask(data)
  if (result.success) {
    showCreateModal.value = false
  }
}

async function handleInlineUpdate(id: string, data: { title: string; description: string; dueDate?: string }) {
  await updateTask(id, data)
}

async function handleQuickAdd(data: { title: string; description: string; dueDate?: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds?: string[]; recurrence?: string }) {
  const viewToHorizon: Record<string, string> = {
    today: 'today',
    this_week: 'this_week',
    this_month: 'this_month',
    long_term: 'long_term',
  }
  // If dueDate is provided, auto-compute timeHorizon from it
  let timeHorizon = viewToHorizon[currentView.value] || ''
  if (data.dueDate) {
    timeHorizon = computeTimeHorizonFromDate(new Date(data.dueDate))
  }
  await createTask({
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate || '',
    questId: data.questId,
    subQuestId: data.subQuestId,
    tripId: data.tripId,
    destinationId: data.destinationId,
    accommodationId: '',
    experienceId: data.experienceId || '',
    wishId: data.wishId,
    timeHorizon,
    estimatedTime: '',
    recurrence: data.recurrence || '',
    blockedByTaskIds: data.blockedByTaskIds || [],
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

async function handleUpdateTimeHorizon(id: string, timeHorizon: TaskTimeHorizon | null) {
  await updateTaskTimeHorizon(id, timeHorizon)
}

async function handleUpdateEstimatedTime(id: string, estimatedTime: TaskEstimatedTime | null) {
  await updateTaskEstimatedTime(id, estimatedTime)
}

async function handleUpdateBlockedBy(id: string, blockedByTaskIds: string[]) {
  await updateTaskBlockedBy(id, blockedByTaskIds)
}

async function handleUpdateDueDate(id: string, dueDate: Date | null) {
  await updateTaskDueDate(id, dueDate)
}

async function handleUpdateRecurrence(id: string, recurrence: import('~/types').TaskRecurrence | null) {
  await updateTaskRecurrence(id, recurrence)
}

async function handleDelete(id: string) {
  await deleteTask(id)
}
</script>
