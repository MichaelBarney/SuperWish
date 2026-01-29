<template>
  <div class="flex gap-2 mb-2">
    <UiInput
      :model-value="modelValue.label"
      @update:model-value="updateField('label', $event)"
      :placeholder="$t('travel.transportation.form.linkLabel')"
      class="w-1/3"
    />
    <UiInput
      :model-value="modelValue.url"
      @update:model-value="updateField('url', $event)"
      type="url"
      :placeholder="$t('travel.transportation.form.linkUrl')"
      class="flex-1"
    />
    <button
      type="button"
      @click="$emit('remove')"
      class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TransportationLink } from '~/types'

interface Props {
  modelValue: TransportationLink
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: TransportationLink]
  remove: []
}>()

function updateField(field: keyof TransportationLink, value: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value,
  })
}
</script>
