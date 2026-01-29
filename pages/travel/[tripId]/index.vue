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
      <UiButton to="/travel">
        Back to Trips
      </UiButton>
    </div>

    <!-- Trip Content -->
    <template v-else>
      <!-- Header -->
      <div class="mb-8">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <NuxtLink to="/travel" class="hover:text-purple-600 transition-colors">
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

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow-soft p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ destinations.length }}</p>
              <p class="text-sm text-gray-500">{{ $t('travel.nav.destinations') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-soft p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ transportations.length }}</p>
              <p class="text-sm text-gray-500">{{ $t('travel.nav.transportation') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-soft p-4 opacity-60 cursor-not-allowed" :title="$t('common.comingSoon')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">-</p>
              <p class="text-sm text-gray-500">{{ $t('travel.nav.accommodations') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-soft p-4 opacity-60 cursor-not-allowed" :title="$t('common.comingSoon')">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">-</p>
              <p class="text-sm text-gray-500">{{ $t('travel.nav.experiences') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Itinerary Section -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">{{ $t('travel.itinerary.title') }}</h2>
          <UiButton variant="secondary" size="sm" @click="showAddDestinationModal = true">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ $t('travel.destinations.addDestination') }}
          </UiButton>
        </div>

        <!-- Loading -->
        <div v-if="destinationsLoading || transportationsLoading" class="bg-white rounded-xl shadow-soft p-8 text-center">
          <svg class="animate-spin h-6 w-6 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>

        <!-- Itinerary Flow -->
        <div v-else class="bg-white rounded-xl shadow-soft p-6">
          <!-- Origin Point -->
          <TravelItineraryPoint
            :label="originLabel || $t('travel.itinerary.originNotSet')"
            :sublabel="originSublabel"
            :is-origin="true"
            :show-edit="false"
            @click="showEditModal = true"
          />

          <!-- If no destinations yet -->
          <div v-if="localDestinations.length === 0" class="ml-8 my-4 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
            <p class="text-gray-500 mb-3">{{ $t('travel.destinations.empty.description') }}</p>
            <UiButton variant="secondary" size="sm" @click="showAddDestinationModal = true">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ $t('travel.destinations.addDestination') }}
            </UiButton>
          </div>

          <!-- Destinations with transportation -->
          <template v-else>
            <!-- Transportation: Origin → First Destination -->
            <TravelTransportationCard
              :transportation="getTransportationBetween(null, localDestinations[0]?.id)"
              :from-label="originLabel || 'Origin'"
              :to-label="localDestinations[0]?.name || ''"
              @click="openTransportationModal(null, localDestinations[0]?.id)"
            />

            <!-- Add Destination at beginning (before first destination) -->
            <button
              @click="openAddDestinationAt(0)"
              class="flex items-center gap-1.5 ml-8 py-2 text-sm text-gray-400 hover:text-purple-600 transition-colors group"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="opacity-0 group-hover:opacity-100 transition-opacity">
                {{ $t('travel.destinations.addDestination') }}
              </span>
            </button>

            <!-- Draggable destinations -->
            <VueDraggable
              v-model="localDestinations"
              :animation="200"
              handle=".drag-handle"
              ghost-class="dragging-ghost"
              @end="onDragEnd"
            >
              <div v-for="(destination, index) in localDestinations" :key="destination.id">
                <!-- Destination Point -->
                <TravelItineraryPoint
                  :label="destination.name"
                  :sublabel="destination.country"
                  :arrival-date="getDestinationDateInfo(destination, index).arrivalDate"
                  :departure-date="getDestinationDateInfo(destination, index).departureDate"
                  :duration-days="getDestinationDateInfo(destination, index).durationDays"
                  :order="index + 1"
                  :draggable="true"
                  @click="editDestination(destination)"
                />

                <!-- Transportation to next destination (if not last) -->
                <TravelTransportationCard
                  v-if="index < localDestinations.length - 1"
                  :transportation="getTransportationBetween(destination.id, localDestinations[index + 1]?.id)"
                  :from-label="destination.name"
                  :to-label="localDestinations[index + 1]?.name || ''"
                  @click="openTransportationModal(destination.id, localDestinations[index + 1]?.id)"
                />

                <!-- Add Destination between button (not after the last one) -->
                <button
                  v-if="index < localDestinations.length - 1"
                  @click="openAddDestinationAt(index + 1)"
                  class="flex items-center gap-1.5 ml-8 py-2 text-sm text-gray-400 hover:text-purple-600 transition-colors group"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span class="opacity-0 group-hover:opacity-100 transition-opacity">
                    {{ $t('travel.destinations.addDestination') }}
                  </span>
                </button>
              </div>
            </VueDraggable>

            <!-- Add destination after last -->
            <button
              @click="showAddDestinationModal = true"
              class="flex items-center gap-1.5 ml-8 py-2 text-sm text-gray-400 hover:text-purple-600 transition-colors group mt-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{{ $t('travel.destinations.addDestination') }}</span>
            </button>
          </template>
        </div>
      </div>
    </template>

    <!-- Edit Trip Modal -->
    <UiModal
      v-model="showEditModal"
      :title="$t('common.edit')"
    >
      <TravelTripsTripForm
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
      <TravelDestinationsDestinationForm
        @submit="handleCreateDestination"
        @cancel="showAddDestinationModal = false"
      />
    </UiModal>

    <!-- Edit Destination Modal -->
    <UiModal
      v-model="showEditDestinationModal"
      :title="$t('common.edit')"
    >
      <TravelDestinationsDestinationForm
        :initial-data="selectedDestination || undefined"
        @submit="handleUpdateDestination"
        @cancel="showEditDestinationModal = false"
        @delete="handleDeleteDestination"
      />
    </UiModal>

    <!-- Transportation Modal -->
    <UiModal
      v-model="showTransportationModal"
      :title="transportationModalTitle"
      size="lg"
    >
      <TravelTransportationForm
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
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { TripForm, Destination, DestinationForm, TransportationForm, Transportation } from '~/types'
import { getCurrencySymbol } from '~/types'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const route = useRoute()
const { locale } = useI18n()
const tripId = computed(() => route.params.tripId as string)

// Set app context to SuperTravel
const { setApp } = useAppContext()
onMounted(() => {
  setApp('supertravel')
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
} = useTransportation(tripId)

// Modals
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showAddDestinationModal = ref(false)
const showEditDestinationModal = ref(false)
const showTransportationModal = ref(false)

// State
const deleting = ref(false)
const selectedDestination = ref<Destination | null>(null)
const selectedTransportation = ref<Transportation | null>(null)
const transportFromId = ref<string | null>(null)
const transportToId = ref<string | null>(null)

// Drag and drop state
const localDestinations = ref<Destination[]>([])
const insertAtPosition = ref<number | null>(null)

// Sync local destinations with reactive destinations from composable
watch(destinations, (newDestinations) => {
  localDestinations.value = [...newDestinations]
}, { immediate: true })

// Handle drag end
async function onDragEnd() {
  const orderedIds = localDestinations.value.map(d => d.id)
  await reorderDestinations(orderedIds)
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
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

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
  const formatOptions: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }

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
    arrivalDate = arrival.toLocaleDateString(dateLocale, formatOptions)

    if (departureDateRaw) {
      const departure = departureDateRaw instanceof Date ? departureDateRaw : new Date(departureDateRaw)
      departureDate = departure.toLocaleDateString(dateLocale, formatOptions)

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
    navigateTo('/travel')
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
  selectedDestination.value = destination
  showEditDestinationModal.value = true
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

// Helper to get origin label
const originLabel = computed(() => {
  return trip.value?.origin?.name || ''
})

const originSublabel = computed(() => {
  return trip.value?.origin?.country || ''
})
</script>

<style scoped>
.dragging-ghost {
  opacity: 0.5;
  background-color: #f3e8ff;
  border-radius: 0.5rem;
}
</style>
