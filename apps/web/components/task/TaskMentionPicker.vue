<template>
  <div
    v-if="modelValue"
    ref="containerRef"
    class="absolute left-0 top-full mt-1 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
  >
    <div class="py-1">
      <button
        v-for="mention in filteredMentions"
        :key="mention.key"
        @click.stop="selectMention(mention.key)"
        class="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-orange-50 transition-colors text-left"
      >
        <Icon :name="mention.icon" class="w-4 h-4" :class="mention.iconClass" />
        <span class="text-sm font-medium text-gray-700">{{ mention.label }}</span>
      </button>
      <div v-if="filteredMentions.length === 0" class="px-3 py-3 text-center text-xs text-gray-400">
        {{ $t('task.blockerPicker.noResults') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  query: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [mentionType: string]
}>()

const { t } = useI18n()
const containerRef = ref<HTMLElement | null>(null)

const mentionTypes = computed(() => [
  { key: 'wish', label: t('task.mentions.wish'), icon: 'lucide:star', iconClass: 'text-teal-500' },
])

const filteredMentions = computed(() => {
  const q = props.query.toLowerCase().trim()
  if (!q) return mentionTypes.value
  return mentionTypes.value.filter(m => m.label.toLowerCase().includes(q) || m.key.includes(q))
})

function selectMention(key: string) {
  emit('select', key)
  emit('update:modelValue', false)
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    emit('update:modelValue', false)
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>
