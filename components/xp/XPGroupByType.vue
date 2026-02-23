<template>
  <div class="space-y-6">
    <template v-for="cat in visibleCategories" :key="cat.value">
      <div>
        <!-- Category header -->
        <button
          @click="toggleCategory(cat.value)"
          class="flex items-center gap-2 w-full text-left mb-3 group"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            :class="CATEGORY_COLORS[cat.value]?.bg || 'bg-gray-100'"
          >
            <Icon
              :name="CATEGORY_ICONS[cat.value] || 'lucide:circle-dot'"
              class="w-4 h-4"
              :class="CATEGORY_COLORS[cat.value]?.text || 'text-gray-600'"
            />
          </div>
          <h3 class="text-sm font-semibold text-gray-900">
            {{ $t(`travel.experiences.categories.${cat.value}`) }}
          </h3>
          <span class="text-xs text-gray-400 ml-1">
            {{ experiencesByCategory[cat.value]?.length || 0 }}
          </span>
          <Icon
            name="lucide:chevron-down"
            class="w-4 h-4 text-gray-400 ml-auto transition-transform"
            :class="{ '-rotate-180': !collapsed[cat.value] }"
          />
        </button>

        <!-- Sub-grouped by location -->
        <div v-show="!collapsed[cat.value]" class="space-y-4 ml-10">
          <!-- Countries with cities -->
          <template v-for="loc in getLocationGroups(cat.value)" :key="loc.country">
            <div>
              <!-- Country header -->
              <div class="flex items-center gap-1.5 mb-2">
                <span v-if="countryFlag(loc.countryCode)" class="text-sm">{{ countryFlag(loc.countryCode) }}</span>
                <Icon v-else name="lucide:globe" class="w-3.5 h-3.5 text-gray-400" />
                <span class="text-xs font-medium text-gray-600">{{ loc.country }}</span>
              </div>
              <!-- Cities -->
              <div class="space-y-3 ml-5">
                <div v-for="city in loc.cities" :key="city.city">
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <Icon name="lucide:map-pin" class="w-3 h-3 text-gray-400" />
                    <span class="text-xs text-gray-500">{{ city.city }}</span>
                    <span class="text-xs text-gray-300">{{ city.experiences.length }}</span>
                  </div>
                  <div class="space-y-2 ml-4">
                    <XPExperienceCard
                      v-for="exp in city.experiences"
                      :key="exp.id"
                      :experience="exp"
                      @edit="$emit('edit', $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- No-location experiences within this category -->
          <div v-if="getNoLocationExperiences(cat.value).length > 0">
            <div class="flex items-center gap-1.5 mb-2">
              <Icon name="lucide:map-pin-off" class="w-3.5 h-3.5 text-gray-300" />
              <span class="text-xs font-medium text-gray-400">{{ $t('xp.experiences.noLocation') }}</span>
            </div>
            <div class="space-y-2 ml-5">
              <XPExperienceCard
                v-for="exp in getNoLocationExperiences(cat.value)"
                :key="exp.id"
                :experience="exp"
                @edit="$emit('edit', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Experience, ExperienceCategory } from '~/types'
import { EXPERIENCE_CATEGORIES } from '~/types'

interface Props {
  experiencesByCategory: Record<string, Experience[]>
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

// Only show categories that have experiences
const visibleCategories = computed(() => {
  return EXPERIENCE_CATEGORIES.filter(cat =>
    props.experiencesByCategory[cat.value] && props.experiencesByCategory[cat.value].length > 0
  )
})

// Collapse state for each category
const collapsed = ref<Record<string, boolean>>({})

function toggleCategory(cat: string) {
  collapsed.value[cat] = !collapsed.value[cat]
}

function countryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  return String.fromCodePoint(
    ...countryCode.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  )
}

interface CityGroup { city: string; experiences: Experience[] }
interface LocationSubGroup { country: string; countryCode: string; cities: CityGroup[] }

// Sub-group a category's experiences by country > city
function getLocationGroups(cat: string): LocationSubGroup[] {
  const exps = props.experiencesByCategory[cat] || []
  const countryMap: Record<string, { countryCode: string; cityMap: Record<string, Experience[]> }> = {}

  for (const exp of exps) {
    if (!exp.country) continue
    if (!countryMap[exp.country]) {
      countryMap[exp.country] = { countryCode: exp.countryCode || '', cityMap: {} }
    }
    const city = exp.city || 'Unknown'
    if (!countryMap[exp.country].cityMap[city]) {
      countryMap[exp.country].cityMap[city] = []
    }
    countryMap[exp.country].cityMap[city].push(exp)
  }

  return Object.entries(countryMap)
    .map(([country, { countryCode, cityMap }]) => ({
      country,
      countryCode,
      cities: Object.entries(cityMap)
        .map(([city, experiences]) => ({ city, experiences }))
        .sort((a, b) => a.city.localeCompare(b.city)),
    }))
    .sort((a, b) => a.country.localeCompare(b.country))
}

function getNoLocationExperiences(cat: string): Experience[] {
  return (props.experiencesByCategory[cat] || []).filter(exp => !exp.country)
}
</script>
