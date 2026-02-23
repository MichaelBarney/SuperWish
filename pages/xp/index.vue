<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('xp.experiences.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ $t('xp.experiences.experienceCount', totalCount) }}</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Group By dropdown -->
        <div class="relative" ref="groupByRef">
          <button
            @click="showGroupByDropdown = !showGroupByDropdown"
            class="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg border transition-colors"
            :class="xpGroupBy === 'location'
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'"
          >
            <Icon name="lucide:layers" class="w-4 h-4" />
            {{ $t('xp.groupBy.label') }}: {{ xpGroupBy === 'location' ? $t('xp.groupBy.location') : $t('xp.groupBy.type') }}
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="showGroupByDropdown"
            class="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1"
          >
            <button
              @click="setXPGroupBy('type')"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
              :class="xpGroupBy === 'type' ? 'bg-rose-50 text-rose-700' : 'text-gray-700 hover:bg-gray-50'"
            >
              <Icon name="lucide:list" class="w-4 h-4" />
              {{ $t('xp.groupBy.type') }}
            </button>
            <button
              @click="setXPGroupBy('location')"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
              :class="xpGroupBy === 'location' ? 'bg-rose-50 text-rose-700' : 'text-gray-700 hover:bg-gray-50'"
            >
              <Icon name="lucide:map-pin" class="w-4 h-4" />
              {{ $t('xp.groupBy.location') }}
            </button>
          </div>
        </div>

        <UiButton @click="showCreateModal = true">
          <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
          {{ $t('xp.experiences.newExperience') }}
        </UiButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-rose-500" />
    </div>

    <!-- Empty state -->
    <div v-else-if="totalCount === 0" class="text-center py-20">
      <div class="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
        <Icon name="lucide:sparkles" class="w-8 h-8 text-rose-400" />
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ $t('xp.experiences.empty.title') }}</h2>
      <p class="text-gray-500 mb-6">{{ $t('xp.experiences.empty.description') }}</p>
      <UiButton @click="showCreateModal = true">
        {{ $t('xp.experiences.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Content -->
    <template v-else>
      <XPGroupByType
        v-if="xpGroupBy === 'type'"
        :experiences-by-category="experiencesByCategory"
        @edit="openEditExperience"
      />
      <XPGroupByLocation
        v-else
        :experiences-by-location="experiencesByLocation.groups"
        :no-location-experiences="experiencesByLocation.noLocation"
        @edit="openEditExperience"
      />
    </template>

    <!-- Create Experience Modal -->
    <UiModal
      v-model="showCreateModal"
      :title="$t('xp.experiences.newExperience')"
    >
      <XPExperienceForm
        :default-currency="defaultCurrency"
        @submit="handleCreateExperience"
        @cancel="showCreateModal = false"
      />
    </UiModal>

    <!-- Edit Experience Modal -->
    <UiModal
      v-model="showEditModal"
      :title="$t('xp.experiences.editExperience')"
    >
      <XPExperienceForm
        v-if="selectedExperience"
        :initial-data="selectedExperience"
        :default-currency="defaultCurrency"
        @submit="handleUpdateExperience"
        @cancel="showEditModal = false"
        @delete="handleDeleteExperience"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import type { ExperienceForm, Experience, XPGroupBy } from '~/types'
import { getRegionCurrency } from '~/types'
import { onClickOutside } from '@vueuse/core'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

// Set app context to SuperXP
const { setApp } = useAppContext()
onMounted(() => {
  setApp('superxp')
})

// Experiences
const {
  loading,
  totalCount,
  experiencesByCategory,
  experiencesByLocation,
  createExperience,
  updateExperience,
  deleteExperience,
} = useXPExperiences()

// Auth (for preferences)
const { user: authUser, updateUserPreferences } = useAuth()

// Default currency from user region
const defaultCurrency = computed(() => {
  if (authUser.value?.defaultRegion) {
    return getRegionCurrency(authUser.value.defaultRegion)
  }
  return 'USD'
})

// Group By state
const xpGroupBy = ref<XPGroupBy>('type')
const showGroupByDropdown = ref(false)
const groupByRef = ref<HTMLElement | null>(null)

// Close dropdown on outside click
onClickOutside(groupByRef, () => {
  showGroupByDropdown.value = false
})

// Sync from Firestore when auth resolves
watch(authUser, (u) => {
  if (u?.xpGroupBy) {
    xpGroupBy.value = u.xpGroupBy
    localStorage.setItem('xpGroupBy', u.xpGroupBy)
  }
}, { immediate: true })

// Fast fallback from localStorage on mount
onMounted(() => {
  const stored = localStorage.getItem('xpGroupBy') as XPGroupBy | null
  if (stored && (stored === 'type' || stored === 'location')) {
    xpGroupBy.value = stored
  }
})

function setXPGroupBy(value: XPGroupBy) {
  xpGroupBy.value = value
  showGroupByDropdown.value = false
  localStorage.setItem('xpGroupBy', value)
  updateUserPreferences({ xpGroupBy: value })
}

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedExperience = ref<Experience | null>(null)

function openEditExperience(experience: Experience) {
  selectedExperience.value = experience
  showEditModal.value = true
}

async function handleCreateExperience(data: ExperienceForm) {
  const result = await createExperience(data)
  if (result.success) {
    showCreateModal.value = false
  }
}

async function handleUpdateExperience(data: ExperienceForm) {
  if (!selectedExperience.value) return
  const result = await updateExperience(selectedExperience.value.id, data)
  if (result.success) {
    showEditModal.value = false
    selectedExperience.value = null
  }
}

async function handleDeleteExperience() {
  if (!selectedExperience.value) return
  const result = await deleteExperience(selectedExperience.value.id)
  if (result.success) {
    showEditModal.value = false
    selectedExperience.value = null
  }
}
</script>
