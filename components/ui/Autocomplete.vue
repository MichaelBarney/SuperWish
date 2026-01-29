<template>
  <div class="w-full relative" ref="containerRef">
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700 mb-1.5"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative">
      <input
        :id="id"
        ref="inputRef"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        autocomplete="off"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.escape="closeDropdown"
        @keydown.tab="closeDropdown"
        :class="[
          'w-full rounded-xl border bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-gray-50 disabled:cursor-not-allowed',
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-accent-500 focus:ring-accent-200',
        ]"
      />

      <!-- Loading indicator -->
      <div v-if="loading" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <svg class="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Clear button -->
      <button
        v-else-if="modelValue && clearable && !disabled"
        type="button"
        @mousedown.prevent="clearInput"
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="showDropdown && (filteredItems.length > 0 || (noResultsText && modelValue.length >= minChars))"
        ref="dropdownRef"
        class="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-auto"
      >
        <!-- No results message -->
        <div v-if="filteredItems.length === 0 && noResultsText" class="px-4 py-3 text-sm text-gray-500">
          {{ noResultsText }}
        </div>

        <!-- Results list -->
        <button
          v-for="(item, index) in filteredItems"
          :key="getItemKey(item, index)"
          type="button"
          @mousedown.prevent="selectItem(item)"
          @mouseenter="highlightedIndex = index"
          :class="[
            'w-full px-4 py-2.5 text-left text-sm transition-colors',
            index === highlightedIndex ? 'bg-purple-50 text-purple-900' : 'text-gray-700 hover:bg-gray-50'
          ]"
        >
          <slot name="item" :item="item" :highlighted="index === highlightedIndex">
            {{ getItemLabel(item) }}
          </slot>
        </button>
      </div>
    </Transition>

    <p v-if="error" class="mt-1.5 text-sm text-red-500">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-sm text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  items: any[]
  itemLabel?: string | ((item: any) => string)
  itemKey?: string | ((item: any) => string)
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  loading?: boolean
  minChars?: number
  maxResults?: number
  debounceMs?: number
  noResultsText?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  loading: false,
  minChars: 2,
  maxResults: 10,
  debounceMs: 150,
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select': [item: any]
  'clear': []
}>()

const id = `autocomplete-${Math.random().toString(36).substr(2, 9)}`
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Filtered items based on minChars
const filteredItems = computed(() => {
  if (props.modelValue.length < props.minChars) return []
  return props.items.slice(0, props.maxResults)
})

// Get item label for display
const getItemLabel = (item: any): string => {
  if (typeof props.itemLabel === 'function') {
    return props.itemLabel(item)
  }
  if (typeof props.itemLabel === 'string') {
    return item[props.itemLabel]
  }
  if (typeof item === 'string') {
    return item
  }
  return item.name || item.label || String(item)
}

// Get item key for v-for
const getItemKey = (item: any, index: number): string => {
  if (typeof props.itemKey === 'function') {
    return props.itemKey(item)
  }
  if (typeof props.itemKey === 'string') {
    return item[props.itemKey]
  }
  return `item-${index}`
}

// Handle input changes with debounce
const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value

  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  debounceTimer.value = setTimeout(() => {
    emit('update:modelValue', value)
    if (value.length >= props.minChars) {
      showDropdown.value = true
      highlightedIndex.value = -1
    }
  }, props.debounceMs)

  // Emit immediately for responsive typing, debounce search
  emit('update:modelValue', value)
}

// Handle input focus
const handleFocus = () => {
  if (props.modelValue.length >= props.minChars && filteredItems.value.length > 0) {
    showDropdown.value = true
  }
}

// Handle input blur
const handleBlur = () => {
  // Delay closing to allow click on dropdown items
  setTimeout(() => {
    showDropdown.value = false
    highlightedIndex.value = -1
  }, 150)
}

// Keyboard navigation
const navigateDown = () => {
  if (!showDropdown.value && props.modelValue.length >= props.minChars) {
    showDropdown.value = true
    return
  }
  if (highlightedIndex.value < filteredItems.value.length - 1) {
    highlightedIndex.value++
    scrollToHighlighted()
  }
}

const navigateUp = () => {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
    scrollToHighlighted()
  }
}

const scrollToHighlighted = () => {
  nextTick(() => {
    if (dropdownRef.value && highlightedIndex.value >= 0) {
      const items = dropdownRef.value.querySelectorAll('button')
      const highlightedItem = items[highlightedIndex.value]
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  })
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredItems.value.length) {
    selectItem(filteredItems.value[highlightedIndex.value])
  }
}

// Select an item from the dropdown
const selectItem = (item: any) => {
  const label = getItemLabel(item)
  emit('update:modelValue', label)
  emit('select', item)
  showDropdown.value = false
  highlightedIndex.value = -1
}

// Clear input
const clearInput = () => {
  emit('update:modelValue', '')
  emit('clear')
  showDropdown.value = false
  highlightedIndex.value = -1
  inputRef.value?.focus()
}

// Close dropdown
const closeDropdown = () => {
  showDropdown.value = false
  highlightedIndex.value = -1
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue.length >= props.minChars && filteredItems.value.length > 0) {
    // Don't auto-open if user just selected an item
  } else {
    showDropdown.value = false
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
})
</script>
