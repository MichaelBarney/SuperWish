<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Title -->
    <UiInput
      v-model="form.title"
      label="Title"
      placeholder="What do you wish for?"
      required
      :error="errors.title"
    />

    <!-- Description -->
    <UiTextarea
      v-model="form.description"
      label="Description"
      placeholder="Add more details about this wish..."
      :rows="2"
    />

    <!-- Image -->
    <UiImageUpload
      v-model="form.imageUrl"
      label="Image"
      storage-path="wishes"
    />

    <!-- Target Price -->
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2">
        <UiInput
          v-model="form.targetPrice"
          type="number"
          label="Target Price"
          placeholder="Price you want to pay"
          step="0.01"
          min="0"
          hint="The price you're hoping to find"
        />
      </div>
      <UiSelect v-model="form.currency" label="Currency">
        <option v-for="curr in CURRENCIES" :key="curr.code" :value="curr.code">
          {{ curr.code }} ({{ curr.symbol }})
        </option>
      </UiSelect>
    </div>

    <!-- Price Sources -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700">Price Sources</label>
        <span v-if="form.priceSources.length > 0" class="text-xs text-gray-400">
          {{ form.priceSources.length }} source{{ form.priceSources.length === 1 ? '' : 's' }}
        </span>
      </div>

      <p class="text-xs text-gray-500">Track prices from different stores to find the best deal</p>

      <div class="space-y-3">
        <div
          v-for="(source, index) in form.priceSources"
          :key="index"
          class="p-4 bg-gray-50 rounded-xl space-y-3"
        >
          <div class="flex items-start justify-between">
            <span class="text-xs font-medium text-gray-500">Source #{{ index + 1 }}</span>
            <button
              type="button"
              @click="removePriceSource(index)"
              class="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="source.storeName"
              type="text"
              placeholder="Store name (e.g., Amazon)"
              class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
            />
            <div class="flex gap-2">
              <input
                v-model="source.price"
                type="number"
                placeholder="Price"
                step="0.01"
                min="0"
                class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
              />
              <select
                v-model="source.currency"
                class="w-20 rounded-xl border border-gray-200 bg-white px-2 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
              >
                <option v-for="curr in CURRENCIES" :key="curr.code" :value="curr.code">
                  {{ curr.symbol }}
                </option>
              </select>
            </div>
          </div>

          <input
            v-model="source.url"
            type="url"
            placeholder="Product URL (optional)"
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        @click="addPriceSource"
        class="w-full py-2 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-accent-300 hover:text-accent-600 transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Price Source
      </button>
    </div>

    <!-- Priority -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
      <div class="flex gap-1">
        <button
          v-for="i in 5"
          :key="i"
          type="button"
          @click="form.priority = i as Priority"
          class="p-1 focus:outline-none focus:ring-2 focus:ring-accent-300 rounded"
        >
          <svg
            class="w-7 h-7 transition-colors"
            :class="i <= form.priority ? 'text-amber-400' : 'text-gray-200 hover:text-amber-200'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Status -->
    <UiSelect v-model="form.status" label="Status">
      <option v-for="status in WISH_STATUSES" :key="status.value" :value="status.value">
        {{ status.label }}
      </option>
    </UiSelect>

    <!-- For Person -->
    <UiInput
      v-model="form.forPerson"
      label="For Person"
      placeholder="Who is this wish for? (optional)"
    />

    <!-- Shopping Links -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">Reference Links</label>
      <div class="space-y-2">
        <div
          v-for="(link, index) in form.shoppingLinks"
          :key="index"
          class="flex gap-2"
        >
          <input
            v-model="link.url"
            type="url"
            placeholder="https://..."
            class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
          />
          <input
            v-model="link.label"
            type="text"
            placeholder="Label"
            class="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
          />
          <button
            type="button"
            @click="removeLink(index)"
            class="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <button
        type="button"
        @click="addLink"
        class="mt-2 text-sm text-accent-600 hover:text-accent-700 flex items-center gap-1"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Link
      </button>
    </div>

    <!-- Tracking Info (visible for purchased/shipping status) -->
    <div v-if="form.status === 'purchased' || form.status === 'shipping'" class="p-4 bg-gray-50 rounded-xl space-y-4">
      <h4 class="text-sm font-medium text-gray-700">Tracking Information</h4>
      <UiInput
        v-model="form.trackingUrl"
        type="url"
        label="Tracking URL"
        placeholder="https://tracking.example.com/..."
      />
      <UiInput
        v-model="form.estimatedDelivery"
        type="date"
        label="Estimated Delivery"
      />
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 pt-4">
      <UiButton type="button" variant="secondary" @click="$emit('cancel')">
        Cancel
      </UiButton>
      <UiButton type="submit" :loading="submitting">
        {{ editMode ? 'Save Changes' : 'Add Wish' }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Wish, WishForm, Priority, ShoppingLink, PriceSourceForm, PriceSource } from '~/types'
import { CURRENCIES, WISH_STATUSES } from '~/types'

interface Props {
  initialData?: Wish
  defaultCurrency?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: WishForm]
  cancel: []
}>()

const editMode = computed(() => !!props.initialData)

const form = reactive<WishForm>({
  title: '',
  description: '',
  imageUrl: '',
  shoppingLinks: [],
  expectedPrice: '',
  targetPrice: '',
  priceSources: [],
  currency: props.defaultCurrency || 'USD',
  priority: 3,
  status: 'wanted',
  trackingUrl: '',
  estimatedDelivery: '',
  forPerson: '',
})

const errors = reactive({
  title: '',
})

const submitting = ref(false)
// Initialize form with existing data
onMounted(() => {
  if (props.initialData) {
    form.title = props.initialData.title
    form.description = props.initialData.description || ''
    form.imageUrl = props.initialData.imageUrl || ''
    form.shoppingLinks = [...(props.initialData.shoppingLinks || [])]
    form.expectedPrice = props.initialData.expectedPrice?.toString() || ''
    form.targetPrice = props.initialData.targetPrice?.toString() || ''
    form.priceSources = (props.initialData.priceSources || []).map((source: PriceSource) => ({
      storeName: source.storeName,
      price: source.price.toString(),
      currency: source.currency,
      url: source.url || '',
    }))
    form.currency = props.initialData.currency || 'USD'
    form.priority = props.initialData.priority || 3
    form.status = props.initialData.status || 'wanted'
    form.trackingUrl = props.initialData.trackingUrl || ''
    form.forPerson = props.initialData.forPerson || ''
    if (props.initialData.estimatedDelivery) {
      const date = props.initialData.estimatedDelivery instanceof Date
        ? props.initialData.estimatedDelivery
        : new Date(props.initialData.estimatedDelivery)
      form.estimatedDelivery = date.toISOString().split('T')[0]
    }
  }
})

function addLink() {
  form.shoppingLinks.push({ url: '', label: '' })
}

function removeLink(index: number) {
  form.shoppingLinks.splice(index, 1)
}

function addPriceSource() {
  form.priceSources.push({
    storeName: '',
    price: '',
    currency: form.currency,
    url: '',
  })
}

function removePriceSource(index: number) {
  form.priceSources.splice(index, 1)
}

function validate(): boolean {
  errors.title = ''

  if (!form.title.trim()) {
    errors.title = 'Title is required'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true

  // Filter out empty links
  const validLinks: ShoppingLink[] = form.shoppingLinks
    .filter(link => link.url.trim())
    .map(link => ({
      url: link.url.trim(),
      label: link.label?.trim() || undefined,
    }))

  // Filter and convert price sources
  const validPriceSources: PriceSourceForm[] = form.priceSources
    .filter(source => source.storeName.trim() && source.price)
    .map(source => ({
      storeName: source.storeName.trim(),
      price: source.price,
      currency: source.currency,
      url: source.url?.trim() || '',
    }))

  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    imageUrl: form.imageUrl.trim(),
    shoppingLinks: validLinks,
    expectedPrice: form.expectedPrice,
    targetPrice: form.targetPrice,
    priceSources: validPriceSources,
    currency: form.currency,
    priority: form.priority,
    status: form.status,
    trackingUrl: form.trackingUrl.trim(),
    estimatedDelivery: form.estimatedDelivery,
    forPerson: form.forPerson.trim(),
  })

  submitting.value = false
}
</script>
