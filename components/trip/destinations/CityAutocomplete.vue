<template>
  <UiAutocomplete
    :model-value="modelValue"
    :items="suggestions"
    :loading="citiesLoading"
    :label="label"
    :placeholder="placeholder"
    :error="error"
    :required="required"
    :min-chars="2"
    :max-results="10"
    :debounce-ms="100"
    :no-results-text="$t('travel.destinations.form.noCitiesFound')"
    :clearable="true"
    @update:model-value="handleInputChange"
    @select="handleCitySelect"
  >
    <template #item="{ item, highlighted }">
      <div class="flex items-center justify-between">
        <div>
          <span :class="highlighted ? 'font-medium' : ''">{{ item.name }}</span>
          <span class="text-gray-400 ml-1.5">{{ item.country }}</span>
        </div>
        <span class="text-xs text-gray-400 ml-2">{{ item.countryCode }}</span>
      </div>
    </template>
  </UiAutocomplete>
</template>

<script setup lang="ts">
import type { City, CitySelection } from '~/types'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'city-selected': [city: CitySelection]
}>()

const { loadCities, filterCities, loading: citiesLoading } = useCityAutocomplete()

// Load cities on component mount
onMounted(() => {
  loadCities()
})

// Computed suggestions based on input
const suggestions = ref<City[]>([])

// Watch for input changes and filter cities
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue.length >= 2) {
    suggestions.value = filterCities(newValue)
  } else {
    suggestions.value = []
  }
}, { immediate: true })

const handleInputChange = (value: string) => {
  emit('update:modelValue', value)
}

const handleCitySelect = (city: City) => {
  emit('update:modelValue', city.name)
  emit('city-selected', {
    name: city.name,
    country: city.country,
    countryCode: city.countryCode,
  })
}
</script>
