<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- From/To Header (read-only info) -->
      <div class="bg-gray-50 rounded-lg p-3">
        <p class="text-sm text-gray-600">
          <span class="font-medium">{{ fromLabel }}</span>
          <svg class="inline-block w-4 h-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span class="font-medium">{{ toLabel }}</span>
        </p>
      </div>

      <!-- Transport Type -->
      <UiSelect
        v-model="form.type"
        :label="$t('travel.transportation.form.type')"
      >
        <option v-for="t in TRANSPORT_TYPES" :key="t.value" :value="t.value">
          {{ $t(`travel.transportation.types.${t.value}`) }}
        </option>
      </UiSelect>

      <!-- Trip Direction (only for eligible types and create mode) -->
      <div v-if="supportsRoundTrip && !initialData" class="flex gap-2">
        <button
          type="button"
          @click="tripDirection = 'one-way'"
          :class="[
            'flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all',
            tripDirection === 'one-way'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          ]"
        >
          {{ $t('travel.transportation.form.oneWay') }}
        </button>
        <button
          type="button"
          @click="tripDirection = 'round-trip'"
          :class="[
            'flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all',
            tripDirection === 'round-trip'
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          ]"
        >
          {{ $t('travel.transportation.form.roundTrip') }}
        </button>
      </div>

      <!-- Carrier & Flight Number -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.carrier"
          :label="$t('travel.transportation.form.carrier')"
          :placeholder="$t('travel.transportation.form.carrierPlaceholder')"
        />
        <UiInput
          v-model="form.flightNumber"
          :label="$t('travel.transportation.form.flightNumber')"
          :placeholder="$t('travel.transportation.form.flightNumberPlaceholder')"
        />
      </div>

      <!-- Outbound Departure/Arrival DateTime -->
      <div class="space-y-2">
        <p v-if="tripDirection === 'round-trip'" class="text-sm font-medium text-gray-600">
          {{ $t('travel.transportation.form.outbound') }}
        </p>
        <div class="grid grid-cols-2 gap-4">
          <UiInput
            v-model="form.departureDateTime"
            type="datetime-local"
            :label="$t('travel.transportation.form.departure')"
          />
          <UiInput
            v-model="form.arrivalDateTime"
            type="datetime-local"
            :label="$t('travel.transportation.form.arrival')"
          />
        </div>
      </div>

      <!-- Return Departure/Arrival DateTime (only for round-trip) -->
      <div v-if="tripDirection === 'round-trip'" class="space-y-2">
        <p class="text-sm font-medium text-gray-600">
          {{ $t('travel.transportation.form.return') }}
          <span class="font-normal text-gray-400">({{ toLabel }} → {{ fromLabel }})</span>
        </p>
        <div class="grid grid-cols-2 gap-4">
          <UiInput
            v-model="returnForm.departureDateTime"
            type="datetime-local"
            :label="$t('travel.transportation.form.departure')"
          />
          <UiInput
            v-model="returnForm.arrivalDateTime"
            type="datetime-local"
            :label="$t('travel.transportation.form.arrival')"
          />
        </div>
      </div>

      <!-- Locations -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.fromLocation"
          :label="$t('travel.transportation.form.fromLocation')"
          :placeholder="$t('travel.transportation.form.fromLocationPlaceholder')"
        />
        <UiInput
          v-model="form.toLocation"
          :label="$t('travel.transportation.form.toLocation')"
          :placeholder="$t('travel.transportation.form.toLocationPlaceholder')"
        />
      </div>

      <!-- Booking Status -->
      <UiSelect
        v-model="form.bookingStatus"
        :label="$t('travel.transportation.form.bookingStatus')"
      >
        <option v-for="s in BOOKING_STATUSES" :key="s.value" :value="s.value">
          {{ $t(`travel.transportation.status.${s.value}`) }}
        </option>
      </UiSelect>

      <!-- Booking Reference -->
      <UiInput
        v-model="form.bookingReference"
        :label="$t('travel.transportation.form.bookingReference')"
        :placeholder="$t('travel.transportation.form.bookingReferencePlaceholder')"
      />

      <!-- Price (separate for round-trip) -->
      <div v-if="tripDirection === 'round-trip'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UiInput
            v-model="form.price"
            type="number"
            :label="$t('travel.transportation.form.outboundPrice')"
            :placeholder="$t('travel.transportation.form.pricePlaceholder')"
            min="0"
            step="0.01"
          />
          <UiInput
            v-model="returnForm.price"
            type="number"
            :label="$t('travel.transportation.form.returnPrice')"
            :placeholder="$t('travel.transportation.form.pricePlaceholder')"
            min="0"
            step="0.01"
          />
        </div>
        <UiSelect
          v-model="form.currency"
          :label="$t('travel.transportation.form.currency')"
        >
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
            {{ c.symbol }} {{ c.code }}
          </option>
        </UiSelect>
      </div>
      <!-- Price (single for one-way) -->
      <div v-else class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.price"
          type="number"
          :label="$t('travel.transportation.form.price')"
          :placeholder="$t('travel.transportation.form.pricePlaceholder')"
          min="0"
          step="0.01"
        />
        <UiSelect
          v-model="form.currency"
          :label="$t('travel.transportation.form.currency')"
        >
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
            {{ c.symbol }} {{ c.code }}
          </option>
        </UiSelect>
      </div>

      <!-- Seat Info -->
      <UiInput
        v-model="form.seatInfo"
        :label="$t('travel.transportation.form.seatInfo')"
        :placeholder="$t('travel.transportation.form.seatInfoPlaceholder')"
      />

      <!-- Links Section -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700">
            {{ $t('travel.transportation.form.links') }}
          </label>
          <button
            type="button"
            @click="addLink"
            class="text-sm text-purple-600 hover:text-purple-700"
          >
            + {{ $t('common.add') }}
          </button>
        </div>
        <TravelTransportationLinkInput
          v-for="(link, index) in form.links"
          :key="link.id"
          v-model="form.links[index]"
          @remove="removeLink(index)"
        />
        <p v-if="!form.links.length" class="text-sm text-gray-400">
          {{ $t('travel.transportation.form.noLinks') }}
        </p>
      </div>

      <!-- Documents Section -->
      <div class="border-t border-gray-100 pt-4">
        <label class="text-sm font-medium text-gray-700 mb-2 block">
          {{ $t('travel.transportation.form.documents') }}
        </label>
        <TravelTransportationDocumentUpload
          v-model="form.documents"
          storage-path="transportations"
        />
      </div>

      <!-- Notes -->
      <UiTextarea
        v-model="form.notes"
        :label="$t('travel.transportation.form.notes')"
        :placeholder="$t('travel.transportation.form.notesPlaceholder')"
        :rows="3"
      />
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
import type {
  TransportationForm,
  Transportation,
  TransportType,
  BookingStatus,
  TransportationDocument,
  TransportationLink,
} from '~/types'
import { TRANSPORT_TYPES, BOOKING_STATUSES, CURRENCIES, createEmptyTransportationLink, ROUND_TRIP_ELIGIBLE_TYPES } from '~/types'

type TripDirection = 'one-way' | 'round-trip'

interface Props {
  initialData?: Transportation | null
  fromDestinationId?: string | null
  toDestinationId?: string | null
  fromLabel: string
  toLabel: string
  tripCurrency?: string
}

const props = withDefaults(defineProps<Props>(), {
  tripCurrency: 'USD',
})

const emit = defineEmits<{
  submit: [data: TransportationForm, returnData?: TransportationForm]
  cancel: []
  delete: []
}>()

const submitting = ref(false)
const tripDirection = ref<TripDirection>('one-way')

const returnForm = ref({
  departureDateTime: '',
  arrivalDateTime: '',
  price: '',
})

function formatDateTimeLocal(date: Date | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  // Format as YYYY-MM-DDTHH:mm
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const form = ref<TransportationForm>({
  type: (props.initialData?.type || 'flight') as TransportType,
  carrier: props.initialData?.carrier || '',
  flightNumber: props.initialData?.flightNumber || '',
  fromDestinationId: props.initialData?.fromDestinationId || props.fromDestinationId || '',
  fromLocation: props.initialData?.fromLocation || '',
  departureDateTime: formatDateTimeLocal(props.initialData?.departureDateTime),
  toDestinationId: props.initialData?.toDestinationId || props.toDestinationId || '',
  toLocation: props.initialData?.toLocation || '',
  arrivalDateTime: formatDateTimeLocal(props.initialData?.arrivalDateTime),
  bookingStatus: (props.initialData?.bookingStatus || 'planned') as BookingStatus,
  bookingReference: props.initialData?.bookingReference || '',
  price: props.initialData?.price?.toString() || '',
  currency: props.initialData?.currency || props.tripCurrency,
  seatInfo: props.initialData?.seatInfo || '',
  notes: props.initialData?.notes || '',
  documents: props.initialData?.documents || [] as TransportationDocument[],
  links: props.initialData?.links || [] as TransportationLink[],
})

const supportsRoundTrip = computed(() =>
  ROUND_TRIP_ELIGIBLE_TYPES.includes(form.value.type as TransportType)
)

watch(() => form.value.type, (newType) => {
  if (!ROUND_TRIP_ELIGIBLE_TYPES.includes(newType as TransportType)) {
    tripDirection.value = 'one-way'
  }
})

function addLink() {
  form.value.links.push(createEmptyTransportationLink())
}

function removeLink(index: number) {
  form.value.links.splice(index, 1)
}

function handleSubmit() {
  submitting.value = true

  if (tripDirection.value === 'round-trip' && !props.initialData) {
    const returnFormData: TransportationForm = {
      ...form.value,
      fromLocation: form.value.toLocation,
      toLocation: form.value.fromLocation,
      fromDestinationId: form.value.toDestinationId,
      toDestinationId: form.value.fromDestinationId,
      departureDateTime: returnForm.value.departureDateTime,
      arrivalDateTime: returnForm.value.arrivalDateTime,
      price: returnForm.value.price,
    }
    emit('submit', { ...form.value }, returnFormData)
  } else {
    emit('submit', { ...form.value })
  }

  submitting.value = false
}

// Update form when initialData changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value = {
      type: (newData.type || 'flight') as TransportType,
      carrier: newData.carrier || '',
      flightNumber: newData.flightNumber || '',
      fromDestinationId: newData.fromDestinationId || props.fromDestinationId || '',
      fromLocation: newData.fromLocation || '',
      departureDateTime: formatDateTimeLocal(newData.departureDateTime),
      toDestinationId: newData.toDestinationId || props.toDestinationId || '',
      toLocation: newData.toLocation || '',
      arrivalDateTime: formatDateTimeLocal(newData.arrivalDateTime),
      bookingStatus: (newData.bookingStatus || 'planned') as BookingStatus,
      bookingReference: newData.bookingReference || '',
      price: newData.price?.toString() || '',
      currency: newData.currency || props.tripCurrency,
      seatInfo: newData.seatInfo || '',
      notes: newData.notes || '',
      documents: newData.documents || [],
      links: newData.links || [],
    }
  }
}, { immediate: true })
</script>
