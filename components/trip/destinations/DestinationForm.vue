<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- City Name with Autocomplete -->
      <TripDestinationsCityAutocomplete
        v-model="form.name"
        :label="$t('travel.destinations.form.name')"
        :placeholder="$t('travel.destinations.form.namePlaceholder')"
        :error="errors.name"
        required
        @city-selected="handleCitySelected"
      />

      <!-- Country (auto-filled but editable) -->
      <UiInput
        v-model="form.country"
        :label="$t('travel.destinations.form.country')"
        :placeholder="$t('travel.destinations.form.countryPlaceholder')"
        :error="errors.country"
        :hint="countryAutoFilled ? $t('travel.destinations.form.countryAutoFilled') : undefined"
        required
      />

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.arrivalDate"
          type="date"
          :label="$t('travel.destinations.form.arrivalDate')"
        />
        <UiInput
          v-model="form.departureDate"
          type="date"
          :label="$t('travel.destinations.form.departureDate')"
        />
      </div>

      <!-- Cover Image -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          {{ $t('travel.destinations.form.coverImage') }}
        </label>

        <!-- Unsplash suggestions -->
        <div v-if="form.name" class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-gray-500">{{ $t('travel.destinations.form.suggestedImages') }}</span>
            <button
              v-if="!unsplashLoading && unsplashImages.length > 0"
              type="button"
              @click="fetchUnsplashImages"
              class="text-xs text-purple-600 hover:text-purple-700"
            >
              {{ $t('travel.destinations.form.refreshImages') }}
            </button>
          </div>

          <!-- Loading state -->
          <div v-if="unsplashLoading" class="flex items-center justify-center py-4">
            <svg class="animate-spin h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          <!-- Image grid -->
          <div v-else-if="unsplashImages.length > 0" class="grid grid-cols-5 gap-2">
            <button
              v-for="(image, index) in unsplashImages"
              :key="index"
              type="button"
              @click="selectUnsplashImage(image)"
              class="relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all hover:scale-105"
              :class="form.imageUrl === image.regular ? 'border-purple-500 ring-2 ring-purple-200' : 'border-transparent hover:border-purple-300'"
            >
              <img
                :src="image.thumb"
                :alt="`${form.name} ${index + 1}`"
                class="w-full h-full object-cover"
              />
              <div
                v-if="form.imageUrl === image.regular"
                class="absolute inset-0 bg-purple-500/20 flex items-center justify-center"
              >
                <svg class="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>

          <!-- No images found -->
          <div v-else-if="unsplashError" class="text-xs text-gray-400 py-2">
            {{ $t('travel.destinations.form.noImagesFound') }}
          </div>
        </div>

        <!-- Manual upload/URL option -->
        <UiImageUpload
          v-model="form.imageUrl"
          storage-path="destinations"
        />
      </div>

      <!-- Notes -->
      <UiTextarea
        v-model="form.notes"
        :label="$t('travel.destinations.form.notes')"
        :placeholder="$t('travel.destinations.form.notesPlaceholder')"
        :rows="3"
      />
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
      <UiButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton v-if="initialData" type="button" variant="danger" @click="$emit('delete')">
        {{ $t('common.delete') }}
      </UiButton>
      <UiButton type="submit" :loading="submitting">
        {{ initialData ? $t('common.save') : $t('common.add') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { DestinationForm, Destination, CitySelection } from '~/types'

const UNSPLASH_ACCESS_KEY = 'yuejBM7Bwy2n9cLSfad_hj1rcGYO2UjnvcvXj0F0Qj4'

interface Props {
  initialData?: Destination
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: DestinationForm]
  cancel: []
  delete: []
}>()

const submitting = ref(false)
const countryAutoFilled = ref(false)

// Unsplash images state
interface UnsplashImage {
  thumb: string   // Small thumbnail for picker grid
  regular: string // High quality for actual use
}
const unsplashImages = ref<UnsplashImage[]>([])
const unsplashLoading = ref(false)
const unsplashError = ref(false)

// Fetch images from Unsplash
async function fetchUnsplashImages() {
  const cityName = form.value.name.trim()
  if (!cityName) {
    unsplashImages.value = []
    return
  }

  unsplashLoading.value = true
  unsplashError.value = false

  try {
    const query = encodeURIComponent(`${cityName} city skyline`)
    const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=5&orientation=landscape`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })

    if (!response.ok) throw new Error('Failed to fetch')

    const data = await response.json()
    unsplashImages.value = data.results?.map((photo: any) => ({
      thumb: photo.urls?.small,    // 400px for fast thumbnail loading
      regular: photo.urls?.regular  // 1080px for high quality cover
    })) || []

    if (unsplashImages.value.length === 0) {
      unsplashError.value = true
    }
  } catch (error) {
    console.warn('Failed to fetch Unsplash images:', error)
    unsplashImages.value = []
    unsplashError.value = true
  } finally {
    unsplashLoading.value = false
  }
}

// Select an Unsplash image (use high quality version)
function selectUnsplashImage(image: UnsplashImage) {
  form.value.imageUrl = image.regular
}

// Handle city selection from autocomplete
const handleCitySelected = (city: CitySelection) => {
  form.value.country = city.country
  form.value.countryCode = city.countryCode
  countryAutoFilled.value = true
  // Fetch Unsplash images when city is selected
  fetchUnsplashImages()
}

const form = ref<DestinationForm>({
  name: props.initialData?.name || '',
  country: props.initialData?.country || '',
  countryCode: props.initialData?.countryCode || '',
  arrivalDate: props.initialData?.arrivalDate
    ? (props.initialData.arrivalDate instanceof Date
        ? props.initialData.arrivalDate.toISOString().split('T')[0]
        : new Date(props.initialData.arrivalDate).toISOString().split('T')[0])
    : '',
  departureDate: props.initialData?.departureDate
    ? (props.initialData.departureDate instanceof Date
        ? props.initialData.departureDate.toISOString().split('T')[0]
        : new Date(props.initialData.departureDate).toISOString().split('T')[0])
    : '',
  notes: props.initialData?.notes || '',
  imageUrl: props.initialData?.imageUrl || '',
})

const errors = ref<{ name?: string; country?: string }>({})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
    return false
  }

  if (!form.value.country.trim()) {
    errors.value.country = 'Country is required'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  emit('submit', { ...form.value })
  submitting.value = false
}

// Update form when initialData changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value = {
      name: newData.name || '',
      country: newData.country || '',
      countryCode: newData.countryCode || '',
      arrivalDate: newData.arrivalDate
        ? (newData.arrivalDate instanceof Date
            ? newData.arrivalDate.toISOString().split('T')[0]
            : new Date(newData.arrivalDate).toISOString().split('T')[0])
        : '',
      departureDate: newData.departureDate
        ? (newData.departureDate instanceof Date
            ? newData.departureDate.toISOString().split('T')[0]
            : new Date(newData.departureDate).toISOString().split('T')[0])
        : '',
      notes: newData.notes || '',
      imageUrl: newData.imageUrl || '',
    }
    // Fetch Unsplash images for existing destination
    if (newData.name) {
      fetchUnsplashImages()
    }
  }
}, { immediate: true })

// Also fetch when component mounts if there's a name
onMounted(() => {
  if (form.value.name) {
    fetchUnsplashImages()
  }
})
</script>
