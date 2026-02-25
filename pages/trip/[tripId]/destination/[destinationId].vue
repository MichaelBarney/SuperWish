<template>
  <div>
    <!-- Loading -->
    <div v-if="tripsLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>

    <!-- Not Found -->
    <div v-else-if="!trip || !destination" class="text-center py-20">
      <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Destination not found</h2>
      <p class="text-gray-500 mb-6">This destination doesn't exist or you don't have access to it.</p>
      <UiButton :to="`/trip/${tripId}`">
        Back to Trip
      </UiButton>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <NuxtLink to="/trip" class="hover:text-purple-600 transition-colors">
          {{ $t('travel.nav.trips') }}
        </NuxtLink>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <NuxtLink :to="`/trip/${tripId}`" class="hover:text-purple-600 transition-colors">
          {{ trip.name }}
        </NuxtLink>
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        <span class="text-gray-900">{{ destination.name }}</span>
      </div>

      <!-- Header -->
      <div class="mb-8">
        <!-- Destination hero card -->
        <div class="relative overflow-hidden rounded-2xl shadow-lg min-h-[200px] mb-6">
          <!-- Background Image -->
          <div
            class="absolute inset-0 bg-cover bg-center"
            :style="backgroundStyle"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

          <!-- Content overlay -->
          <div class="relative flex flex-col justify-end p-6 min-h-[200px]">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-3xl font-bold text-white drop-shadow-lg">
                  {{ destination.name }}
                </h1>
                <p class="text-white/80 mt-1">
                  <span v-if="countryFlag">{{ countryFlag }}</span> {{ destination.country }}
                </p>

                <!-- Date display: day/month/weekday + nights badge -->
                <div v-if="formattedArrival || formattedDeparture" class="mt-3 flex items-end gap-6">
                  <div v-if="formattedArrival" class="text-white">
                    <div class="flex items-baseline gap-1">
                      <span class="text-xl font-bold">{{ formattedArrival.day }}</span>
                      <span class="text-xs font-semibold uppercase">{{ formattedArrival.month }}</span>
                    </div>
                    <p class="text-xs text-white/70">{{ formattedArrival.weekday }}</p>
                  </div>

                  <div v-if="formattedDeparture" class="text-white">
                    <div class="flex items-baseline gap-1">
                      <span class="text-xl font-bold">{{ formattedDeparture.day }}</span>
                      <span class="text-xs font-semibold uppercase">{{ formattedDeparture.month }}</span>
                    </div>
                    <p class="text-xs text-white/70">{{ formattedDeparture.weekday }}</p>
                  </div>

                  <div v-if="nightsCount" class="ml-auto">
                    <span class="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full uppercase">
                      {{ $t('travel.itinerary.nights', { count: nightsCount }, nightsCount) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="showEditDestinationModal = true"
                  class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <Icon name="lucide:pencil" class="w-4 h-4 text-white" />
                </button>
                <button
                  @click="showDeleteDestinationModal = true"
                  class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm hover:bg-red-500/60 flex items-center justify-center transition-colors"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4 text-white" />
                </button>
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
              :tasks="destinationDirectTasks"
              :trip-id="tripId"
              :destination-id="destinationId"
              @toggle="handleToggleTask"
              @edit="() => {}"
              @delete="handleDeleteTask"
              @add="handleQuickAddTask"
              @inline-update="handleInlineUpdateTask"
              @update-time-horizon="handleUpdateTaskTimeHorizon"
              @update-estimated-time="handleUpdateTaskEstimatedTime"
              @update-due-date="handleUpdateDueDate"
              @update-recurrence="handleUpdateRecurrence"
            />
          </div>
        </div>

        <!-- Timeline Section -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">{{ $t('travel.destinations.detail.timeline') }}</h2>
            <div class="flex items-center gap-2">
              <UiButton size="sm" @click="openNewAccommodationModal">
                <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
                {{ $t('travel.accommodations.addAccommodation') }}
              </UiButton>
              <UiButton size="sm" @click="openCreateExperience">
                <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
                {{ $t('travel.experiences.addExperience') }}
              </UiButton>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-soft p-4">
            <TripDestinationsDayTimeline
              :experiences="experiences"
              :accommodations="destinationAccommodations"
              :transportations="destinationTransportations"
              :destinations="destinations"
              :destination-id="destinationId"
              :origin-name="originName"
              :arrival-date="effectiveArrivalDate"
              :departure-date="effectiveDepartureDate"
              :loading="experiencesLoading"
              :weather-by-date="weatherByDate"
              @edit-experience="openEditExperience"
              @edit-accommodation="openEditAccommodationModal"
              @edit-transportation="openEditTransportationModal"
              @add-experience="openCreateExperienceForDate"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Destination Modal -->
    <UiModal
      v-model="showEditDestinationModal"
      :title="$t('travel.destinations.detail.editDestination')"
    >
      <TripDestinationsDestinationForm
        :initial-data="destination || undefined"
        @submit="handleUpdateDestination"
        @cancel="showEditDestinationModal = false"
        @delete="showDeleteDestinationModal = true; showEditDestinationModal = false"
      />
    </UiModal>

    <!-- Delete Destination Confirmation -->
    <UiModal
      v-model="showDeleteDestinationModal"
      :title="$t('common.delete')"
      size="sm"
    >
      <p class="text-gray-600">
        {{ $t('travel.destinations.detail.deleteConfirm') }}
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="showDeleteDestinationModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="deleting" @click="handleDeleteDestination">
          {{ $t('common.delete') }}
        </UiButton>
      </template>
    </UiModal>

    <!-- Create/Edit Experience Modal -->
    <UiModal
      v-model="showExperienceModal"
      :title="selectedExperience ? $t('common.edit') : $t('travel.experiences.addExperience')"
      size="lg"
    >
      <TripExperiencesExperienceForm
        :initial-data="selectedExperience || undefined"
        :trip-currency="trip?.baseCurrency || 'USD'"
        :default-date="experiencePreFillDate"
        @submit="handleExperienceSubmit"
        @cancel="showExperienceModal = false"
        @delete="handleExperienceDelete"
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
        :default-destination-id="destinationId"
        :trip-currency="trip?.baseCurrency || 'USD'"
        @submit="handleAccommodationSubmit"
        @cancel="showAccommodationModal = false"
        @delete="handleAccommodationDelete"
      />
    </UiModal>

    <!-- Transportation Modal (edit only) -->
    <UiModal
      v-model="showTransportationModal"
      :title="$t('common.edit')"
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
  </div>
</template>

<script setup lang="ts">
import type { DestinationForm, ExperienceForm, Experience, Accommodation, AccommodationForm, Transportation, TransportationForm, WeatherDay } from '~/types'
import { useCityImage, getGradientFallback } from '~/composables/useCityImage'
import { computeTimeHorizonFromDate } from '~/utils/taskDueDate'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const route = useRoute()
const { locale } = useI18n()
const tripId = computed(() => route.params.tripId as string)
const destinationId = computed(() => route.params.destinationId as string)

// Set app context
const { setApp } = useAppContext()
onMounted(() => {
  setApp('supertrip')
})

// Trips
const { trips, loading: tripsLoading, getTripById } = useTrips()
const trip = computed(() => getTripById(tripId.value))

// Destinations
const { destinations, updateDestination, deleteDestination } = useDestinations(tripId)
const destination = computed(() => destinations.value.find(d => d.id === destinationId.value))

// Experiences
const { experiences, loading: experiencesLoading, createExperience, updateExperience, deleteExperience } = useExperiences(destinationId)

// Tasks
const { getDirectDestinationTasks, createTask, updateTask, updateTaskUrl, toggleTaskComplete, deleteTask: deleteTaskById, updateTaskTimeHorizon, updateTaskEstimatedTime, updateTaskDueDate, updateTaskRecurrence } = useTasks()
const { resolveWishId } = useResolveWishCreation()
const { resolveExperienceId } = useResolveExperienceCreation()
const destinationDirectTasks = computed(() => getDirectDestinationTasks(destinationId.value))

// Accommodations
const {
  createAccommodation,
  updateAccommodation,
  deleteAccommodation,
  getAccommodationsByDestinationId,
} = useAccommodations(tripId)
const destinationAccommodations = computed(() => getAccommodationsByDestinationId(destinationId.value))

// Transportation
const {
  transportations,
  updateTransportation,
  deleteTransportation,
  getTransportationBetween,
} = useTransportation(tripId)

const destinationTransportations = computed(() =>
  transportations.value.filter(t =>
    t.fromDestinationId === destinationId.value || t.toDestinationId === destinationId.value
  )
)

// Origin name for transport direction labels
const originName = computed(() => trip.value?.origin?.name || 'Origin')

// Modals
const showEditDestinationModal = ref(false)
const showDeleteDestinationModal = ref(false)
const showExperienceModal = ref(false)
const showAccommodationModal = ref(false)
const showTransportationModal = ref(false)

// State
const deleting = ref(false)
const selectedExperience = ref<Experience | null>(null)
const selectedAccommodation = ref<Accommodation | null>(null)
const selectedTransportation = ref<Transportation | null>(null)
const transportFromId = ref<string | null>(null)
const transportToId = ref<string | null>(null)

// Country flag
const countryFlag = computed(() => {
  const code = destination.value?.countryCode
  if (!code) return ''
  const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
})

// Date formatting (matching itinerary Point.vue style)
interface FormattedDate {
  day: number
  month: string
  weekday: string
}

const formatDate = (date: string | Date | null | undefined): FormattedDate | null => {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return {
    day: d.getUTCDate(),
    month: localeDateString(d, dateLocale, { month: 'short', timeZone: 'UTC' }),
    weekday: localeDateString(d, dateLocale, { weekday: 'long', timeZone: 'UTC' })
  }
}

// Transport-based date fallback
const destinationIndex = computed(() =>
  destinations.value.findIndex(d => d.id === destinationId.value)
)

const effectiveArrivalDate = computed(() => {
  if (destination.value?.arrivalDate) return destination.value.arrivalDate
  const index = destinationIndex.value
  if (index < 0) return null
  const previousId = index === 0 ? null : destinations.value[index - 1]?.id
  const incomingTransport = getTransportationBetween(previousId, destinationId.value)
  return incomingTransport?.arrivalDateTime || null
})

const effectiveDepartureDate = computed(() => {
  if (destination.value?.departureDate) return destination.value.departureDate
  const index = destinationIndex.value
  if (index < 0) return null
  const nextId = destinations.value[index + 1]?.id ?? null
  const outgoingTransport = getTransportationBetween(destinationId.value, nextId)
  return outgoingTransport?.departureDateTime || null
})

// Weather
const { fetchWeather } = useWeather()
const weatherByDate = ref<Map<string, WeatherDay>>(new Map())

watch(
  [() => destination.value?.name, () => destination.value?.countryCode, effectiveArrivalDate, effectiveDepartureDate],
  async ([name, countryCode, arrival, departure]) => {
    if (!name || !arrival || !departure) {
      weatherByDate.value = new Map()
      return
    }
    const startStr = arrival instanceof Date ? arrival.toISOString().split('T')[0] : String(arrival).split('T')[0]
    const endStr = departure instanceof Date ? departure.toISOString().split('T')[0] : String(departure).split('T')[0]
    const result = await fetchWeather(name, countryCode || '', startStr, endStr)
    if (result) {
      const map = new Map<string, WeatherDay>()
      for (const day of result.days) {
        map.set(day.date, day)
      }
      weatherByDate.value = map
    } else {
      weatherByDate.value = new Map()
    }
  },
  { immediate: true }
)

const formattedArrival = computed(() => formatDate(effectiveArrivalDate.value))
const formattedDeparture = computed(() => formatDate(effectiveDepartureDate.value))

const nightsCount = computed(() => {
  if (!effectiveArrivalDate.value || !effectiveDepartureDate.value) return null
  const arrival = effectiveArrivalDate.value instanceof Date ? effectiveArrivalDate.value : new Date(effectiveArrivalDate.value)
  const departure = effectiveDepartureDate.value instanceof Date ? effectiveDepartureDate.value : new Date(effectiveDepartureDate.value)
  if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) return null
  const diffTime = departure.getTime() - arrival.getTime()
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : null
})

// Background image
const cityNameRef = computed(() => destination.value?.name || '')
const { imageUrl: unsplashUrl } = useCityImage(cityNameRef)

const backgroundStyle = computed(() => {
  const url = destination.value?.imageUrl || unsplashUrl.value
  if (url) return { backgroundImage: `url(${url})` }
  return { background: getGradientFallback(destination.value?.order || 0) }
})

// Transport modal labels
const transportFromLabel = computed(() => {
  if (!transportFromId.value || transportFromId.value === '') return originName.value
  const dest = destinations.value.find(d => d.id === transportFromId.value)
  return dest?.name || 'Unknown'
})

const transportToLabel = computed(() => {
  if (!transportToId.value || transportToId.value === '') return originName.value
  const dest = destinations.value.find(d => d.id === transportToId.value)
  return dest?.name || 'Unknown'
})

// Destination handlers
async function handleUpdateDestination(data: DestinationForm) {
  if (!destination.value) return
  const result = await updateDestination(destination.value.id, data)
  if (result.success) {
    showEditDestinationModal.value = false
  }
}

async function handleDeleteDestination() {
  if (!destination.value) return
  deleting.value = true
  const result = await deleteDestination(destination.value.id)
  if (result.success) {
    navigateTo(`/trip/${tripId.value}`)
  }
  deleting.value = false
}

// Experience handlers
const experiencePreFillDate = ref('')

function openCreateExperience() {
  selectedExperience.value = null
  experiencePreFillDate.value = ''
  showExperienceModal.value = true
}

function openCreateExperienceForDate(dateKey: string) {
  selectedExperience.value = null
  experiencePreFillDate.value = dateKey
  showExperienceModal.value = true
}

function openEditExperience(experience: Experience) {
  selectedExperience.value = experience
  showExperienceModal.value = true
}

async function handleExperienceSubmit(data: ExperienceForm) {
  if (selectedExperience.value) {
    const result = await updateExperience(selectedExperience.value.id, data)
    if (result.success) {
      showExperienceModal.value = false
      selectedExperience.value = null
    }
  } else {
    const locationData = destination.value ? {
      country: destination.value.country,
      city: destination.value.name,
      countryCode: destination.value.countryCode || '',
    } : undefined
    const result = await createExperience(destinationId.value, tripId.value, data, locationData)
    if (result.success) {
      showExperienceModal.value = false
    }
  }
}

async function handleExperienceDelete() {
  if (!selectedExperience.value) return
  const result = await deleteExperience(selectedExperience.value.id)
  if (result.success) {
    showExperienceModal.value = false
    selectedExperience.value = null
  }
}

// Accommodation handlers
function openNewAccommodationModal() {
  selectedAccommodation.value = null
  showAccommodationModal.value = true
}

function openEditAccommodationModal(accommodation: Accommodation) {
  selectedAccommodation.value = accommodation
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

// Transportation handlers
function openEditTransportationModal(transportation: Transportation) {
  selectedTransportation.value = transportation
  transportFromId.value = transportation.fromDestinationId || null
  transportToId.value = transportation.toDestinationId || null
  showTransportationModal.value = true
}

async function handleTransportationSubmit(data: TransportationForm) {
  if (!selectedTransportation.value) return
  data.fromDestinationId = transportFromId.value || ''
  data.toDestinationId = transportToId.value || ''
  const result = await updateTransportation(selectedTransportation.value.id, data)
  if (result.success) {
    showTransportationModal.value = false
    selectedTransportation.value = null
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

// Task handlers
async function handleToggleTask(id: string, completed: boolean) {
  await toggleTaskComplete(id, completed)
}

async function handleDeleteTask(id: string) {
  await deleteTaskById(id)
}

async function handleInlineUpdateTask(id: string, data: Record<string, any>) {
  await updateTask(id, data)
}

async function handleUpdateTaskTimeHorizon(id: string, timeHorizon: string | null) {
  await updateTaskTimeHorizon(id, timeHorizon as any)
}

async function handleUpdateTaskEstimatedTime(id: string, estimatedTime: string | null) {
  await updateTaskEstimatedTime(id, estimatedTime as any)
}

async function handleUpdateDueDate(id: string, dueDate: Date | null) {
  await updateTaskDueDate(id, dueDate)
}

async function handleUpdateRecurrence(id: string, recurrence: import('~/types').TaskRecurrence | null) {
  await updateTaskRecurrence(id, recurrence)
}

async function handleQuickAddTask(data: { title: string; dueDate?: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string; recurrence?: string; url?: string; urlTitle?: string; createExperienceData?: import('~/composables/useResolveExperienceCreation').CreateExperienceData }) {
  if (data.createExperienceData) {
    await resolveExperienceId('__create__', data.title, data.createExperienceData)
    return
  }
  const resolvedWishId = await resolveWishId(data.wishId, data.title)
  const resolvedExperience = await resolveExperienceId(data.experienceId || '', data.title)
  const result = await createTask({
    title: data.title,
    description: '',
    dueDate: data.dueDate || '',
    questId: '',
    subQuestId: '',
    tripId: tripId.value,
    destinationId: destinationId.value,
    accommodationId: '',
    experienceId: resolvedExperience,
    wishId: resolvedWishId,
    timeHorizon: data.dueDate ? computeTimeHorizonFromDate(new Date(data.dueDate)) : '',
    estimatedTime: '',
    recurrence: data.recurrence || '',
    blockedByTaskIds: (data as any).blockedByTaskIds || [],
    url: data.url || '',
    urlTitle: data.urlTitle || '',
  })
  if (data.url && !data.urlTitle && result?.id) {
    const { fetchMetadata } = useUrlMetadata()
    fetchMetadata(data.url).then(meta => {
      if (meta?.title) updateTaskUrl(result.id!, data.url!, meta.title)
    })
  }
}
</script>
