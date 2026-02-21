<template>
  <GridLayout columns="*, auto" style="padding: 8 16; background-color: white; border-top-width: 1; border-top-color: #e5e7eb;">
    <TextField
      col="0"
      v-model="title"
      hint="Add a task..."
      returnKeyType="done"
      @returnPress="handleAdd"
      style="margin-right: 8;"
    />
    <Button
      col="1"
      text="Add"
      class="btn-primary"
      :isEnabled="title.trim().length > 0"
      @tap="handleAdd"
      style="padding: 8 16; font-size: 14;"
    />
  </GridLayout>
</template>

<script setup lang="ts">
import { ref } from 'nativescript-vue'
import type { TaskTimeHorizon } from '@superwish/shared'

const props = defineProps<{
  currentTimeHorizon: TaskTimeHorizon | null
}>()

const emit = defineEmits<{
  (e: 'add', title: string): void
}>()

const title = ref('')

function handleAdd() {
  const trimmed = title.value.trim()
  if (!trimmed) return
  emit('add', trimmed)
  title.value = ''
}
</script>
