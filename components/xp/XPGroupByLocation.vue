<template>
  <div class="space-y-6">
    <!-- Country groups -->
    <template v-for="group in experiencesByLocation" :key="group.country">
      <div>
        <!-- Country header -->
        <button
          @click="toggleCountry(group.country)"
          class="flex items-center gap-2 w-full text-left mb-3 group"
        >
          <span v-if="countryFlag(group.countryCode)" class="text-lg">{{ countryFlag(group.countryCode) }}</span>
          <Icon v-else name="lucide:globe" class="w-5 h-5 text-gray-400" />
          <h3 class="text-sm font-semibold text-gray-900">{{ group.country }}</h3>
          <span class="text-xs text-gray-400 ml-1">
            {{ countExperiences(group) }}
          </span>
          <Icon
            name="lucide:chevron-down"
            class="w-4 h-4 text-gray-400 ml-auto transition-transform"
            :class="{ '-rotate-180': !collapsedCountries[group.country] }"
          />
        </button>

        <!-- City sub-sections -->
        <div v-show="!collapsedCountries[group.country]" class="space-y-4 ml-7">
          <div v-for="city in group.cities" :key="city.city">
            <!-- City header -->
            <div class="flex items-center gap-2 mb-2">
              <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-gray-400" />
              <span class="text-xs font-medium text-gray-600">{{ city.city }}</span>
              <span class="text-xs text-gray-400">{{ city.experiences.length }}</span>
            </div>
            <!-- Sub-grouped by category -->
            <div class="space-y-3 ml-5">
              <template v-for="cat in getCategoryGroups(city.experiences)" :key="cat.category">
                <div>
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <div
                      class="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      :class="CATEGORY_COLORS[cat.category]?.bg || 'bg-gray-100'"
                    >
                      <Icon
                        :name="CATEGORY_ICONS[cat.category] || 'lucide:circle-dot'"
                        class="w-3 h-3"
                        :class="CATEGORY_COLORS[cat.category]?.text || 'text-gray-600'"
                      />
                    </div>
                    <span class="text-xs text-gray-500">
                      {{ $t(`travel.experiences.categories.${cat.category}`) }}
                    </span>
                    <span class="text-xs text-gray-300">{{ cat.experiences.length }}</span>
                  </div>
                  <div class="space-y-2 ml-6">
                    <XPExperienceCard
                      v-for="exp in cat.experiences"
                      :key="exp.id"
                      :experience="exp"
                      @edit="$emit('edit', $event)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- No Location section -->
    <div v-if="noLocationExperiences.length > 0">
      <button
        @click="toggleCountry('__no_location__')"
        class="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <Icon name="lucide:map-pin-off" class="w-5 h-5 text-gray-300" />
        <h3 class="text-sm font-semibold text-gray-500">{{ $t('xp.experiences.noLocation') }}</h3>
        <span class="text-xs text-gray-400 ml-1">{{ noLocationExperiences.length }}</span>
        <Icon
          name="lucide:chevron-down"
          class="w-4 h-4 text-gray-400 ml-auto transition-transform"
          :class="{ '-rotate-180': !collapsedCountries['__no_location__'] }"
        />
      </button>

      <!-- Sub-grouped by category -->
      <div v-show="!collapsedCountries['__no_location__']" class="space-y-3 ml-7">
        <template v-for="cat in getCategoryGroups(noLocationExperiences)" :key="cat.category">
          <div>
            <div class="flex items-center gap-1.5 mb-1.5">
              <div
                class="w-5 h-5 rounded flex items-center justify-center shrink-0"
                :class="CATEGORY_COLORS[cat.category]?.bg || 'bg-gray-100'"
              >
                <Icon
                  :name="CATEGORY_ICONS[cat.category] || 'lucide:circle-dot'"
                  class="w-3 h-3"
                  :class="CATEGORY_COLORS[cat.category]?.text || 'text-gray-600'"
                />
              </div>
              <span class="text-xs text-gray-500">
                {{ $t(`travel.experiences.categories.${cat.category}`) }}
              </span>
              <span class="text-xs text-gray-300">{{ cat.experiences.length }}</span>
            </div>
            <div class="space-y-2 ml-6">
              <XPExperienceCard
                v-for="exp in cat.experiences"
                :key="exp.id"
                :experience="exp"
                @edit="$emit('edit', $event)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Experience } from '~/types'
import { EXPERIENCE_CATEGORIES } from '~/types'
import type { LocationGroup } from '~/composables/useXPExperiences'

interface Props {
  experiencesByLocation: LocationGroup[]
  noLocationExperiences: Experience[]
}

const props = defineProps<Props>()

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

// Canonical category order from EXPERIENCE_CATEGORIES
const CATEGORY_ORDER = EXPERIENCE_CATEGORIES.map(c => c.value)

const collapsedCountries = ref<Record<string, boolean>>({})

function toggleCountry(country: string) {
  collapsedCountries.value[country] = !collapsedCountries.value[country]
}

function countryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  return String.fromCodePoint(
    ...countryCode.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

function countExperiences(group: LocationGroup): number {
  return group.cities.reduce((sum, city) => sum + city.experiences.length, 0)
}

interface CategorySubGroup { category: string; experiences: Experience[] }

// Group a list of experiences by category, respecting canonical order
function getCategoryGroups(experiences: Experience[]): CategorySubGroup[] {
  const map: Record<string, Experience[]> = {}
  for (const exp of experiences) {
    const cat = exp.category || 'other'
    if (!map[cat]) map[cat] = []
    map[cat].push(exp)
  }
  return CATEGORY_ORDER
    .filter(cat => map[cat] && map[cat].length > 0)
    .map(cat => ({ category: cat, experiences: map[cat] }))
}
</script>
