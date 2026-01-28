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
    <div v-else>
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
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
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
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  storagePath: string
  previewClass?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { uploadImage, uploading, progress, error: uploadError } = useImageUpload()

const mode = ref<'url' | 'upload'>('upload')
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageLoadError = ref(false)

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
