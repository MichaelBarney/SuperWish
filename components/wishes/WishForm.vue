<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Title -->
    <UiInput
      v-model="form.title"
      :label="$t('wishes.form.title')"
      :placeholder="$t('wishes.form.titlePlaceholder')"
      required
      :error="errors.title"
    />

    <!-- Description -->
    <UiTextarea
      v-model="form.description"
      :label="$t('wishes.form.description')"
      :placeholder="$t('wishes.form.descriptionPlaceholder')"
      :rows="2"
    />

    <!-- Preferences (optional) -->
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('wishes.questions.sectionTitle') }}</label>
        <p class="text-xs text-gray-500">{{ $t('wishes.questions.sectionHint') }}</p>
      </div>
      <div v-for="(q, index) in form.questions" :key="q.questionKey" class="space-y-1">
        <UiInput
          v-model="q.answer"
          :label="$t(q.questionKey)"
          :placeholder="''"
        />
      </div>
    </div>

    <!-- Image -->
    <UiImageUpload
      v-model="form.imageUrl"
      :label="$t('wishes.form.image')"
      storage-path="wishes"
    />

    <!-- Target Price -->
    <div class="grid grid-cols-3 gap-4">
      <div class="col-span-2">
        <UiInput
          v-model="form.targetPrice"
          type="number"
          :label="$t('wishes.form.targetPrice')"
          :placeholder="$t('wishes.form.targetPricePlaceholder')"
          step="0.01"
          min="0"
          :hint="$t('wishes.form.targetPriceHint')"
        />
      </div>
      <UiSelect v-model="form.currency" :label="$t('wishes.form.currency')">
        <option v-for="curr in CURRENCIES" :key="curr.code" :value="curr.code">
          {{ curr.code }} ({{ curr.symbol }})
        </option>
      </UiSelect>
    </div>

    <!-- Price Sources -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="block text-sm font-medium text-gray-700">{{ $t('wishes.form.priceSources') }}</label>
        <span v-if="form.priceSources.length > 0" class="text-xs text-gray-400">
          {{ form.priceSources.length }} source{{ form.priceSources.length === 1 ? '' : 's' }}
        </span>
      </div>

      <p class="text-xs text-gray-500">{{ $t('wishes.form.priceSourcesHint') }}</p>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <button
          type="button"
          @click="addPriceSource"
          class="flex-1 py-2 px-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-accent-300 hover:text-accent-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ $t('wishes.form.addManually') }}
        </button>
        <button
          type="button"
          :disabled="!form.title.trim() || productSearch.loading.value"
          @click="handleProductSearch"
          class="flex-1 py-2 px-4 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg v-if="!productSearch.loading.value" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <svg v-else class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ $t('wishes.form.searchPrices') }}
        </button>
      </div>

      <!-- Existing price sources -->
      <div class="space-y-3">
        <div
          v-for="(source, index) in form.priceSources"
          :key="index"
          class="p-4 bg-gray-50 rounded-xl space-y-3"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <!-- Thumbnail -->
              <img
                v-if="source.imageUrl"
                :src="source.imageUrl"
                :alt="source.storeName"
                class="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 flex-shrink-0"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <div>
                <span class="text-xs font-medium text-gray-500">{{ $t('wishes.form.sourceNumber', { number: index + 1 }) }}</span>
                <p v-if="source.searchedAt" class="text-[10px] text-gray-400">
                  {{ $t('wishes.form.searched', { date: formatSearchDate(source.searchedAt) }) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <!-- Use as wish image button -->
              <button
                v-if="source.imageUrl"
                type="button"
                @click="form.imageUrl = source.imageUrl"
                class="p-1 text-accent-400 hover:text-accent-600 hover:bg-accent-100 rounded-lg transition-colors"
                :title="$t('wishes.form.useAsWishImage')"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
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
          </div>

          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="source.storeName"
              type="text"
              :placeholder="$t('wishes.form.storePlaceholder')"
              class="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
            />
            <div class="flex gap-2">
              <input
                v-model="source.price"
                type="number"
                :placeholder="$t('wishes.form.pricePlaceholder')"
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

          <div class="relative">
            <input
              v-model="source.url"
              type="url"
              :placeholder="$t('wishes.form.urlPlaceholder')"
              :disabled="fetchingUrlIndex === index"
              class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
              @blur="handleUrlChange(index)"
              @paste="handleUrlPaste($event, index)"
            />
            <div
              v-if="fetchingUrlIndex === index"
              class="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <svg class="w-4 h-4 animate-spin text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          </div>
          <input
            v-model="source.description"
            type="text"
            :placeholder="$t('wishes.form.sourceDescriptionPlaceholder')"
            class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-accent-500 focus:ring-2 focus:ring-accent-200 focus:outline-none"
          />
        </div>
      </div>

      <!-- Product Search Results -->
      <WishesProductSearchResults
        v-if="showSearchResults"
        :results="productSearch.results.value"
        :loading="productSearch.loading.value"
        :error="productSearch.error.value"
        :searched="hasSearched"
        @select="applyProductResult"
        @close="closeSearchResults"
      />
    </div>

    <!-- Priority -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('wishes.form.priority') }}</label>
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
    <UiSelect v-model="form.status" :label="$t('wishes.form.status')">
      <option v-for="status in translatedStatuses" :key="status.value" :value="status.value">
        {{ status.label }}
      </option>
    </UiSelect>

    <!-- For Person -->
    <UiInput
      v-model="form.forPerson"
      :label="$t('wishes.form.forPerson')"
      :placeholder="$t('wishes.form.forPersonPlaceholder')"
    />

    <!-- Shopping Links -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('wishes.form.referenceLinks') }}</label>
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
            :placeholder="$t('wishes.form.labelPlaceholder')"
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
        {{ $t('wishes.form.addLink') }}
      </button>
    </div>

    <!-- Tracking Info (visible for purchased/shipping status) -->
    <div v-if="form.status === 'purchased' || form.status === 'shipping'" class="p-4 bg-gray-50 rounded-xl space-y-4">
      <h4 class="text-sm font-medium text-gray-700">{{ $t('wishes.form.trackingInfo') }}</h4>
      <UiInput
        v-model="form.trackingUrl"
        type="url"
        :label="$t('wishes.form.trackingUrl')"
        :placeholder="$t('wishes.form.trackingUrlPlaceholder')"
      />
      <UiInput
        v-model="form.estimatedDelivery"
        type="date"
        :label="$t('wishes.form.estimatedDelivery')"
      />
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 pt-4">
      <UiButton type="button" variant="secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton type="submit" :loading="submitting">
        {{ editMode ? $t('common.save') : $t('wishes.form.addWish') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Wish, WishForm, Priority, ShoppingLink, PriceSourceForm, PriceSource, ProductSearchResult, WishStatus, WishQuestion } from '~/types'
import { CURRENCIES, WISH_STATUSES, getRegionCurrency } from '~/types'
import type { UrlMetadata } from '~/composables/useUrlMetadata'

interface Props {
  initialData?: Wish
}

const props = defineProps<Props>()
const { t, locale } = useI18n()

const { user } = useAuth()
const userRegion = computed(() => user.value?.defaultRegion || 'US')

const emit = defineEmits<{
  submit: [data: WishForm]
  cancel: []
}>()

const editMode = computed(() => !!props.initialData)

// Translated statuses
const translatedStatuses = computed(() => {
  return WISH_STATUSES.map(status => ({
    value: status.value,
    label: t(`statuses.${status.value}`),
    color: status.color
  }))
})

const form = reactive<WishForm>({
  title: '',
  description: '',
  imageUrl: '',
  shoppingLinks: [],
  expectedPrice: '',
  targetPrice: '',
  priceSources: [],
  currency: getRegionCurrency(userRegion.value),
  priority: 3,
  status: 'wanted',
  trackingUrl: '',
  estimatedDelivery: '',
  forPerson: '',
  questions: [
    { questionKey: 'wishes.questions.brand', answer: '' },
    { questionKey: 'wishes.questions.color', answer: '' },
  ],
})

const productSearch = useProductSearch()
const showSearchResults = ref(false)
const hasSearched = ref(false)

const urlMetadata = useUrlMetadata()
const fetchingUrlIndex = ref<number | null>(null)

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
      description: source.description || '',
      imageUrl: source.imageUrl || '',
      searchedAt: source.searchedAt
        ? (source.searchedAt instanceof Date ? source.searchedAt : (source.searchedAt as any).toDate ? (source.searchedAt as any).toDate() : new Date(source.searchedAt)).toISOString()
        : '',
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
    // Merge saved answers into default questions
    if (props.initialData.questions) {
      for (const savedQ of props.initialData.questions) {
        const formQ = form.questions.find(q => q.questionKey === savedQ.questionKey)
        if (formQ) {
          formQ.answer = savedQ.answer
        }
      }
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
    description: '',
    imageUrl: '',
    searchedAt: '',
  })
}

function removePriceSource(index: number) {
  form.priceSources.splice(index, 1)
}

async function handleProductSearch() {
  if (!form.title.trim()) return
  const answers = form.questions
    .map(q => q.answer.trim())
    .filter(a => a)
    .join(' ')
  const query = [form.title.trim(), form.description.trim(), answers]
    .filter(Boolean)
    .join(' ')
  showSearchResults.value = true
  hasSearched.value = true
  await productSearch.search(query, userRegion.value)
}

function applyProductResult(product: ProductSearchResult) {
  // Add as price source with image and search date
  if (product.storeName && product.price != null) {
    form.priceSources.push({
      storeName: product.storeName,
      price: product.price.toString(),
      currency: product.currency || form.currency,
      url: product.link || '',
      description: '',
      imageUrl: product.imageUrl || '',
      searchedAt: new Date().toISOString(),
    })
  }
}

function formatSearchDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })
}

function closeSearchResults() {
  showSearchResults.value = false
  productSearch.clear()
  hasSearched.value = false
}

async function handleUrlChange(index: number) {
  const source = form.priceSources[index]
  if (!source || !source.url.trim()) return
  if (!urlMetadata.isValidUrl(source.url)) return

  console.log('[WishForm] handleUrlChange triggered for index:', index, 'url:', source.url)

  fetchingUrlIndex.value = index
  const metadata = await urlMetadata.fetchMetadata(source.url)
  fetchingUrlIndex.value = null

  console.log('[WishForm] Metadata received:', metadata)

  if (metadata) {
    console.log('[WishForm] Applying metadata to form fields')
    if (metadata.siteName) {
      console.log('[WishForm] Setting storeName:', metadata.siteName)
      source.storeName = metadata.siteName
    }
    if (metadata.imageUrl) {
      console.log('[WishForm] Setting imageUrl:', metadata.imageUrl)
      source.imageUrl = metadata.imageUrl
    }
    if (metadata.title) {
      console.log('[WishForm] Setting description:', metadata.title)
      source.description = metadata.title
    }
    if (metadata.price !== null) {
      console.log('[WishForm] Setting price:', metadata.price)
      source.price = metadata.price.toString()
    }
    if (metadata.currency) {
      console.log('[WishForm] Setting currency:', metadata.currency)
      source.currency = metadata.currency
    }
    source.searchedAt = new Date().toISOString()
  } else {
    console.log('[WishForm] No metadata received')
  }
}

function handleUrlPaste(event: ClipboardEvent, index: number) {
  // Get pasted text and update the input first
  const pastedText = event.clipboardData?.getData('text') || ''
  if (pastedText && urlMetadata.isValidUrl(pastedText)) {
    // Use nextTick to ensure v-model has updated
    nextTick(() => handleUrlChange(index))
  }
}

function validate(): boolean {
  errors.title = ''

  if (!form.title.trim()) {
    errors.title = t('wishes.form.titleRequired')
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
      description: source.description?.trim() || '',
      imageUrl: source.imageUrl || '',
      searchedAt: source.searchedAt || '',
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
    questions: form.questions,
  })

  submitting.value = false
}
</script>
