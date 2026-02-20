<template>
  <div>
    <!-- Step 1: Quest selection -->
    <TaskInlineSearchPicker
      v-if="!selectedQuest"
      :model-value="modelValue"
      :items="questItems"
      :search-placeholder="$t('task.questPicker.searchPlaceholder')"
      :no-results-text="$t('task.questPicker.noResults')"
      accent-color="green"
      search-field="name"
      @update:model-value="$emit('update:modelValue', $event)"
      @select="handleQuestSelect"
    >
      <template #item="{ item }">
        <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <Icon :name="item.icon || 'lucide:target'" class="w-4 h-4 text-green-500" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
        </div>
      </template>
    </TaskInlineSearchPicker>

    <!-- Step 2: Sub-quest selection -->
    <TaskInlineSearchPicker
      v-if="selectedQuest"
      :model-value="modelValue"
      :items="subQuestItems"
      :search-placeholder="$t('task.questPicker.searchSubQuestPlaceholder')"
      :no-results-text="$t('task.questPicker.noSubQuests')"
      accent-color="green"
      search-field="name"
      @update:model-value="handleSubQuestClose"
      @select="handleSubQuestSelect"
    >
      <template #before-list>
        <button
          @click="skipSubQuest"
          class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
        >
          <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <Icon name="lucide:skip-forward" class="w-4 h-4 text-gray-400" />
          </div>
          <span class="text-sm text-gray-500">{{ $t('task.questPicker.skipSubQuest') }}</span>
        </button>
      </template>
      <template #item="{ item }">
        <div class="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <Icon :name="item.icon || 'lucide:target'" class="w-4 h-4 text-green-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
        </div>
      </template>
    </TaskInlineSearchPicker>
  </div>
</template>

<script setup lang="ts">
import type { Quest, SubQuest } from '~/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [questId: string, subQuestId: string]
}>()

const { quests } = useQuests()
const { getSubquestsByQuestId } = useAllSubquests()

const selectedQuest = ref<Quest | null>(null)

const questItems = computed(() => quests.value as unknown as Record<string, any>[])

const subQuestItems = computed(() => {
  if (!selectedQuest.value) return []
  return getSubquestsByQuestId(selectedQuest.value.id) as unknown as Record<string, any>[]
})

function handleQuestSelect(item: any) {
  const quest = item as Quest
  const subs = getSubquestsByQuestId(quest.id)
  if (subs.length === 0) {
    // No sub-quests, emit directly
    emit('select', quest.id, '')
    emit('update:modelValue', false)
    selectedQuest.value = null
  } else {
    // Show sub-quest picker
    selectedQuest.value = quest
  }
}

function handleSubQuestSelect(item: any) {
  const subQuest = item as SubQuest
  emit('select', selectedQuest.value!.id, subQuest.id)
  emit('update:modelValue', false)
  selectedQuest.value = null
}

function skipSubQuest() {
  emit('select', selectedQuest.value!.id, '')
  emit('update:modelValue', false)
  selectedQuest.value = null
}

function handleSubQuestClose(value: boolean) {
  if (!value) {
    selectedQuest.value = null
    emit('update:modelValue', false)
  }
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    selectedQuest.value = null
  }
})
</script>
