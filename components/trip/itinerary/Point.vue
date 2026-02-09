<template>
  <!-- Origin Point (simple style) -->
  <div v-if="isOrigin" class="flex items-center gap-4 py-3">
    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
      <Icon name="lucide:home" class="w-4 h-4 text-green-600" />
    </div>
    <div class="flex-1 min-w-0">
      <h3 class="font-medium text-gray-900">{{ label || $t('travel.itinerary.originNotSet') }}</h3>
      <p v-if="sublabel" class="text-sm text-gray-500">
        <span v-if="countryFlag">{{ countryFlag }}</span>&nbsp;{{ sublabel }}
      </p>
    </div>
    <button
      v-if="!label"
      @click="$emit('click')"
      class="px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
    >
      {{ $t('travel.itinerary.setOrigin') }}
    </button>
  </div>

  <!-- Destination Card (new design) -->
  <div
    v-else
    class="relative overflow-hidden rounded-2xl shadow-lg group max-w-md mx-auto"
    :class="compact ? 'min-h-[120px]' : 'min-h-[160px]'"
  >
    <!-- Background Image -->
    <div
      class="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
      :style="backgroundStyle"
    />

    <!-- Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />


    <!-- Content -->
    <div class="relative h-full flex flex-col justify-end p-3" :class="compact ? 'p-2.5' : 'p-3'">
      <!-- City Name -->
      <h3
        class="font-bold text-white drop-shadow-lg"
        :class="compact ? 'text-lg' : 'text-xl md:text-2xl'"
      >
        {{ label }}
      </h3>

      <!-- Country -->
      <p v-if="sublabel && !compact" class="text-sm text-white/80 mt-0.5">
        <span v-if="countryFlag">{{ countryFlag }}</span> {{ sublabel }}
      </p>

      <!-- Dates Section -->
      <div v-if="formattedArrival || formattedDeparture" class="mt-3 flex items-end gap-6">
        <!-- Arrival Date -->
        <div v-if="formattedArrival" class="text-white">
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold">{{ formattedArrival.day }}</span>
            <span class="text-xs font-semibold uppercase">{{ formattedArrival.month }}</span>
          </div>
          <p class="text-xs text-white/70 capitalize">{{ formattedArrival.weekday }}</p>
        </div>

        <!-- Departure Date -->
        <div v-if="formattedDeparture" class="text-white">
          <div class="flex items-baseline gap-1">
            <span class="text-xl font-bold">{{ formattedDeparture.day }}</span>
            <span class="text-xs font-semibold uppercase">{{ formattedDeparture.month }}</span>
          </div>
          <p class="text-xs text-white/70 capitalize">{{ formattedDeparture.weekday }}</p>
        </div>

        <!-- Nights Badge -->
        <div v-if="nightsCount" class="ml-auto">
          <span class="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full uppercase">
            {{ $t('travel.itinerary.nights', { count: nightsCount }, nightsCount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 3-Dot Menu -->
    <div class="absolute top-3 z-10" :class="'right-3'">
      <button
        ref="menuButtonRef"
        @click.stop="toggleMenu"
        class="w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-colors cursor-pointer"
      >
        <Icon name="lucide:more-vertical" class="w-4 h-4 text-white" />
      </button>

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isMenuOpen"
          ref="menuRef"
          class="absolute right-0 top-full mt-1 z-50 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
        >
          <button
            @click="handleEdit"
            class="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Icon name="lucide:pencil" class="w-4 h-4" />
            <span class="text-sm font-medium">{{ $t('common.edit') }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCityImage, getGradientFallback } from '~/composables/useCityImage'

interface Props {
  label: string
  sublabel?: string
  countryCode?: string
  arrivalDate?: string | Date | null
  departureDate?: string | Date | null
  imageUrl?: string
  order?: number
  isOrigin?: boolean
  isConfirmed?: boolean
  showEdit?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOrigin: false,
  isConfirmed: false,
  showEdit: true,
  compact: false,
})

const emit = defineEmits<{
  click: []
}>()

const { locale } = useI18n()

// Menu state
const isMenuOpen = ref(false)
const menuButtonRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleEdit() {
  emit('click')
  closeMenu()
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (
    menuButtonRef.value &&
    menuRef.value &&
    !menuButtonRef.value.contains(target) &&
    !menuRef.value.contains(target)
  ) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Country flag emoji
const countryFlag = computed(() => {
  if (!props.countryCode) return ''
  const codePoints = props.countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
})

// City image from Unsplash (only for destinations, not origin)
const cityNameRef = computed(() => props.isOrigin ? '' : props.label)
const { imageUrl: unsplashUrl } = useCityImage(cityNameRef)

// Background style with fallback
const backgroundStyle = computed(() => {
  // Prefer prop imageUrl, then Unsplash, then gradient fallback
  const url = props.imageUrl || unsplashUrl.value
  if (url) {
    return { backgroundImage: `url(${url})` }
  }
  return { background: getGradientFallback(props.order || 0) }
})

// Date formatting
interface FormattedDate {
  day: number
  month: string
  weekday: string
}

const formatDate = (date: string | Date | null | undefined): FormattedDate | null => {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return null

  const dateLocale = locale.value === 'pt-BR' ? 'pt-BR' : 'en-US'
  return {
    day: d.getUTCDate(),
    month: d.toLocaleDateString(dateLocale, { month: 'short', timeZone: 'UTC' }),
    weekday: d.toLocaleDateString(dateLocale, { weekday: 'long', timeZone: 'UTC' })
  }
}

const formattedArrival = computed(() => formatDate(props.arrivalDate))
const formattedDeparture = computed(() => formatDate(props.departureDate))

// Calculate nights
const nightsCount = computed(() => {
  if (!props.arrivalDate || !props.departureDate) return null
  const arrival = props.arrivalDate instanceof Date ? props.arrivalDate : new Date(props.arrivalDate)
  const departure = props.departureDate instanceof Date ? props.departureDate : new Date(props.departureDate)
  if (isNaN(arrival.getTime()) || isNaN(departure.getTime())) return null
  const diffTime = departure.getTime() - arrival.getTime()
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return nights > 0 ? nights : null
})
</script>
