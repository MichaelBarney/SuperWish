<template>
  <div class="w-full">
    <label class="block text-sm font-medium text-gray-700 mb-1.5">
      {{ label || $t('quest.quests.form.icon') }}
    </label>

    <div class="relative" ref="containerRef">
      <!-- Trigger button -->
      <button
        type="button"
        @click="open = !open"
        class="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-accent-500 focus:ring-accent-200 hover:border-gray-300"
      >
        <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
          <Icon :name="modelValue || 'lucide:target'" class="w-5 h-5 text-green-600" />
        </div>
        <span class="text-sm text-gray-600 flex-1 text-left">{{ iconLabel }}</span>
        <Icon
          name="lucide:chevron-down"
          class="w-4 h-4 text-gray-400 transition-transform"
          :class="open ? 'rotate-180' : ''"
        />
      </button>

      <!-- Dropdown -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="open"
          class="absolute z-50 mt-2 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-3 max-h-96 overflow-y-auto"
          ref="dropdownRef"
        >
          <!-- Search -->
          <input
            v-model="search"
            type="text"
            :placeholder="$t('common.search') + '...'"
            class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-500 mb-2"
          />

          <!-- Loading state -->
          <div v-if="loading" class="flex items-center justify-center py-6">
            <Icon name="lucide:loader-2" class="w-5 h-5 text-gray-400 animate-spin" />
          </div>

          <!-- Icon grid -->
          <template v-else>
            <div
              v-for="category in filteredCategories"
              :key="category.label"
              :ref="(el) => setCategoryRef(category.label, el as HTMLElement)"
              class="mb-2"
            >
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1">
                {{ category.label }}
              </p>
              <!-- Lazy: only render icons when category is visible -->
              <template v-if="isSearching || visibleCategories.has(category.label)">
                <div class="grid grid-cols-8 gap-1">
                  <button
                    v-for="icon in category.icons"
                    :key="icon.name"
                    type="button"
                    @click="selectIcon(icon.name)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    :class="modelValue === icon.name
                      ? 'bg-green-100 text-green-600 ring-2 ring-green-400'
                      : 'text-gray-600 hover:bg-gray-100'"
                    :title="icon.label"
                  >
                    <Icon :name="icon.name" class="w-4 h-4" />
                  </button>
                </div>
              </template>
              <!-- Placeholder with estimated height -->
              <div
                v-else
                class="bg-gray-50 rounded-lg"
                :style="{ height: Math.ceil(category.icons.length / 8) * 36 + 'px' }"
              />
            </div>

            <p v-if="filteredCategories.length === 0" class="text-center text-sm text-gray-400 py-4">
              No icons found
            </p>
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const search = ref('')
const containerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const { categories, loading, allIcons } = useLucideIcons()

const iconLabel = computed(() => {
  const found = allIcons.value.find(i => i.name === props.modelValue)
  return found?.label || props.modelValue?.replace('lucide:', '') || 'Target'
})

const isSearching = computed(() => search.value.trim().length > 0)

const filteredCategories = computed(() => {
  if (!search.value.trim()) return categories.value
  const q = search.value.toLowerCase()
  return categories.value
    .map(cat => ({
      ...cat,
      icons: cat.icons.filter(i =>
        i.label.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
      ),
    }))
    .filter(cat => cat.icons.length > 0)
})

// --- Lazy category rendering via IntersectionObserver ---
const visibleCategories = ref(new Set<string>())
const categoryRefs = new Map<string, HTMLElement>()
let observer: IntersectionObserver | null = null

function setCategoryRef(label: string, el: HTMLElement | null) {
  if (el) {
    categoryRefs.set(label, el)
  }
}

function setupObserver() {
  cleanupObserver()
  if (!dropdownRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const label = (entry.target as HTMLElement).dataset.catLabel
          if (label) {
            visibleCategories.value.add(label)
            visibleCategories.value = new Set(visibleCategories.value) // trigger reactivity
            observer?.unobserve(entry.target)
          }
        }
      }
    },
    { root: dropdownRef.value, rootMargin: '200px 0px' }
  )

  // Observe each category element
  nextTick(() => {
    for (const [label, el] of categoryRefs.entries()) {
      el.dataset.catLabel = label
      observer?.observe(el)
    }
  })
}

function cleanupObserver() {
  observer?.disconnect()
  observer = null
}

watch(open, (isOpen) => {
  if (isOpen) {
    visibleCategories.value = new Set()
    categoryRefs.clear()
    nextTick(() => {
      nextTick(() => {
        setupObserver()
      })
    })
  } else {
    cleanupObserver()
    search.value = ''
  }
})

// Re-setup observer when categories finish loading (fetch completes while dropdown is open)
watch(loading, (isLoading) => {
  if (!isLoading && open.value) {
    nextTick(() => {
      nextTick(() => {
        setupObserver()
      })
    })
  }
})

function selectIcon(name: string) {
  emit('update:modelValue', name)
  open.value = false
  search.value = ''
}

// Close on outside click
function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  cleanupObserver()
})
</script>
