<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Destination -->
      <UiSelect
        v-model="form.destinationId"
        :label="$t('travel.accommodations.form.destination')"
      >
        <option v-for="dest in destinations" :key="dest.id" :value="dest.id">
          {{ dest.name }}
        </option>
      </UiSelect>

      <!-- Accommodation Type -->
      <UiSelect
        v-model="form.type"
        :label="$t('travel.accommodations.form.type')"
      >
        <option v-for="t in ACCOMMODATION_TYPES" :key="t.value" :value="t.value">
          {{ $t(`travel.accommodations.types.${t.value}`) }}
        </option>
      </UiSelect>

      <!-- Name -->
      <UiInput
        v-model="form.name"
        :label="$t('travel.accommodations.form.name')"
        :placeholder="$t('travel.accommodations.form.namePlaceholder')"
        required
      />

      <!-- Address -->
      <UiInput
        v-model="form.address"
        :label="$t('travel.accommodations.form.address')"
        :placeholder="$t('travel.accommodations.form.addressPlaceholder')"
      />

      <!-- Check-in Date + Time -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.checkIn"
          type="date"
          :label="$t('travel.accommodations.form.checkIn')"
        />
        <UiInput
          v-model="form.checkInTime"
          type="time"
          :label="$t('travel.accommodations.form.checkInTime')"
        />
      </div>

      <!-- Check-out Date + Time -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.checkOut"
          type="date"
          :label="$t('travel.accommodations.form.checkOut')"
        />
        <UiInput
          v-model="form.checkOutTime"
          type="time"
          :label="$t('travel.accommodations.form.checkOutTime')"
        />
      </div>

      <!-- Nights indicator -->
      <div v-if="nightsCount" class="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
        {{ $t('travel.accommodations.nights', { count: nightsCount }, nightsCount) }}
      </div>

      <!-- Booking Status -->
      <UiSelect
        v-model="form.bookingStatus"
        :label="$t('travel.accommodations.form.bookingStatus')"
      >
        <option v-for="s in BOOKING_STATUSES" :key="s.value" :value="s.value">
          {{ $t(`travel.accommodations.status.${s.value}`) }}
        </option>
      </UiSelect>

      <!-- Booking Reference -->
      <UiInput
        v-model="form.bookingReference"
        :label="$t('travel.accommodations.form.bookingReference')"
        :placeholder="$t('travel.accommodations.form.bookingReferencePlaceholder')"
      />

      <!-- Price -->
      <div class="grid grid-cols-3 gap-4">
        <UiInput
          v-model="form.pricePerNight"
          type="number"
          :label="$t('travel.accommodations.form.pricePerNight')"
          min="0"
          step="0.01"
          @input="handlePricePerNightChange"
        />
        <UiInput
          v-model="form.totalPrice"
          type="number"
          :label="$t('travel.accommodations.form.totalPrice')"
          min="0"
          step="0.01"
        />
        <UiSelect
          v-model="form.currency"
          :label="$t('travel.accommodations.form.currency')"
        >
          <option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
            {{ c.symbol }} {{ c.code }}
          </option>
        </UiSelect>
      </div>

      <!-- Room Type -->
      <UiInput
        v-model="form.roomType"
        :label="$t('travel.accommodations.form.roomType')"
        :placeholder="$t('travel.accommodations.form.roomTypePlaceholder')"
      />

      <!-- Links Section -->
      <div class="border-t border-gray-100 pt-4">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700">
            {{ $t('travel.accommodations.form.links') }}
          </label>
          <button
            type="button"
            @click="addLink"
            class="text-sm text-purple-600 hover:text-purple-700"
          >
            + {{ $t('common.add') }}
          </button>
        </div>
        <TripTransportationLinkInput
          v-for="(link, index) in form.links"
          :key="link.id"
          v-model="form.links[index]"
          @remove="removeLink(index)"
        />
        <p v-if="!form.links.length" class="text-sm text-gray-400">
          {{ $t('travel.accommodations.form.noLinks') }}
        </p>
      </div>

      <!-- Documents Section -->
      <div class="border-t border-gray-100 pt-4">
        <label class="text-sm font-medium text-gray-700 mb-2 block">
          {{ $t('travel.accommodations.form.documents') }}
        </label>
        <TripTransportationDocumentUpload
          v-model="form.documents"
          storage-path="accommodations"
        />
      </div>

      <!-- Notes -->
      <UiTextarea
        v-model="form.notes"
        :label="$t('travel.accommodations.form.notes')"
        :placeholder="$t('travel.accommodations.form.notesPlaceholder')"
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
  AccommodationForm,
  Accommodation,
  AccommodationType,
  BookingStatus,
  Destination,
  TransportationDocument,
  TransportationLink,
} from '~/types'
import { ACCOMMODATION_TYPES, BOOKING_STATUSES, CURRENCIES, createEmptyTransportationLink } from '~/types'

interface Props {
  initialData?: Accommodation | null
  destinations: Destination[]
  defaultDestinationId?: string
  tripCurrency?: string
}

const props = withDefaults(defineProps<Props>(), {
  tripCurrency: 'USD',
})

const emit = defineEmits<{
  submit: [data: AccommodationForm]
  cancel: []
  delete: []
}>()

const submitting = ref(false)

function formatDateLocal(date: Date | null | undefined): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = ref<AccommodationForm>({
  destinationId: props.initialData?.destinationId || props.defaultDestinationId || '',
  type: (props.initialData?.type || 'hotel') as AccommodationType,
  name: props.initialData?.name || '',
  address: props.initialData?.address || '',
  checkIn: formatDateLocal(props.initialData?.checkIn),
  checkOut: formatDateLocal(props.initialData?.checkOut),
  checkInTime: props.initialData?.checkInTime || '',
  checkOutTime: props.initialData?.checkOutTime || '',
  bookingStatus: (props.initialData?.bookingStatus || 'planned') as BookingStatus,
  bookingReference: props.initialData?.bookingReference || '',
  bookingUrl: props.initialData?.bookingUrl || '',
  pricePerNight: props.initialData?.pricePerNight?.toString() || '',
  totalPrice: props.initialData?.totalPrice?.toString() || '',
  currency: props.initialData?.currency || props.tripCurrency,
  roomType: props.initialData?.roomType || '',
  amenities: props.initialData?.amenities || [],
  notes: props.initialData?.notes || '',
  imageUrl: props.initialData?.imageUrl || '',
  documents: props.initialData?.documents || [] as TransportationDocument[],
  links: props.initialData?.links || [] as TransportationLink[],
})

const nightsCount = computed(() => {
  if (!form.value.checkIn || !form.value.checkOut) return null
  const checkIn = new Date(form.value.checkIn)
  const checkOut = new Date(form.value.checkOut)
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return null
  const diffTime = checkOut.getTime() - checkIn.getTime()
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : null
})

function handlePricePerNightChange() {
  if (form.value.pricePerNight && nightsCount.value && !form.value.totalPrice) {
    const ppn = parseFloat(form.value.pricePerNight)
    if (!isNaN(ppn)) {
      form.value.totalPrice = (ppn * nightsCount.value).toFixed(2)
    }
  }
}

function addLink() {
  form.value.links.push(createEmptyTransportationLink())
}

function removeLink(index: number) {
  form.value.links.splice(index, 1)
}

function handleSubmit() {
  submitting.value = true
  emit('submit', { ...form.value })
  submitting.value = false
}

// Update form when initialData changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value = {
      destinationId: newData.destinationId || props.defaultDestinationId || '',
      type: (newData.type || 'hotel') as AccommodationType,
      name: newData.name || '',
      address: newData.address || '',
      checkIn: formatDateLocal(newData.checkIn),
      checkOut: formatDateLocal(newData.checkOut),
      checkInTime: newData.checkInTime || '',
      checkOutTime: newData.checkOutTime || '',
      bookingStatus: (newData.bookingStatus || 'planned') as BookingStatus,
      bookingReference: newData.bookingReference || '',
      bookingUrl: newData.bookingUrl || '',
      pricePerNight: newData.pricePerNight?.toString() || '',
      totalPrice: newData.totalPrice?.toString() || '',
      currency: newData.currency || props.tripCurrency,
      roomType: newData.roomType || '',
      amenities: newData.amenities || [],
      notes: newData.notes || '',
      imageUrl: newData.imageUrl || '',
      documents: newData.documents || [],
      links: newData.links || [],
    }
  }
}, { immediate: true })
</script>
