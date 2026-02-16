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
                <div v-if="dateRange" class="flex items-center gap-1.5 text-white/70 mt-2 text-sm">
                  <Icon name="lucide:calendar" class="w-4 h-4" />
                  <span>{{ dateRange }}</span>
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

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-white rounded-xl shadow-soft p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Icon name="lucide:sparkles" class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ experiences.length }}</p>
                <p class="text-sm text-gray-500">{{ $t('travel.nav.experiences') }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-soft p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Icon name="lucide:square-check-big" class="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ destinationDirectTasks.length }}</p>
                <p class="text-sm text-gray-500">{{ $t('task.task.title') }}</p>
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
            />
          </div>
        </div>

        <!-- Experiences Section -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">{{ $t('travel.experiences.title') }}</h2>
            <UiButton size="sm" @click="openCreateExperience">
              <Icon name="lucide:plus" class="w-4 h-4 mr-1" />
              {{ $t('travel.experiences.addExperience') }}
            </UiButton>
          </div>
          <div class="bg-white rounded-xl shadow-soft p-4">
            <TripExperiencesExperienceTimeline
              :experiences="experiences"
              :loading="experiencesLoading"
              @edit="openEditExperience"
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
        @submit="handleExperienceSubmit"
        @cancel="showExperienceModal = false"
        @delete="handleExperienceDelete"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { DestinationForm, ExperienceForm, Experience } from '~/types'
import { useCityImage, getGradientFallback } from '~/composables/useCityImage'

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
const { getDirectDestinationTasks, createTask, toggleTaskComplete, deleteTask: deleteTaskById } = useTasks()
const destinationDirectTasks = computed(() => getDirectDestinationTasks(destinationId.value))

// Modals
const showEditDestinationModal = ref(false)
const showDeleteDestinationModal = ref(false)
const showExperienceModal = ref(false)

// State
const deleting = ref(false)
const selectedExperience = ref<Experience | null>(null)

// Country flag
const countryFlag = computed(() => {
  const code = destination.value?.countryCode
  if (!code) return ''
  const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
})

// Date range
const dateRange = computed(() => {
  if (!destination.value) return null
  const { arrivalDate, departureDate } = destination.value
  if (!arrivalDate && !departureDate) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }

  if (arrivalDate && departureDate) {
    const a = arrivalDate instanceof Date ? arrivalDate : new Date(arrivalDate)
    const d = departureDate instanceof Date ? departureDate : new Date(departureDate)
    return `${a.toLocaleDateString(dateLocale, formatOptions)} - ${d.toLocaleDateString(dateLocale, formatOptions)}`
  }
  if (arrivalDate) {
    const a = arrivalDate instanceof Date ? arrivalDate : new Date(arrivalDate)
    return a.toLocaleDateString(dateLocale, formatOptions)
  }
  return null
})

// Background image
const cityNameRef = computed(() => destination.value?.name || '')
const { imageUrl: unsplashUrl } = useCityImage(cityNameRef)

const backgroundStyle = computed(() => {
  const url = destination.value?.imageUrl || unsplashUrl.value
  if (url) return { backgroundImage: `url(${url})` }
  return { background: getGradientFallback(destination.value?.order || 0) }
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
function openCreateExperience() {
  selectedExperience.value = null
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
    const result = await createExperience(destinationId.value, tripId.value, data)
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

// Task handlers
async function handleToggleTask(id: string, completed: boolean) {
  await toggleTaskComplete(id, completed)
}

async function handleDeleteTask(id: string) {
  await deleteTaskById(id)
}

async function handleQuickAddTask(data: { title: string; questId: string; subQuestId: string; tripId: string; destinationId: string; experienceId: string; wishId: string }) {
  await createTask({
    title: data.title,
    description: '',
    questId: '',
    subQuestId: '',
    tripId: tripId.value,
    destinationId: destinationId.value,
    accommodationId: '',
    experienceId: '',
    wishId: data.wishId || '',
    timeHorizon: '',
    estimatedTime: '',
  })
}
</script>
