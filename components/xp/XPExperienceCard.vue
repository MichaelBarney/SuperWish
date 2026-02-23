<template>
  <button
    @click="$emit('edit', experience)"
    class="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-rose-200 hover:shadow-sm transition-all group"
  >
    <div class="flex items-start gap-3">
      <!-- Category Icon -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        :class="categoryIconBg"
      >
        <Icon :name="categoryIcon" class="w-5 h-5" :class="categoryIconColor" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h4 class="text-sm font-semibold text-gray-900 truncate">{{ experience.name }}</h4>
          <span
            class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
            :class="statusBadgeClass"
          >
            {{ $t(`travel.experiences.status.${experience.status}`) }}
          </span>
        </div>

        <p class="text-xs text-gray-500 mt-0.5 truncate">
          {{ experience.description || $t(`travel.experiences.categories.${experience.category}`) }}
        </p>

        <!-- Location badge -->
        <div v-if="showLocation && (experience.country || experience.city)" class="flex items-center gap-1 mt-1">
          <span v-if="countryFlag" class="text-xs">{{ countryFlag }}</span>
          <span class="text-xs text-gray-400">
            {{ experience.city }}<template v-if="experience.city && experience.country">, </template>{{ experience.country }}
          </span>
        </div>

        <!-- Bottom row: time + cost + trip badge -->
        <div class="flex items-center gap-3 mt-2">
          <span v-if="experience.scheduledTime" class="text-xs text-gray-500 flex items-center gap-1">
            <Icon name="lucide:clock" class="w-3 h-3" />
            {{ experience.scheduledTime }}
          </span>
          <span v-if="experience.duration" class="text-xs text-gray-500">
            {{ experience.duration }}min
          </span>
          <span v-if="experience.estimatedCost" class="text-xs text-gray-500 flex items-center gap-1">
            <Icon name="lucide:wallet" class="w-3 h-3" />
            {{ getCurrencySymbol(experience.currency) }}{{ experience.estimatedCost }}
          </span>
          <span v-if="experience.tripId" class="text-xs text-purple-500 flex items-center gap-1 ml-auto">
            <Icon name="lucide:plane" class="w-3 h-3" />
            {{ $t('xp.experiences.linkedToTrip') }}
          </span>
        </div>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Experience } from '~/types'
import { getCurrencySymbol } from '~/types'

interface Props {
  experience: Experience
  showLocation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLocation: false,
})

defineEmits<{
  edit: [experience: Experience]
}>()

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  restaurant: { bg: 'bg-orange-100', text: 'text-orange-600' },
  attraction: { bg: 'bg-purple-100', text: 'text-purple-600' },
  museum: { bg: 'bg-blue-100', text: 'text-blue-600' },
  outdoor: { bg: 'bg-green-100', text: 'text-green-600' },
  activity: { bg: 'bg-red-100', text: 'text-red-600' },
  nightlife: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  shopping: { bg: 'bg-pink-100', text: 'text-pink-600' },
  day_trip: { bg: 'bg-teal-100', text: 'text-teal-600' },
  event: { bg: 'bg-rose-100', text: 'text-rose-600' },
  other: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

const categoryIcon = computed(() => CATEGORY_ICONS[props.experience.category] || CATEGORY_ICONS.other)
const categoryIconBg = computed(() => CATEGORY_COLORS[props.experience.category]?.bg || CATEGORY_COLORS.other.bg)
const categoryIconColor = computed(() => CATEGORY_COLORS[props.experience.category]?.text || CATEGORY_COLORS.other.text)

const statusBadgeClass = computed(() => {
  switch (props.experience.status) {
    case 'wishlist': return 'bg-gray-100 text-gray-600'
    case 'booked': return 'bg-blue-100 text-blue-700'
    case 'completed': return 'bg-green-100 text-green-700'
    case 'skipped': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
})

const countryFlag = computed(() => {
  const code = props.experience.countryCode
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
})
</script>
