<template>
  <div>
    <!-- Upload Button -->
    <input
      ref="fileInput"
      type="file"
      accept=".pdf,image/*"
      class="hidden"
      @change="handleFileChange"
    />
    <button
      type="button"
      @click="fileInput?.click()"
      :disabled="uploading"
      class="w-full py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="uploading" class="flex items-center justify-center gap-2">
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ $t('common.uploading') }} {{ progress }}%
      </span>
      <span v-else class="flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {{ $t('travel.transportation.form.uploadDocument') }}
      </span>
    </button>

    <!-- Error Message -->
    <p v-if="uploadError" class="mt-2 text-sm text-red-500">
      {{ uploadError }}
    </p>

    <!-- Document List -->
    <div v-if="modelValue.length" class="mt-3 space-y-2">
      <div
        v-for="doc in modelValue"
        :key="doc.id"
        class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
      >
        <component :is="getDocIcon(doc.type)" class="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span class="flex-1 text-sm truncate">{{ doc.name }}</span>
        <a
          :href="doc.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-purple-600 text-sm hover:underline"
        >
          {{ $t('common.view') }}
        </a>
        <button
          type="button"
          @click="removeDocument(doc)"
          class="p-1 text-red-400 hover:text-red-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, defineComponent } from 'vue'
import type { TransportationDocument } from '~/types'

interface Props {
  modelValue: TransportationDocument[]
  storagePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  storagePath: 'transportations',
})

const emit = defineEmits<{
  'update:modelValue': [value: TransportationDocument[]]
}>()

const { uploadFile, deleteFile, uploading, progress, error: uploadError } = useFileUpload()

const fileInput = ref<HTMLInputElement | null>(null)

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const result = await uploadFile(file, props.storagePath)
  if (result) {
    emit('update:modelValue', [...props.modelValue, result])
  }

  // Reset input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function removeDocument(doc: TransportationDocument) {
  // Try to delete from storage (ignore errors if file doesn't exist)
  await deleteFile(doc.url)

  // Remove from list
  emit('update:modelValue', props.modelValue.filter(d => d.id !== doc.id))
}

function getDocIcon(type: string) {
  if (type === 'pdf') return IconPdf
  if (type === 'image') return IconImage
  return IconFile
}

// Icon components
const IconPdf = defineComponent({
  render() {
    return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
      })
    ])
  }
})

const IconImage = defineComponent({
  render() {
    return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
      })
    ])
  }
})

const IconFile = defineComponent({
  render() {
    return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      })
    ])
  }
})
</script>
