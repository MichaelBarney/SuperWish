<template>
  <div>
    <!-- Collapsed state -->
    <button
      v-if="!expanded"
      @click="expand"
      class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      {{ $t('task.task.addTask') }}
    </button>

    <!-- Expanded state -->
    <div v-else class="px-3 py-2">
      <input
        ref="inputRef"
        v-model="title"
        type="text"
        :placeholder="$t('task.form.titlePlaceholder')"
        class="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none"
        @keydown.enter="submit"
        @keydown.escape="collapse"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  questId?: string
  subQuestId?: string
  tripId?: string
  destinationId?: string
}

const props = withDefaults(defineProps<Props>(), {
  questId: '',
  subQuestId: '',
  tripId: '',
  destinationId: '',
})

const emit = defineEmits<{
  add: [data: { title: string; questId: string; subQuestId: string; tripId: string; destinationId: string }]
}>()

const expanded = ref(false)
const title = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function expand() {
  expanded.value = true
  nextTick(() => inputRef.value?.focus())
}

function collapse() {
  expanded.value = false
  title.value = ''
}

function submit() {
  if (!title.value.trim()) return
  emit('add', {
    title: title.value.trim(),
    questId: props.questId,
    subQuestId: props.subQuestId,
    tripId: props.tripId,
    destinationId: props.destinationId,
  })
  title.value = ''
  nextTick(() => inputRef.value?.focus())
}
</script>
