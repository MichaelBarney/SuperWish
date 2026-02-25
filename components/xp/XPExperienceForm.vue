<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Trip info banner (read-only for trip-linked experiences) -->
      <div v-if="initialData?.tripId" class="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div class="flex items-center gap-2 text-sm text-purple-700">
          <Icon name="lucide:plane" class="w-4 h-4" />
          <span class="font-medium">{{ $t('xp.experiences.form.tripInfo') }}</span>
        </div>
        <p class="text-xs text-purple-500 mt-1">{{ $t('xp.experiences.form.tripInfoHint') }}</p>
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.experiences.form.category') }}
        </label>
        <select
          v-model="form.category"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        >
          <option v-for="cat in EXPERIENCE_CATEGORIES" :key="cat.value" :value="cat.value">
            {{ $t(`travel.experiences.categories.${cat.value}`) }}
          </option>
        </select>
      </div>

      <!-- Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.experiences.form.name') }} *
        </label>
        <input
          v-model="form.name"
          type="text"
          :placeholder="$t('travel.experiences.form.namePlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
          required
        />
      </div>

      <!-- City (with autocomplete) — only for standalone experiences -->
      <div v-if="!initialData?.tripId">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('xp.experiences.form.city') }}
        </label>
        <TripDestinationsCityAutocomplete
          :model-value="form.city"
          :placeholder="$t('xp.experiences.form.cityPlaceholder')"
          @update:model-value="form.city = $event"
          @city-selected="handleCitySelected"
        />
      </div>

      <!-- Country (auto-filled from city, or manual) — only for standalone experiences -->
      <div v-if="!initialData?.tripId">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('xp.experiences.form.country') }}
        </label>
        <input
          v-model="form.country"
          type="text"
          :placeholder="$t('xp.experiences.form.countryPlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('wishes.form.status') }}
        </label>
        <div ref="statusDropdownRef" class="relative">
          <button
            type="button"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 bg-white flex items-center justify-between"
            @click="statusDropdownOpen = !statusDropdownOpen"
          >
            <span class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full" :class="getStatusDotClass(selectedStatusConfig.color)" />
              {{ $t(`travel.experiences.status.${form.status}`) }}
            </span>
            <Icon
              name="lucide:chevron-down"
              class="w-4 h-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': statusDropdownOpen }"
            />
          </button>
          <div
            v-if="statusDropdownOpen"
            class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1"
          >
            <button
              v-for="s in EXPERIENCE_STATUSES"
              :key="s.value"
              type="button"
              class="w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors"
              :class="form.status === s.value ? 'bg-rose-50 text-rose-700' : 'text-gray-700 hover:bg-gray-50'"
              @click="form.status = s.value; statusDropdownOpen = false"
            >
              <span class="w-2.5 h-2.5 rounded-full" :class="getStatusDotClass(s.color)" />
              {{ $t(`travel.experiences.status.${s.value}`) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.experiences.form.description') }}
        </label>
        <textarea
          v-model="form.description"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>

      <!-- Address -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.experiences.form.address') }}
        </label>
        <input
          v-model="form.address"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>

      <!-- Date & Time -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('travel.experiences.form.scheduledDate') }}
          </label>
          <input
            v-model="form.scheduledDate"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('travel.experiences.form.scheduledTime') }}
          </label>
          <input
            v-model="form.scheduledTime"
            type="time"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
          />
        </div>
      </div>

      <!-- Duration -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.experiences.form.duration') }}
        </label>
        <input
          v-model="form.duration"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>

      <!-- Cost & Currency -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('travel.experiences.form.estimatedCost') }}
          </label>
          <input
            v-model="form.estimatedCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ $t('travel.transportation.form.currency') }}
          </label>
          <select
            v-model="form.currency"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
          >
            <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
              {{ c.symbol }} {{ c.code }}
            </option>
          </select>
        </div>
      </div>

      <!-- Booking Reference -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.transportation.form.bookingReference') }}
        </label>
        <input
          v-model="form.bookingReference"
          type="text"
          :placeholder="$t('travel.transportation.form.bookingReferencePlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>

      <!-- External URL -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.experiences.form.externalUrl') }}
        </label>
        <input
          v-model="form.externalUrl"
          type="url"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ $t('travel.transportation.form.notes') }}
        </label>
        <textarea
          v-model="form.notes"
          rows="2"
          :placeholder="$t('travel.transportation.form.notesPlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
      <UiButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton v-if="initialData" type="button" variant="danger" @click="$emit('delete')">
        {{ $t('common.delete') }}
      </UiButton>
      <UiButton type="submit" :loading="submitting">
        {{ initialData ? $t('common.save') : $t('common.add') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { ExperienceForm, Experience, CitySelection } from '~/types'
import { EXPERIENCE_CATEGORIES, EXPERIENCE_STATUSES, CURRENCIES, getExperienceStatusConfig } from '~/types'

interface Props {
  initialData?: Experience
  defaultCurrency?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultCurrency: 'USD',
})

const emit = defineEmits<{
  submit: [data: ExperienceForm]
  cancel: []
  delete: []
}>()

const submitting = ref(false)
const statusDropdownOpen = ref(false)
const statusDropdownRef = ref<HTMLElement>()

onClickOutside(statusDropdownRef, () => {
  statusDropdownOpen.value = false
})

const statusDotClasses: Record<string, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
}

function getStatusDotClass(color: string) {
  return statusDotClasses[color] || 'bg-gray-400'
}

const form = ref<ExperienceForm>({
  destinationId: '',
  category: props.initialData?.category || 'restaurant',
  name: props.initialData?.name || '',
  description: props.initialData?.description || '',
  address: props.initialData?.address || '',
  scheduledDate: props.initialData?.scheduledDate
    ? (props.initialData.scheduledDate instanceof Date
        ? props.initialData.scheduledDate.toISOString().split('T')[0]
        : new Date(props.initialData.scheduledDate).toISOString().split('T')[0])
    : '',
  scheduledTime: props.initialData?.scheduledTime || '',
  duration: props.initialData?.duration ? String(props.initialData.duration) : '',
  status: props.initialData?.status || 'wishlist',
  bookingReference: props.initialData?.bookingReference || '',
  bookingUrl: props.initialData?.bookingUrl || '',
  estimatedCost: props.initialData?.estimatedCost ? String(props.initialData.estimatedCost) : '',
  actualCost: props.initialData?.actualCost ? String(props.initialData.actualCost) : '',
  currency: props.initialData?.currency || props.defaultCurrency,
  rating: props.initialData?.rating ? String(props.initialData.rating) : '',
  notes: props.initialData?.notes || '',
  imageUrl: props.initialData?.imageUrl || '',
  externalUrl: props.initialData?.externalUrl || '',
  country: props.initialData?.country || '',
  city: props.initialData?.city || '',
  countryCode: props.initialData?.countryCode || '',
})

const selectedStatusConfig = computed(() => getExperienceStatusConfig(form.value.status as any))

function handleCitySelected(city: CitySelection) {
  form.value.city = city.name
  form.value.country = city.country
  form.value.countryCode = city.countryCode
}

function handleSubmit() {
  if (!form.value.name.trim()) return
  submitting.value = true
  emit('submit', { ...form.value })
  submitting.value = false
}

// Update form when initialData changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value = {
      destinationId: '',
      category: newData.category || 'restaurant',
      name: newData.name || '',
      description: newData.description || '',
      address: newData.address || '',
      scheduledDate: newData.scheduledDate
        ? (newData.scheduledDate instanceof Date
            ? newData.scheduledDate.toISOString().split('T')[0]
            : new Date(newData.scheduledDate).toISOString().split('T')[0])
        : '',
      scheduledTime: newData.scheduledTime || '',
      duration: newData.duration ? String(newData.duration) : '',
      status: newData.status || 'wishlist',
      bookingReference: newData.bookingReference || '',
      bookingUrl: newData.bookingUrl || '',
      estimatedCost: newData.estimatedCost ? String(newData.estimatedCost) : '',
      actualCost: newData.actualCost ? String(newData.actualCost) : '',
      currency: newData.currency || props.defaultCurrency,
      rating: newData.rating ? String(newData.rating) : '',
      notes: newData.notes || '',
      imageUrl: newData.imageUrl || '',
      externalUrl: newData.externalUrl || '',
      country: newData.country || '',
      city: newData.city || '',
      countryCode: newData.countryCode || '',
    }
  }
})
</script>
