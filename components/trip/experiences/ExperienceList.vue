<template>
  <div>
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <svg class="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Empty -->
    <div v-else-if="experiences.length === 0" class="text-center py-8">
      <Icon name="lucide:sparkles" class="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 text-sm">{{ $t('travel.experiences.empty.description') }}</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <TripExperiencesExperienceCard
        v-for="experience in experiences"
        :key="experience.id"
        :experience="experience"
        @edit="$emit('edit', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Experience } from '~/types'

interface Props {
  experiences: Experience[]
  loading?: boolean
}

defineProps<Props>()

defineEmits<{
  edit: [experience: Experience]
}>()
</script>
