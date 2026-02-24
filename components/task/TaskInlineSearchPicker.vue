<template>
  <div v-if="modelValue" ref="containerRef" class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
    <!-- Search -->
    <div class="p-2 border-b border-gray-100">
      <input
        ref="searchRef"
        v-model="searchQuery"
        type="text"
        :placeholder="searchPlaceholder"
        class="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
        :class="ringClass"
        @keydown="handleSearchKeydown"
      />
    </div>

    <!-- Results -->
    <div ref="listRef" class="max-h-64 overflow-y-auto">
      <slot name="before-list" />
      <div v-if="filteredItems.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
        {{ noResultsText }}
      </div>
      <button
        v-for="(item, idx) in filteredItems"
        :key="item.id"
        :ref="el => { if (idx === activeIndex) activeItemRef = el as HTMLElement | null }"
        @click="selectItem(item)"
        class="w-full flex items-center gap-3 px-3 py-2 transition-colors text-left"
        :class="idx === activeIndex ? activeClass : hoverClass"
      >
        <slot name="item" :item="item">
          <span class="text-sm text-gray-900 truncate">{{ item[searchField] }}</span>
        </slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  items: readonly Record<string, any>[]
  searchPlaceholder?: string
  noResultsText?: string
  accentColor?: 'teal' | 'orange' | 'green' | 'red' | 'purple' | 'rose'
  searchField?: string
  excludeIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Search...',
  noResultsText: 'No results found',
  accentColor: 'teal',
  searchField: 'title',
  excludeIds: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [item: any]
}>()

const searchQuery = ref('')
const searchRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const activeItemRef = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

const ringClass = computed(() => {
  switch (props.accentColor) {
    case 'teal': return 'focus:ring-teal-300 focus:border-teal-400'
    case 'orange': return 'focus:ring-orange-300 focus:border-orange-400'
    case 'green': return 'focus:ring-green-300 focus:border-green-400'
    case 'red': return 'focus:ring-red-300 focus:border-red-400'
    case 'purple': return 'focus:ring-purple-300 focus:border-purple-400'
    case 'rose': return 'focus:ring-rose-300 focus:border-rose-400'
    default: return 'focus:ring-teal-300 focus:border-teal-400'
  }
})

const hoverClass = computed(() => {
  switch (props.accentColor) {
    case 'teal': return 'hover:bg-teal-50'
    case 'orange': return 'hover:bg-orange-50'
    case 'green': return 'hover:bg-green-50'
    case 'red': return 'hover:bg-red-50'
    case 'purple': return 'hover:bg-purple-50'
    case 'rose': return 'hover:bg-rose-50'
    default: return 'hover:bg-teal-50'
  }
})

const activeClass = computed(() => {
  switch (props.accentColor) {
    case 'teal': return 'bg-teal-50'
    case 'orange': return 'bg-orange-50'
    case 'green': return 'bg-green-50'
    case 'red': return 'bg-red-50'
    case 'purple': return 'bg-purple-50'
    case 'rose': return 'bg-rose-50'
    default: return 'bg-teal-50'
  }
})

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return props.items.filter(item => {
    if (props.excludeIds.includes(item.id)) return false
    if (!q) return true
    const fieldValue = item[props.searchField]
    return typeof fieldValue === 'string' && fieldValue.toLowerCase().includes(q)
  })
})

watch(filteredItems, () => {
  activeIndex.value = 0
})

function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (filteredItems.value.length === 0) return
    activeIndex.value = activeIndex.value >= filteredItems.value.length - 1
      ? 0
      : activeIndex.value + 1
    nextTick(() => activeItemRef.value?.scrollIntoView({ block: 'nearest' }))
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (filteredItems.value.length === 0) return
    activeIndex.value = activeIndex.value <= 0
      ? filteredItems.value.length - 1
      : activeIndex.value - 1
    nextTick(() => activeItemRef.value?.scrollIntoView({ block: 'nearest' }))
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredItems.value.length > 0 && activeIndex.value < filteredItems.value.length) {
      selectItem(filteredItems.value[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    emit('update:modelValue', false)
  }
}

function selectItem(item: any) {
  emit('select', item)
  emit('update:modelValue', false)
  searchQuery.value = ''
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
    searchQuery.value = ''
    activeIndex.value = 0
    nextTick(() => {
      searchRef.value?.focus()
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    })
  } else {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
  }
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>
