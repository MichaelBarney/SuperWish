<template>
  <div>
    <!-- Step 1: Category selection -->
    <TaskInlineSearchPicker
      v-if="!selectedCategory"
      :model-value="modelValue"
      :items="categoryItems"
      :search-placeholder="$t('task.experiencePicker.searchCategory')"
      :no-results-text="$t('task.blockerPicker.noResults')"
      accent-color="rose"
      search-field="name"
      @update:model-value="handleCategoryClose"
      @select="handleCategorySelect"
    >
      <template #item="{ item }">
        <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
          <Icon :name="item.icon" class="w-4 h-4 text-rose-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
        </div>
      </template>
    </TaskInlineSearchPicker>

    <!-- Step 2: City selection (optional, custom inline picker for dynamic search) -->
    <div
      v-if="selectedCategory && modelValue"
      ref="cityContainerRef"
      class="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
    >
      <div class="p-2 border-b border-gray-100">
        <input
          ref="citySearchRef"
          v-model="citySearchQuery"
          type="text"
          :placeholder="$t('task.experiencePicker.selectCity')"
          class="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
          @keydown.escape="handleCityClose(false)"
        />
      </div>
      <div class="max-h-64 overflow-y-auto">
        <button
          @click="skipCity"
          class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
        >
          <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <Icon name="lucide:skip-forward" class="w-4 h-4 text-gray-400" />
          </div>
          <span class="text-sm text-gray-500">{{ $t('task.experiencePicker.skipCity') }}</span>
        </button>
        <div v-if="citySearchQuery.length >= 2 && cityResults.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
          {{ $t('task.blockerPicker.noResults') }}
        </div>
        <button
          v-for="city in cityResults"
          :key="city.id"
          @click="handleCitySelect(city)"
          class="w-full flex items-center gap-3 px-3 py-2 hover:bg-rose-50 transition-colors text-left"
        >
          <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
            <Icon name="lucide:map-pin" class="w-4 h-4 text-rose-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ city.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ city.country }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExperienceCategory } from '~/types'
import { EXPERIENCE_CATEGORIES } from '~/types'

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: 'lucide:utensils',
  attraction: 'lucide:landmark',
  museum: 'lucide:building-2',
  outdoor: 'lucide:trees',
  activity: 'lucide:dumbbell',
  nightlife: 'lucide:moon',
  shopping: 'lucide:shopping-bag',
  day_trip: 'lucide:map-pin',
  event: 'lucide:party-popper',
  other: 'lucide:circle-dot',
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [data: { category: ExperienceCategory; city: string; country: string; countryCode: string }]
}>()

const { t } = useI18n()
const { loadCities, filterCities } = useCityAutocomplete()

const selectedCategory = ref<ExperienceCategory | null>(null)
const citySearchQuery = ref('')
const citySearchRef = ref<HTMLInputElement | null>(null)
const cityContainerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  loadCities()
})

const categoryItems = computed(() => {
  return EXPERIENCE_CATEGORIES.map(cat => ({
    id: cat.value,
    name: t(`trip.experiences.categories.${cat.value}`),
    icon: CATEGORY_ICONS[cat.value] || 'lucide:circle-dot',
    value: cat.value,
  }))
})

const cityResults = computed(() => {
  if (!citySearchQuery.value || citySearchQuery.value.length < 2) return []
  return filterCities(citySearchQuery.value, 20).map(c => ({
    id: `${c.name}-${c.countryCode}`,
    name: c.name,
    country: c.country,
    countryCode: c.countryCode,
  }))
})

function handleCategoryClose(value: boolean) {
  if (!value && !selectedCategory.value) {
    emit('update:modelValue', false)
  }
}

function handleCategorySelect(item: any) {
  selectedCategory.value = item.value as ExperienceCategory
  citySearchQuery.value = ''
  nextTick(() => {
    citySearchRef.value?.focus()
    document.addEventListener('click', handleCityClickOutside)
  })
}

function handleCitySelect(city: any) {
  document.removeEventListener('click', handleCityClickOutside)
  emit('select', {
    category: selectedCategory.value!,
    city: city.name,
    country: city.country,
    countryCode: city.countryCode,
  })
  emit('update:modelValue', false)
  selectedCategory.value = null
}

function skipCity() {
  document.removeEventListener('click', handleCityClickOutside)
  emit('select', {
    category: selectedCategory.value!,
    city: '',
    country: '',
    countryCode: '',
  })
  emit('update:modelValue', false)
  selectedCategory.value = null
}

function handleCityClose(value: boolean) {
  if (!value) {
    document.removeEventListener('click', handleCityClickOutside)
    selectedCategory.value = null
    emit('update:modelValue', false)
  }
}

function handleCityClickOutside(e: MouseEvent) {
  if (cityContainerRef.value && !cityContainerRef.value.contains(e.target as Node)) {
    handleCityClose(false)
  }
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    document.removeEventListener('click', handleCityClickOutside)
    selectedCategory.value = null
    citySearchQuery.value = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleCityClickOutside)
})
</script>
