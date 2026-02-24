<template>
  <div
    v-if="modelValue"
    ref="containerRef"
    class="absolute left-0 top-full mt-1 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
  >
    <div class="py-1">
      <button
        v-for="(mention, idx) in filteredMentions"
        :key="mention.key"
        @click.stop="selectMention(mention.key)"
        class="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left"
        :class="idx === activeIndex ? 'bg-orange-50' : 'hover:bg-orange-50'"
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
const activeIndex = ref(0)

const mentionTypes = computed(() => [
  { key: 'wish', label: t('task.mentions.createWish'), icon: 'lucide:star', iconClass: 'text-teal-500' },
  { key: 'experience', label: t('task.mentions.createExperience'), icon: 'lucide:sparkles', iconClass: 'text-rose-500' },
])

const filteredMentions = computed(() => {
  const q = props.query.toLowerCase().trim()
  if (!q) return mentionTypes.value
  return mentionTypes.value.filter(m =>
    m.label.toLowerCase().includes(q) || m.key.includes(q) || (m.key === 'experience' && 'xp'.includes(q))
  )
})

// Reset active index when filtered list changes or picker opens
watch(filteredMentions, () => {
  activeIndex.value = 0
})

watch(() => props.modelValue, (open) => {
  if (open) {
    activeIndex.value = 0
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

function selectMention(key: string) {
  emit('select', key)
  emit('update:modelValue', false)
}

function moveUp() {
  if (filteredMentions.value.length === 0) return
  activeIndex.value = activeIndex.value <= 0
    ? filteredMentions.value.length - 1
    : activeIndex.value - 1
}

function moveDown() {
  if (filteredMentions.value.length === 0) return
  activeIndex.value = activeIndex.value >= filteredMentions.value.length - 1
    ? 0
    : activeIndex.value + 1
}

function confirmActive() {
  if (filteredMentions.value.length === 0) return
  const mention = filteredMentions.value[activeIndex.value]
  if (mention) {
    selectMention(mention.key)
  }
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    emit('update:modelValue', false)
  }
}

defineExpose({
  moveUp,
  moveDown,
  confirmActive,
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
