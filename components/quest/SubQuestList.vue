<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="i in 3"
        :key="i"
        class="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-soft animate-pulse"
      >
        <div class="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-1/3" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="subquests.length === 0"
      class="text-center py-16 bg-gray-50 rounded-2xl"
    >
      <UiButton variant="primary" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('quest.subquests.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Sub-Quest List -->
    <div v-else class="space-y-2">
      <QuestSubQuestCard
        v-for="subquest in subquests"
        :key="subquest.id"
        :subquest="subquest"
        @click="$emit('edit', subquest)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SubQuest } from '~/types'

interface Props {
  subquests: readonly SubQuest[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  create: []
  edit: [subquest: SubQuest]
}>()
</script>
