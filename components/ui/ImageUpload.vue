<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1.5">
      {{ label }}
    </label>

    <!-- Mode toggle -->
    <div class="flex gap-2 mb-2">
      <button
        type="button"
        @click="mode = 'upload'"
        :class="[
          'px-3 py-1 text-xs rounded-lg transition-colors',
          mode === 'upload'
            ? 'bg-accent-100 text-accent-700'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        ]"
      >
        {{ $t('imageUpload.upload') }}
      </button>
      <button
        type="button"
        @click="mode = 'url'"
        :class="[
          'px-3 py-1 text-xs rounded-lg transition-colors',
          mode === 'url'
            ? 'bg-accent-100 text-accent-700'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        ]"
      >
        {{ $t('imageUpload.url') }}
      </button>
      <button
        type="button"
        @click="mode = 'unsplash'"
        :class="[
          'px-3 py-1 text-xs rounded-lg transition-colors',
          mode === 'unsplash'
            ? 'bg-accent-100 text-accent-700'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        ]"
      >
        {{ $t('imageUpload.unsplash') }}
      </button>
    </div>

    <!-- URL mode -->
    <div v-if="mode === 'url'">
      <UiInput
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        type="url"
        :placeholder="$t('imageUpload.urlPlaceholder')"
      />
    </div>

    <!-- Upload mode -->
    <div v-else-if="mode === 'upload'">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        class="hidden"
        @change="handleFileSelect"
      />
      <button
        type="button"
        @click="fileInputRef?.click()"
        :disabled="uploading"
        class="w-full py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-accent-300 hover:text-accent-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon name="lucide:image" class="w-5 h-5" />
        {{ uploading ? $t('imageUpload.uploading') : $t('imageUpload.chooseImage') }}
      </button>

      <!-- Progress bar -->
      <div v-if="uploading" class="mt-2">
        <div class="w-full bg-gray-200 rounded-full h-1.5">
          <div
            class="bg-accent-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          />
        </div>
        <p class="text-xs text-gray-400 mt-1">{{ progress }}%</p>
      </div>

      <!-- Upload error -->
      <p v-if="uploadError" class="mt-1.5 text-sm text-red-500">
        {{ uploadError }}
      </p>
    </div>

    <!-- Unsplash mode -->
    <div v-else>
      <!-- Search field -->
      <div class="flex gap-2 mb-3">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('imageUpload.searchPlaceholder')"
          class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
          @keyup="handleSearchKeyup"
        />
        <button
          type="button"
          @click="fetchUnsplashImages"
          :disabled="unsplashLoading || !searchQuery.trim()"
          class="px-4 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Icon v-if="!unsplashLoading" name="lucide:search" class="w-4 h-4" />
          <Icon v-else name="svg-spinners:ring-resize" class="w-4 h-4" />
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="unsplashLoading" class="flex items-center justify-center py-6">
        <svg class="animate-spin h-5 w-5 text-accent-500" fill="none" viewBox="0 0 24 24">
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
          :class="modelValue === image.regular ? 'border-accent-500 ring-2 ring-accent-200' : 'border-transparent hover:border-accent-300'"
        >
          <img
            :src="image.thumb"
            :alt="`Image ${index + 1}`"
            class="w-full h-full object-cover"
          />
          <div
            v-if="modelValue === image.regular"
            class="absolute inset-0 bg-accent-500/20 flex items-center justify-center"
          >
            <svg class="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </button>
      </div>

      <!-- No results -->
      <div v-else-if="hasSearched && !unsplashLoading" class="text-sm text-gray-400 py-4 text-center">
        {{ $t('imageUpload.noResults') }}
      </div>

      <!-- Unsplash attribution -->
      <p v-if="unsplashImages.length > 0" class="text-xs text-gray-400 mt-2">
        {{ $t('imageUpload.poweredByUnsplash') }}
      </p>
    </div>

    <!-- Shared image preview -->
    <div v-if="modelValue && isValidUrl" class="mt-2 relative group inline-block">
      <img
        :src="modelValue"
        alt="Preview"
        :class="previewClass || 'w-20 h-20 object-cover rounded-lg border border-gray-200'"
        @error="imageLoadError = true"
        @load="imageLoadError = false"
      />
      <button
        type="button"
        @click="clearImage"
        class="absolute -top-2 -right-2 p-1 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Icon name="lucide:x" class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const UNSPLASH_ACCESS_KEY = 'yuejBM7Bwy2n9cLSfad_hj1rcGYO2UjnvcvXj0F0Qj4'

interface UnsplashImage {
  thumb: string
  regular: string
}

interface Props {
  modelValue: string
  label?: string
  storagePath: string
  previewClass?: string
  defaultSearchQuery?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { uploadImage, uploading, progress, error: uploadError } = useImageUpload()

const mode = ref<'url' | 'upload' | 'unsplash'>('upload')
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageLoadError = ref(false)

// Unsplash state
const searchQuery = ref(props.defaultSearchQuery || '')
const unsplashImages = ref<UnsplashImage[]>([])
const unsplashLoading = ref(false)
const hasSearched = ref(false)

// Fetch images from Unsplash
async function fetchUnsplashImages() {
  const query = searchQuery.value.trim()
  if (!query) return

  unsplashLoading.value = true
  hasSearched.value = true

  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=10&orientation=landscape`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })

    if (!response.ok) throw new Error('Failed to fetch')

    const data = await response.json()
    unsplashImages.value = data.results?.map((photo: any) => ({
      thumb: photo.urls?.small,
      regular: photo.urls?.regular
    })) || []
  } catch (error) {
    console.warn('Failed to fetch Unsplash images:', error)
    unsplashImages.value = []
  } finally {
    unsplashLoading.value = false
  }
}

// Select an Unsplash image
function selectUnsplashImage(image: UnsplashImage) {
  emit('update:modelValue', image.regular)
}

// Handle search input keyup
function handleSearchKeyup(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    fetchUnsplashImages()
  }
}

// Watch for defaultSearchQuery changes
watch(() => props.defaultSearchQuery, (newQuery) => {
  if (newQuery && !searchQuery.value) {
    searchQuery.value = newQuery
  }
})

const isValidUrl = computed(() => {
  if (!props.modelValue || imageLoadError.value) return false
  try {
    new URL(props.modelValue)
    return true
  } catch {
    return false
  }
})

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const url = await uploadImage(file, props.storagePath)
  if (url) {
    emit('update:modelValue', url)
  }

  // Reset so the same file can be re-selected
  input.value = ''
}

function clearImage() {
  emit('update:modelValue', '')
  imageLoadError.value = false
}

watch(() => props.modelValue, () => {
  imageLoadError.value = false
})
</script>
