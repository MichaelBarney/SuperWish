<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- City Name with Autocomplete -->
      <TravelDestinationsCityAutocomplete
        v-model="form.name"
        :label="$t('travel.destinations.form.name')"
        :placeholder="$t('travel.destinations.form.namePlaceholder')"
        :error="errors.name"
        required
        @city-selected="handleCitySelected"
      />

      <!-- Country (auto-filled but editable) -->
      <UiInput
        v-model="form.country"
        :label="$t('travel.destinations.form.country')"
        :placeholder="$t('travel.destinations.form.countryPlaceholder')"
        :error="errors.country"
        :hint="countryAutoFilled ? $t('travel.destinations.form.countryAutoFilled') : undefined"
        required
      />

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.arrivalDate"
          type="date"
          :label="$t('travel.destinations.form.arrivalDate')"
        />
        <UiInput
          v-model="form.departureDate"
          type="date"
          :label="$t('travel.destinations.form.departureDate')"
        />
      </div>

      <!-- Notes -->
      <UiTextarea
        v-model="form.notes"
        :label="$t('travel.destinations.form.notes')"
        :placeholder="$t('travel.destinations.form.notesPlaceholder')"
        :rows="3"
      />
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
      <UiButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" :loading="submitting">
        {{ initialData ? $t('common.save') : $t('common.add') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { DestinationForm, Destination, CitySelection } from '~/types'

interface Props {
  initialData?: Destination
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: DestinationForm]
  cancel: []
}>()

const submitting = ref(false)
const countryAutoFilled = ref(false)

// Handle city selection from autocomplete
const handleCitySelected = (city: CitySelection) => {
  form.value.country = city.country
  form.value.countryCode = city.countryCode
  countryAutoFilled.value = true
}

const form = ref<DestinationForm>({
  name: props.initialData?.name || '',
  country: props.initialData?.country || '',
  countryCode: props.initialData?.countryCode || '',
  arrivalDate: props.initialData?.arrivalDate
    ? (props.initialData.arrivalDate instanceof Date
        ? props.initialData.arrivalDate.toISOString().split('T')[0]
        : new Date(props.initialData.arrivalDate).toISOString().split('T')[0])
    : '',
  departureDate: props.initialData?.departureDate
    ? (props.initialData.departureDate instanceof Date
        ? props.initialData.departureDate.toISOString().split('T')[0]
        : new Date(props.initialData.departureDate).toISOString().split('T')[0])
    : '',
  notes: props.initialData?.notes || '',
  imageUrl: props.initialData?.imageUrl || '',
})

const errors = ref<{ name?: string; country?: string }>({})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
    return false
  }

  if (!form.value.country.trim()) {
    errors.value.country = 'Country is required'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  emit('submit', { ...form.value })
  submitting.value = false
}

// Update form when initialData changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value = {
      name: newData.name || '',
      country: newData.country || '',
      countryCode: newData.countryCode || '',
      arrivalDate: newData.arrivalDate
        ? (newData.arrivalDate instanceof Date
            ? newData.arrivalDate.toISOString().split('T')[0]
            : new Date(newData.arrivalDate).toISOString().split('T')[0])
        : '',
      departureDate: newData.departureDate
        ? (newData.departureDate instanceof Date
            ? newData.departureDate.toISOString().split('T')[0]
            : new Date(newData.departureDate).toISOString().split('T')[0])
        : '',
      notes: newData.notes || '',
      imageUrl: newData.imageUrl || '',
    }
  }
}, { immediate: true })
</script>
