<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Trip Name -->
      <UiInput
        v-model="form.name"
        :label="$t('travel.trips.form.name')"
        :placeholder="$t('travel.trips.form.namePlaceholder')"
        :error="errors.name"
        required
      />

      <!-- Description -->
      <UiTextarea
        v-model="form.description"
        :label="$t('travel.trips.form.description')"
        :placeholder="$t('travel.trips.form.descriptionPlaceholder')"
        :rows="3"
      />

      <!-- Origin Section -->
      <div class="border-t border-gray-100 pt-4 mt-4">
        <h3 class="text-sm font-medium text-gray-700 mb-3">
          {{ $t('travel.trips.form.origin') }}
        </h3>
        <div class="grid grid-cols-2 gap-4">
          <UiInput
            v-model="form.originName"
            :label="$t('travel.trips.form.originCity')"
            :placeholder="$t('travel.trips.form.originCityPlaceholder')"
          />
          <UiInput
            v-model="form.originCountry"
            :label="$t('travel.trips.form.originCountry')"
            :placeholder="$t('travel.trips.form.originCountryPlaceholder')"
          />
        </div>
      </div>

      <!-- Cover Image -->
      <UiImageUpload
        v-model="form.coverUrl"
        :label="$t('travel.trips.form.coverImage')"
        storage-path="trips"
      />

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.startDate"
          type="date"
          :label="$t('travel.trips.form.startDate')"
        />
        <UiInput
          v-model="form.endDate"
          type="date"
          :label="$t('travel.trips.form.endDate')"
        />
      </div>

      <!-- Base Currency -->
      <UiSelect
        v-model="form.baseCurrency"
        :label="$t('travel.trips.form.baseCurrency')"
        :hint="$t('travel.trips.form.baseCurrencyHint')"
      >
        <option v-for="currency in CURRENCIES" :key="currency.code" :value="currency.code">
          {{ currency.symbol }} {{ currency.code }} - {{ currency.name }}
        </option>
      </UiSelect>

      <!-- Total Budget -->
      <UiInput
        v-model="form.totalBudget"
        type="number"
        :label="$t('travel.trips.form.totalBudget')"
        :placeholder="$t('travel.trips.form.totalBudgetPlaceholder')"
        min="0"
        step="0.01"
      />

      <!-- Status (only show when editing) -->
      <UiSelect
        v-if="initialData"
        v-model="form.status"
        :label="$t('wishes.form.status')"
      >
        <option v-for="status in TRIP_STATUSES" :key="status.value" :value="status.value">
          {{ $t(`travel.trips.status.${status.value}`) }}
        </option>
      </UiSelect>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
      <UiButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" :loading="submitting">
        {{ initialData ? $t('common.save') : $t('travel.trips.form.createTrip') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TripForm, Trip, TripStatus } from '~/types'
import { CURRENCIES, TRIP_STATUSES } from '~/types'

interface Props {
  initialData?: Trip
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: TripForm]
  cancel: []
}>()

const submitting = ref(false)

const form = ref<TripForm>({
  name: props.initialData?.name || '',
  description: props.initialData?.description || '',
  coverUrl: props.initialData?.coverUrl || '',
  startDate: props.initialData?.startDate
    ? (props.initialData.startDate instanceof Date
        ? props.initialData.startDate.toISOString().split('T')[0]
        : new Date(props.initialData.startDate).toISOString().split('T')[0])
    : '',
  endDate: props.initialData?.endDate
    ? (props.initialData.endDate instanceof Date
        ? props.initialData.endDate.toISOString().split('T')[0]
        : new Date(props.initialData.endDate).toISOString().split('T')[0])
    : '',
  baseCurrency: props.initialData?.baseCurrency || 'USD',
  totalBudget: props.initialData?.totalBudget?.toString() || '',
  status: (props.initialData?.status || 'planning') as TripStatus,
  originName: props.initialData?.origin?.name || '',
  originCountry: props.initialData?.origin?.country || '',
  originCountryCode: props.initialData?.origin?.countryCode || '',
})

const errors = ref<{ name?: string }>({})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'travel.trips.form.nameRequired'
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
      description: newData.description || '',
      coverUrl: newData.coverUrl || '',
      startDate: newData.startDate
        ? (newData.startDate instanceof Date
            ? newData.startDate.toISOString().split('T')[0]
            : new Date(newData.startDate).toISOString().split('T')[0])
        : '',
      endDate: newData.endDate
        ? (newData.endDate instanceof Date
            ? newData.endDate.toISOString().split('T')[0]
            : new Date(newData.endDate).toISOString().split('T')[0])
        : '',
      baseCurrency: newData.baseCurrency || 'USD',
      totalBudget: newData.totalBudget?.toString() || '',
      status: (newData.status || 'planning') as TripStatus,
      originName: newData.origin?.name || '',
      originCountry: newData.origin?.country || '',
      originCountryCode: newData.origin?.countryCode || '',
    }
  }
}, { immediate: true })
</script>
