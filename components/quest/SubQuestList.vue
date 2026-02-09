<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-2xl shadow-soft overflow-hidden animate-pulse"
      >
        <div class="aspect-[16/9] bg-gray-200" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-gray-200 rounded w-3/4" />
          <div class="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="subquests.length === 0"
      class="text-center py-16 bg-gray-50 rounded-2xl"
    >
      <div class="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
        <Icon name="lucide:target" class="w-10 h-10 text-green-500" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        {{ $t('quest.subquests.empty.title') }}
      </h3>
      <p class="text-gray-500 mb-6">
        {{ $t('quest.subquests.empty.description') }}
      </p>
      <UiButton variant="primary" @click="$emit('create')">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        {{ $t('quest.subquests.empty.createButton') }}
      </UiButton>
    </div>

    <!-- Sub-Quest Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
