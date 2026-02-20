<template>
  <div>
    <!-- Loading State -->
    <div v-if="tripsLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Trip Not Found -->
    <div v-else-if="!trip" class="text-center py-20">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Trip not found</h2>
      <p class="text-gray-500 mb-6">This trip doesn't exist or you don't have access to it.</p>
      <UiButton to="/trip">
        Back to Trips
      </UiButton>
    </div>

    <!-- Trip Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <NuxtLink to="/trip" class="hover:text-purple-600 transition-colors">
            {{ $t('travel.nav.trips') }}
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900">{{ trip.name }}</span>
        </div>

        <!-- Title Row -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ trip.name }}</h1>
              <span
                class="px-2.5 py-1 rounded-full text-xs font-medium"
                :class="statusBadgeClass"
              >
                {{ $t(`travel.trips.status.${trip.status}`) }}
              </span>
            </div>
            <p v-if="trip.description" class="text-gray-500 mt-1">{{ trip.description }}</p>

            <!-- Notes -->
            <div v-if="trip.notes" class="flex items-start gap-2 mt-2 text-sm text-gray-500">
              <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p class="whitespace-pre-line">{{ trip.notes }}</p>
            </div>

            <!-- Meta Info -->
            <div class="flex items-center gap-4 mt-3 text-sm">
              <div v-if="dateRange" class="flex items-center gap-1.5 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{{ dateRange }}</span>
              </div>
              <div v-if="trip.totalBudget" class="flex items-center gap-1.5 text-gray-500">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ formattedBudget }}</span>
              </div>
              <span class="text-gray-400">{{ destinations.length }} destinations</span>
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

      <!-- Tasks Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">{{ $t('task.task.title') }}</h2>
        </div>

        <div class="space-y-2">
          <!-- Direct Trip Tasks -->
          <div class="bg-white rounded-xl shadow-soft">
            <div class="flex items-center gap-2 px-4 pt-3 pb-1">
              <span class="text-sm font-bold text-gray-700">{{ $t('task.sections.general') }}</span>
            </div>
            <TaskList
              :tasks="tripTasks"
              :all-tasks="allTasks"
              :trip-id="tripId"
              @toggle="handleToggleTask"
              @edit="() => {}"
              @delete="handleDeleteTask"
              @add="handleQuickAddTask"
              @inline-update="handleInlineUpdateTask"
              @update-time-horizon="handleUpdateTaskTimeHorizon"
              @update-estimated-time="handleUpdateTaskEstimatedTime"
              @update-blocked-by="handleUpdateBlockedBy"
              @update-due-date="handleUpdateDueDate"
              @update-recurrence="handleUpdateRecurrence"
            />
          </div>

          <!-- Sub-Quests -->
          <QuestSubQuestList
            v-if="tripSubquests.length > 0"
            :subquests="tripSubquests"
            :all-tasks="allTasks"
            :get-tasks-by-sub-quest-id="getTasksBySubQuestId"
            :trip-id="tripId"
            @edit="openEditSubQuestModal"
            @toggle-task="handleToggleTask"
            @delete-task="handleDeleteTask"
            @add-task="handleQuickAddSubQuestTask"
            @inline-update-task="handleInlineUpdateTask"
            @update-time-horizon-task="handleUpdateTaskTimeHorizon"
            @update-estimated-time-task="handleUpdateTaskEstimatedTime"
            @update-blocked-by-task="handleUpdateBlockedBy"
            @update-due-date-task="handleUpdateDueDate"
            @update-recurrence-task="handleUpdateRecurrence"
          />

          <!-- Add Sub-Quest button -->
          <button
            @click="showCreateSubQuestModal = true"
            class="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            {{ $t('task.sections.addSubQuest') }}
          </button>

          <!-- Destination Task Groups -->
          <template v-for="destination in destinations" :key="'task-' + destination.id">
            <TripDestinationTaskGroup
              v-if="getTasksByDestinationId(destination.id).length > 0 || true"
              :destination="destination"
              :tasks="getTasksByDestinationId(destination.id)"
              :all-tasks="allTasks"
              :trip-id="tripId"
              @toggle-task="handleToggleTask"
              @delete-task="handleDeleteTask"
              @add-task="handleQuickAddDestinationTask"
              @inline-update-task="handleInlineUpdateTask"
              @update-time-horizon-task="handleUpdateTaskTimeHorizon"
              @update-estimated-time-task="handleUpdateTaskEstimatedTime"
              @update-blocked-by-task="handleUpdateBlockedBy"
              @update-due-date-task="handleUpdateDueDate"
              @update-recurrence-task="handleUpdateRecurrence"
            />
          </template>
        </div>
      </div>

      <!-- Itinerary Section -->
      <div class="mb-8">
        <!-- Loading -->
        <div v-if="destinationsLoading || transportationsLoading" class="bg-white rounded-xl shadow-soft p-8 text-center">
          <svg class="animate-spin h-6 w-6 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Itinerary Flow -->
        <div v-else class="bg-white rounded-xl shadow-soft p-6">

          <!-- If no destinations yet -->
          <div v-if="localDestinations.length === 0" class="flex flex-col items-center py-8">
            <div class="w-0.5 h-8 bg-gray-300 mb-4" />
            <div class="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center max-w-md">
              <p class="text-gray-500 mb-4">{{ $t('travel.destinations.empty.description') }}</p>
              <UiButton variant="secondary" @click="showAddDestinationModal = true">
                <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                {{ $t('travel.destinations.addDestination') }}
              </UiButton>
            </div>
          </div>

          <!-- Destinations with transportation (Timeline Layout) -->
          <template v-else>
            <div class="flex flex-col items-center">

              <!-- Destinations -->
              <TripItineraryPoint
                  :label="originLabel || $t('travel.itinerary.originNotSet')"
                  :sublabel="originSublabel"
                  :country-code="trip?.origin?.countryCode"
                  :is-origin="true"
                  :show-edit="false"
                  @click="showEditModal = true"
                />
              <div class="w-full space-y-0">

                <TripTransportationCard
                  :transportation="getTransportationBetween(null, localDestinations[0]?.id)"
                  :from-label="originLabel || 'Origin'"
                  :to-label="localDestinations[0]?.name || ''"
                  :accommodation-destination-id="localDestinations[0]?.id"
                  @click="openTransportationModal(null, localDestinations[0]?.id)"
                  @add-accommodation="openNewAccommodationModal"
                />

                <template v-for="(destination, index) in localDestinations" :key="destination.id">
                  <!-- Destination Card -->
                  <TripItineraryPoint
                    :label="destination.name"
                    :sublabel="destination.country"
                    :country-code="destination.countryCode"
                    :image-url="destination.imageUrl"
                    :arrival-date="getDestinationArrivalDate(destination, index)"
                    :departure-date="getDestinationDepartureDate(destination, index)"
                    :order="index + 1"
                    :is-confirmed="isDestinationConfirmed(destination.id, index)"
                    @click="editDestination(destination)"
                  />

                  <!-- Accommodations for this destination -->
                  <TripAccommodationsDestinationList
                    :accommodations="getAccommodationsByDestinationId(destination.id)"
                    :destination-id="destination.id"
                    @click="openAccommodationModal($event)"
                  />

                  <!-- Transportation to next destination (if not last) -->
                  <TripTransportationCard
                    v-if="index < localDestinations.length - 1"
                    :transportation="getTransportationBetween(destination.id, localDestinations[index + 1]?.id)"
                    :from-label="destination.name"
                    :to-label="localDestinations[index + 1]?.name || ''"
                    :insert-position="index + 1"
                    :accommodation-destination-id="destination.id"
                    @click="openTransportationModal(destination.id, localDestinations[index + 1]?.id)"
                    @add-destination="openAddDestinationAt"
                    @add-accommodation="openNewAccommodationModal"
                  />
                </template>
              </div>
              <!-- Transportation: Last Destination → Origin (return trip) -->
              <TripTransportationCard
                :transportation="getTransportationBetween(localDestinations[localDestinations.length - 1]?.id, null)"
                :from-label="localDestinations[localDestinations.length - 1]?.name || ''"
                :to-label="originLabel || 'Origin'"
                :accommodation-destination-id="localDestinations[localDestinations.length - 1]?.id"
                @click="openTransportationModal(localDestinations[localDestinations.length - 1]?.id, null)"
                @add-accommodation="openNewAccommodationModal"
              />

              <TripItineraryPoint
                :label="originLabel || $t('travel.itinerary.originNotSet')"
                :sublabel="originSublabel"
                :country-code="trip?.origin?.countryCode"
                :is-origin="true"
                :show-edit="false"
                @click="showEditModal = true"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Orphan Transportations Section -->
      <div v-if="orphanTransportations.length > 0" class="mb-8">
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-lg font-semibold text-amber-800">
              Transportes com destino inválido
            </h3>
          </div>
          <p class="text-amber-700 text-sm mb-4">
            Os transportes abaixo apontam para destinos que não existem mais. Corrija ou delete-os.
          </p>

          <div class="space-y-4">
            <div
              v-for="transport in orphanTransportations"
              :key="transport.id"
              class="bg-white rounded-lg border border-amber-200 p-4"
            >
              <!-- Transport Info -->
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <span class="font-medium text-gray-900 capitalize">{{ transport.type }}</span>
                  <span v-if="transport.carrier" class="text-gray-500 text-sm ml-2">{{ transport.carrier }}</span>
                </div>
              </div>

              <!-- From/To Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- From -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    De
                    <span v-if="!isValidDestinationId(transport.fromDestinationId)" class="text-red-500 text-xs ml-1">(inválido)</span>
                  </label>
                  <select
                    v-model="orphanFixFromId[transport.id]"
                    class="w-full px-3 py-2 border rounded-lg text-sm"
                    :class="isValidDestinationId(transport.fromDestinationId) ? 'border-gray-300' : 'border-red-300 bg-red-50'"
                  >
                    <option :value="null">Origem ({{ originLabel || 'não definida' }})</option>
                    <option v-for="dest in destinations" :key="dest.id" :value="dest.id">
                      {{ dest.name }}
                    </option>
                  </select>
                </div>

                <!-- To -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Para
                    <span v-if="!isValidDestinationId(transport.toDestinationId)" class="text-red-500 text-xs ml-1">(inválido)</span>
                  </label>
                  <select
                    v-model="orphanFixToId[transport.id]"
                    class="w-full px-3 py-2 border rounded-lg text-sm"
                    :class="isValidDestinationId(transport.toDestinationId) ? 'border-gray-300' : 'border-red-300 bg-red-50'"
                  >
                    <option :value="null">Origem ({{ originLabel || 'não definida' }})</option>
                    <option v-for="dest in destinations" :key="dest.id" :value="dest.id">
                      {{ dest.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <UiButton variant="primary" size="sm" @click="fixOrphanTransport(transport.id)">
                  <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Salvar
                </UiButton>
                <UiButton variant="danger" size="sm" @click="deleteOrphanTransport(transport.id)">
                  <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Deletar
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Trip Modal -->
    <UiModal
      v-model="showEditModal"
      :title="$t('common.edit')"
    >
      <TripTripsTripForm
        :initial-data="trip || undefined"
        @submit="handleUpdateTrip"
        @cancel="showEditModal = false"
      />
    </UiModal>

    <!-- Delete Trip Confirmation -->
    <UiModal
      v-model="showDeleteModal"
      :title="$t('common.delete')"
      size="sm"
    >
      <p class="text-gray-600">
        Are you sure you want to delete "{{ trip?.name }}"? This will also delete all destinations, transportation, accommodations, and experiences. This action cannot be undone.
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="showDeleteModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="deleting" @click="handleDeleteTrip">
          {{ $t('common.delete') }}
        </UiButton>
      </template>
    </UiModal>

    <!-- Add Destination Modal -->
    <UiModal
      v-model="showAddDestinationModal"
      :title="$t('travel.destinations.addDestination')"
    >
      <TripDestinationsDestinationForm
        @submit="handleCreateDestination"
        @cancel="showAddDestinationModal = false"
      />
    </UiModal>

    <!-- Edit Destination Modal -->
    <UiModal
      v-model="showEditDestinationModal"
      :title="$t('common.edit')"
    >
      <TripDestinationsDestinationForm
        :initial-data="selectedDestination || undefined"
        @submit="handleUpdateDestination"
        @cancel="showEditDestinationModal = false"
        @delete="handleDeleteDestination"
      />
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

    <!-- Transportation Modal -->
    <UiModal
      v-model="showTransportationModal"
      :title="transportationModalTitle"
      size="lg"
    >
      <TripTransportationForm
        :initial-data="selectedTransportation"
        :from-destination-id="transportFromId"
        :to-destination-id="transportToId"
        :from-label="transportFromLabel"
        :to-label="transportToLabel"
        :trip-currency="trip?.baseCurrency || 'USD'"
        @submit="handleTransportationSubmit"
        @cancel="showTransportationModal = false"
        @delete="handleTransportationDelete"
      />
    </UiModal>

    <!-- Accommodation Modal -->
    <UiModal
      v-model="showAccommodationModal"
      :title="selectedAccommodation ? $t('common.edit') : $t('travel.accommodations.addAccommodation')"
      size="lg"
    >
      <TripAccommodationsForm
        :initial-data="selectedAccommodation"
        :destinations="destinations"
        :default-destination-id="accommodationDestinationId"
        :trip-currency="trip?.baseCurrency || 'USD'"
        @submit="handleAccommodationSubmit"
        @cancel="showAccommodationModal = false"
        @delete="handleAccommodationDelete"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { TripForm, Destination, DestinationForm, TransportationForm, Transportation, AccommodationForm, Accommodation, Task, SubQuest, SubQuestForm } from '~/types'
import { getCurrencySymbol } from '~/types'
import { computeTimeHorizonFromDate } from '~/utils/taskDueDate'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const route = useRoute()
const { locale } = useI18n()
const tripId = computed(() => route.params.tripId as string)

// Set app context to SuperTrip
const { setApp } = useAppContext()
onMounted(() => {
  setApp('supertrip')
})

// Trips
const { trips, loading: tripsLoading, getTripById, updateTrip, deleteTrip } = useTrips()
const trip = computed(() => getTripById(tripId.value))

// Destinations
const { destinations, loading: destinationsLoading, createDestination, updateDestination, deleteDestination, reorderDestinations } = useDestinations(tripId)

// Transportation
const {
  transportations,
  loading: transportationsLoading,
  createTransportation,
  createRoundTripTransportation,
  updateTransportation,
  deleteTransportation,
  getTransportationBetween,
  getOrphanTransportations,
} = useTransportation(tripId)

// Accommodations
const {
  accommodations,
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  getAccommodationsByDestinationId,
} = useAccommodations(tripId)

// Tasks
const { tasks: allTasks, getDirectTripTasks, getTasksByDestinationId, getTasksBySubQuestId, createTask, updateTask, toggleTaskComplete, deleteTask: deleteTaskById, updateTaskTimeHorizon, updateTaskEstimatedTime, updateTaskDueDate, updateTaskBlockedBy, updateTaskRecurrence } = useTasks()
const tripTasks = computed(() => getDirectTripTasks(tripId.value))

// Sub-Quests
const { getSubquestsByTripId, createSubQuestForTrip, updateSubQuest, deleteSubQuest } = useAllSubquests()
const tripSubquests = computed(() => getSubquestsByTripId(tripId.value))

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAddDestinationModal = ref(false)
const showEditDestinationModal = ref(false)
const showTransportationModal = ref(false)
const showAccommodationModal = ref(false)
const showCreateSubQuestModal = ref(false)
const showEditSubQuestModal = ref(false)

// State
const deleting = ref(false)
const selectedDestination = ref<Destination | null>(null)
const selectedTransportation = ref<Transportation | null>(null)
const selectedAccommodation = ref<Accommodation | null>(null)
const accommodationDestinationId = ref<string>('')
const transportFromId = ref<string | null>(null)
const transportToId = ref<string | null>(null)
const selectedSubQuest = ref<SubQuest | null>(null)

// Local destinations state
const localDestinations = ref<Destination[]>([])
const insertAtPosition = ref<number | null>(null)

// Sync local destinations with reactive destinations from composable
watch(destinations, (newDestinations) => {
  localDestinations.value = [...newDestinations]
}, { immediate: true })

// Orphan transportations (pointing to non-existent destinations)
const orphanTransportations = computed(() => {
  const validIds = destinations.value.map(d => d.id)
  return getOrphanTransportations(validIds)
})

// State for fixing orphan transports
const orphanFixFromId = ref<Record<string, string | null>>({})
const orphanFixToId = ref<Record<string, string | null>>({})

// Initialize orphan fix state when orphans change
watch(orphanTransportations, (orphans) => {
  orphans.forEach(t => {
    if (!(t.id in orphanFixFromId.value)) {
      orphanFixFromId.value[t.id] = t.fromDestinationId || null
    }
    if (!(t.id in orphanFixToId.value)) {
      orphanFixToId.value[t.id] = t.toDestinationId || null
    }
  })
}, { immediate: true })

// Fix orphan transport
async function fixOrphanTransport(transportId: string) {
  const newFromId = orphanFixFromId.value[transportId]
  const newToId = orphanFixToId.value[transportId]
  await updateTransportation(transportId, {
    fromDestinationId: newFromId || '',
    toDestinationId: newToId || '',
  })
}

// Delete orphan transport
async function deleteOrphanTransport(transportId: string) {
  await deleteTransportation(transportId)
}

// Check if a destination ID is valid
function isValidDestinationId(id: string | null | undefined): boolean {
  if (!id || id === '') return true // null/empty means origin, which is valid
  return destinations.value.some(d => d.id === id)
}

// Get destination name by ID
function getDestinationName(id: string | null | undefined): string {
  if (!id || id === '') return originLabel.value || 'Origem'
  const dest = destinations.value.find(d => d.id === id)
  return dest?.name || `ID inválido: ${id.slice(0, 8)}...`
}

// Open add destination modal at specific position
function openAddDestinationAt(position: number) {
  insertAtPosition.value = position
  showAddDestinationModal.value = true
}

// Computed
const statusBadgeClass = computed(() => {
  switch (trip.value?.status) {
    case 'planning':
      return 'bg-gray-100 text-gray-700'
    case 'upcoming':
      return 'bg-blue-100 text-blue-700'
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'completed':
      return 'bg-purple-100 text-purple-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

const dateRange = computed(() => {
  if (!trip.value) return null
  const { startDate, endDate } = trip.value
  if (!startDate && !endDate) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }

  if (startDate && endDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    const end = endDate instanceof Date ? endDate : new Date(endDate)
    return `${localeDateString(start, dateLocale, formatOptions)} - ${localeDateString(end, dateLocale, formatOptions)}`
  }

  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate)
    return `Starts ${localeDateString(start, dateLocale, formatOptions)}`
  }

  return null
})

const formattedBudget = computed(() => {
  if (!trip.value?.totalBudget) return ''
  const symbol = getCurrencySymbol(trip.value.baseCurrency)
  return `${symbol} ${trip.value.totalBudget.toLocaleString()}`
})

interface DestinationDateInfo {
  arrivalDate: string
  departureDate: string
  durationDays: string
}

const getDestinationDateInfo = (destination: Destination, index: number): DestinationDateInfo => {
  const { t } = useI18n()
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }

  // Determinar data de chegada (fallback: transporte que chega neste destino)
  let arrivalDateRaw = destination.arrivalDate
  if (!arrivalDateRaw) {
    const previousId = index === 0 ? null : localDestinations.value[index - 1]?.id
    const incomingTransport = getTransportationBetween(previousId, destination.id)
    if (incomingTransport?.arrivalDateTime) {
      arrivalDateRaw = incomingTransport.arrivalDateTime
    }
  }

  // Determinar data de partida (fallback: transporte que sai deste destino)
  let departureDateRaw = destination.departureDate
  if (!departureDateRaw) {
    const nextId = localDestinations.value[index + 1]?.id ?? null
    const outgoingTransport = getTransportationBetween(destination.id, nextId)
    if (outgoingTransport?.departureDateTime) {
      departureDateRaw = outgoingTransport.departureDateTime
    }
  }

  // Formatar datas
  let arrivalDate = ''
  let departureDate = ''
  let durationDays = ''

  if (arrivalDateRaw) {
    const arrival = arrivalDateRaw instanceof Date ? arrivalDateRaw : new Date(arrivalDateRaw)
    arrivalDate = localeDateString(arrival, dateLocale, formatOptions)

    if (departureDateRaw) {
      const departure = departureDateRaw instanceof Date ? departureDateRaw : new Date(departureDateRaw)
      departureDate = localeDateString(departure, dateLocale, formatOptions)

      // Calcular número de dias (incluindo dia de chegada e saída)
      const diffTime = departure.getTime() - arrival.getTime()
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      if (days > 0) {
        durationDays = t('travel.itinerary.days', { count: days }, days)
      }
    }
  }

  return { arrivalDate, departureDate, durationDays }
}

// Helper to get arrival date (raw Date/string) for new Point component
const getDestinationArrivalDate = (destination: Destination, index: number): Date | string | null => {
  if (destination.arrivalDate) return destination.arrivalDate
  // Fallback: use incoming transport arrival time
  const previousId = index === 0 ? null : localDestinations.value[index - 1]?.id
  const incomingTransport = getTransportationBetween(previousId, destination.id)
  return incomingTransport?.arrivalDateTime || null
}

// Helper to get departure date (raw Date/string) for new Point component
const getDestinationDepartureDate = (destination: Destination, index: number): Date | string | null => {
  if (destination.departureDate) return destination.departureDate
  // Fallback: use outgoing transport departure time
  const nextId = localDestinations.value[index + 1]?.id ?? null
  const outgoingTransport = getTransportationBetween(destination.id, nextId)
  return outgoingTransport?.departureDateTime || null
}

// Helper to check if a destination is confirmed (both incoming and outgoing transport confirmed)
const isDestinationConfirmed = (destId: string, index: number): boolean => {
  const prevId = index === 0 ? null : localDestinations.value[index - 1]?.id
  const nextId = localDestinations.value[index + 1]?.id ?? null
  const incoming = getTransportationBetween(prevId, destId)
  const outgoing = getTransportationBetween(destId, nextId)
  return incoming?.bookingStatus === 'confirmed' && outgoing?.bookingStatus === 'confirmed'
}

// Handlers
async function handleUpdateTrip(data: TripForm) {
  const result = await updateTrip(tripId.value, data)
  if (result.success) {
    showEditModal.value = false
  }
}

async function handleDeleteTrip() {
  deleting.value = true
  const result = await deleteTrip(tripId.value)
  if (result.success) {
    navigateTo('/trip')
  }
  deleting.value = false
}

async function handleCreateDestination(data: DestinationForm) {
  const result = await createDestination(tripId.value, data)
  if (result.success) {
    // If inserting at a specific position, reorder after creation
    if (insertAtPosition.value !== null && result.id) {
      // Wait for destinations to update
      await nextTick()
      const newDestinations = [...destinations.value]
      const newDestIndex = newDestinations.findIndex(d => d.id === result.id)
      if (newDestIndex !== -1) {
        // Remove from current position
        const [newDest] = newDestinations.splice(newDestIndex, 1)
        // Insert at target position
        newDestinations.splice(insertAtPosition.value, 0, newDest)
        // Reorder in database
        await reorderDestinations(newDestinations.map(d => d.id))
      }
    }
    insertAtPosition.value = null
    showAddDestinationModal.value = false
  }
}

function editDestination(destination: Destination) {
  console.log('[editDestination] navigating to destination:', destination.id, destination.name)
  navigateTo(`/trip/${tripId.value}/destination/${destination.id}`)
}

async function handleUpdateDestination(data: DestinationForm) {
  if (!selectedDestination.value) return
  const result = await updateDestination(selectedDestination.value.id, data)
  if (result.success) {
    showEditDestinationModal.value = false
    selectedDestination.value = null
  }
}

async function handleDeleteDestination() {
  if (!selectedDestination.value) return
  const result = await deleteDestination(selectedDestination.value.id)
  if (result.success) {
    showEditDestinationModal.value = false
    selectedDestination.value = null
  }
}

// Transportation handlers
function openTransportationModal(fromId: string | null, toId: string | null) {
  transportFromId.value = fromId
  transportToId.value = toId
  selectedTransportation.value = getTransportationBetween(fromId, toId) || null
  showTransportationModal.value = true
}

const transportFromLabel = computed(() => {
  if (transportFromId.value === null || transportFromId.value === '') {
    return trip.value?.origin?.name || 'Origin'
  }
  const dest = destinations.value.find(d => d.id === transportFromId.value)
  return dest?.name || 'Unknown'
})

const transportToLabel = computed(() => {
  if (transportToId.value === null || transportToId.value === '') {
    return trip.value?.origin?.name || 'Origin'
  }
  const dest = destinations.value.find(d => d.id === transportToId.value)
  return dest?.name || 'Unknown'
})

const transportationModalTitle = computed(() => {
  if (selectedTransportation.value) {
    return 'Edit Transportation'
  }
  return 'Add Transportation'
})

async function handleTransportationSubmit(data: TransportationForm, returnData?: TransportationForm) {
  // Set the from/to destination IDs for outbound
  data.fromDestinationId = transportFromId.value || ''
  data.toDestinationId = transportToId.value || ''

  if (selectedTransportation.value) {
    // Editing existing - always single record
    const result = await updateTransportation(selectedTransportation.value.id, data)
    if (result.success) {
      showTransportationModal.value = false
      selectedTransportation.value = null
    }
  } else if (returnData) {
    // Creating round-trip - two records
    // Set swapped destination IDs for return
    returnData.fromDestinationId = transportToId.value || ''
    returnData.toDestinationId = transportFromId.value || ''
    const result = await createRoundTripTransportation(tripId.value, data, returnData)
    if (result.success) {
      showTransportationModal.value = false
    }
  } else {
    // Creating single/one-way
    const result = await createTransportation(tripId.value, data)
    if (result.success) {
      showTransportationModal.value = false
    }
  }
}

async function handleTransportationDelete() {
  if (!selectedTransportation.value) return
  const result = await deleteTransportation(selectedTransportation.value.id)
  if (result.success) {
    showTransportationModal.value = false
    selectedTransportation.value = null
  }
}

// Accommodation handlers
function openAccommodationModal(accommodation: Accommodation) {
  selectedAccommodation.value = accommodation
  accommodationDestinationId.value = accommodation.destinationId
  showAccommodationModal.value = true
}

function openNewAccommodationModal(destinationId: string) {
  selectedAccommodation.value = null
  accommodationDestinationId.value = destinationId
  showAccommodationModal.value = true
}

async function handleAccommodationSubmit(data: AccommodationForm) {
  if (selectedAccommodation.value) {
    const result = await updateAccommodation(selectedAccommodation.value.id, data)
    if (result.success) {
      showAccommodationModal.value = false
      selectedAccommodation.value = null
    }
  } else {
    const result = await createAccommodation(tripId.value, data)
    if (result.success) {
      showAccommodationModal.value = false
    }
  }
}

async function handleAccommodationDelete() {
  if (!selectedAccommodation.value) return
  const result = await deleteAccommodation(selectedAccommodation.value.id)
  if (result.success) {
    showAccommodationModal.value = false
    selectedAccommodation.value = null
  }
}

// Task handlers
async function handleToggleTask(id: string, completed: boolean) {
  await toggleTaskComplete(id, completed)
}

async function handleDeleteTask(id: string) {
  await deleteTaskById(id)
}

async function handleInlineUpdateTask(id: string, data: { title: string; description: string; dueDate?: string }) {
  await updateTask(id, data)
}

async function handleUpdateTaskTimeHorizon(id: string, timeHorizon: string | null) {
  await updateTaskTimeHorizon(id, timeHorizon as any)
}

async function handleUpdateTaskEstimatedTime(id: string, estimatedTime: string | null) {
  await updateTaskEstimatedTime(id, estimatedTime as any)
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

async function handleQuickAddTask(data: { title: string; description: string; dueDate?: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds?: string[]; recurrence?: string }) {
  await createTask({
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate || '',
    questId: '',
    subQuestId: '',
    tripId: tripId.value,
    destinationId: '',
    accommodationId: '',
    experienceId: '',
    wishId: data.wishId || '',
    timeHorizon: data.dueDate ? computeTimeHorizonFromDate(new Date(data.dueDate)) : '',
    estimatedTime: '',
    recurrence: data.recurrence || '',
    blockedByTaskIds: data.blockedByTaskIds || [],
  })
}

async function handleQuickAddDestinationTask(data: { title: string; description: string; dueDate?: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds?: string[]; recurrence?: string }) {
  await createTask({
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate || '',
    questId: '',
    subQuestId: '',
    tripId: tripId.value,
    destinationId: data.destinationId,
    accommodationId: '',
    experienceId: '',
    wishId: data.wishId || '',
    timeHorizon: data.dueDate ? computeTimeHorizonFromDate(new Date(data.dueDate)) : '',
    estimatedTime: '',
    recurrence: data.recurrence || '',
    blockedByTaskIds: data.blockedByTaskIds || [],
  })
}

async function handleQuickAddSubQuestTask(data: { title: string; description: string; dueDate?: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; blockedByTaskIds?: string[]; recurrence?: string }) {
  await createTask({
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate || '',
    questId: '',
    subQuestId: data.subQuestId,
    tripId: tripId.value,
    destinationId: '',
    accommodationId: '',
    experienceId: '',
    wishId: data.wishId || '',
    timeHorizon: data.dueDate ? computeTimeHorizonFromDate(new Date(data.dueDate)) : '',
    estimatedTime: '',
    recurrence: data.recurrence || '',
    blockedByTaskIds: data.blockedByTaskIds || [],
  })
}

// Sub-Quest handlers
function openEditSubQuestModal(subquest: SubQuest) {
  selectedSubQuest.value = subquest
  showEditSubQuestModal.value = true
}

async function handleCreateSubQuest(data: SubQuestForm) {
  const result = await createSubQuestForTrip(tripId.value, data)
  if (result?.success) {
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

// Helper to get origin label
const originLabel = computed(() => {
  return trip.value?.origin?.name || ''
})

const originSublabel = computed(() => {
  return trip.value?.origin?.country || ''
})
</script>
