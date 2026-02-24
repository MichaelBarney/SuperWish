<template>
  <div>
    <!-- Step 1: Quest, SubQuest, Trip & Destination selection -->
    <TaskInlineSearchPicker
      v-if="!selectedProject"
      :model-value="modelValue"
      :items="projectItems"
      :search-placeholder="$t('task.questPicker.searchPlaceholder')"
      :no-results-text="$t('task.questPicker.noResults')"
      accent-color="green"
      search-field="_searchText"
      @update:model-value="handleProjectClose"
      @select="handleProjectSelect"
    >
      <template #item="{ item }">
        <div
          class="rounded-lg flex items-center justify-center shrink-0"
          :class="[
            item._type === 'subquest' || item._type === 'destination' ? 'w-7 h-7' : 'w-8 h-8',
            item._type === 'trip' || item._type === 'destination' ? 'bg-purple-50' : 'bg-green-50'
          ]"
        >
          <Icon
            :name="item._type === 'trip' ? 'lucide:plane' : item._type === 'destination' ? 'lucide:map-pin' : (item.icon || 'lucide:target')"
            :class="[
              item._type === 'subquest' || item._type === 'destination' ? 'w-3.5 h-3.5' : 'w-4 h-4',
              item._type === 'trip' ? 'text-purple-500' : item._type === 'destination' ? 'text-purple-400' : item._type === 'subquest' ? 'text-green-400' : 'text-green-500'
            ]"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
          <p v-if="item._parentName" class="text-xs text-gray-400 truncate">{{ item._parentName }}</p>
        </div>
      </template>
    </TaskInlineSearchPicker>

    <!-- Step 2a: Sub-quest selection (for quests) -->
    <TaskInlineSearchPicker
      v-if="selectedProject && selectedProject._type === 'quest'"
      :model-value="modelValue"
      :items="subQuestItems"
      :search-placeholder="$t('task.questPicker.searchSubQuestPlaceholder')"
      :no-results-text="$t('task.questPicker.noSubQuests')"
      accent-color="green"
      search-field="name"
      @update:model-value="handleStep2Close"
      @select="handleSubQuestSelect"
    >
      <template #before-list>
        <button
          @click="skipStep2"
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

    <!-- Step 2b: Destination selection (for trips) -->
    <TaskInlineSearchPicker
      v-if="selectedProject && selectedProject._type === 'trip'"
      :model-value="modelValue"
      :items="destinationItems"
      :search-placeholder="$t('task.questPicker.searchDestinationPlaceholder')"
      :no-results-text="$t('task.questPicker.noDestinations')"
      accent-color="purple"
      search-field="name"
      @update:model-value="handleStep2Close"
      @select="handleDestinationSelect"
    >
      <template #before-list>
        <button
          @click="skipStep2"
          class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
        >
          <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <Icon name="lucide:skip-forward" class="w-4 h-4 text-gray-400" />
          </div>
          <span class="text-sm text-gray-500">{{ $t('task.questPicker.skipDestination') }}</span>
        </button>
      </template>
      <template #item="{ item }">
        <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
          <Icon name="lucide:map-pin" class="w-4 h-4 text-purple-400" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</p>
        </div>
      </template>
    </TaskInlineSearchPicker>
  </div>
</template>

<script setup lang="ts">
import type { Quest, Trip, SubQuest, Destination } from '~/types'

interface ProjectItem extends Record<string, any> {
  _type: 'quest' | 'trip' | 'subquest' | 'destination'
  _parentName?: string
  _parentId?: string
  _searchText: string
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [data: { questId?: string; subQuestId?: string; tripId?: string; destinationId?: string }]
}>()

const { quests } = useQuests()
const { trips } = useTrips()
const { subquests, getSubquestsByQuestId } = useAllSubquests()
const { destinations, getDestinationsByTripId } = useAllDestinations()

const selectedProject = ref<ProjectItem | null>(null)

const projectItems = computed(() => {
  const items: ProjectItem[] = []
  // Access .value directly to ensure Vue tracks these reactive deps
  const allSubquests = subquests.value
  const allDestinations = destinations.value

  for (const q of quests.value) {
    items.push({ ...q, _type: 'quest' as const, _searchText: q.name })
    const subs = allSubquests.filter(s => s.questId === q.id)
    for (const sq of subs) {
      items.push({ ...sq, _type: 'subquest' as const, _parentName: q.name, _parentId: q.id, _searchText: `${sq.name} ${q.name}` })
    }
  }

  for (const t of trips.value) {
    items.push({ ...t, _type: 'trip' as const, _searchText: t.name })
    const dests = allDestinations.filter(d => d.tripId === t.id)
    for (const d of dests) {
      items.push({ ...d, _type: 'destination' as const, _parentName: t.name, _parentId: t.id, _searchText: `${d.name} ${t.name}` })
    }
  }

  return items as unknown as Record<string, any>[]
})

const subQuestItems = computed(() => {
  if (!selectedProject.value || selectedProject.value._type !== 'quest') return []
  return getSubquestsByQuestId(selectedProject.value.id) as unknown as Record<string, any>[]
})

const destinationItems = computed(() => {
  if (!selectedProject.value || selectedProject.value._type !== 'trip') return []
  return getDestinationsByTripId(selectedProject.value.id) as unknown as Record<string, any>[]
})

function handleProjectClose(value: boolean) {
  if (!value && !selectedProject.value) {
    emit('update:modelValue', false)
  }
}

function handleProjectSelect(item: any) {
  const project = item as ProjectItem

  if (project._type === 'subquest') {
    emit('select', { questId: project._parentId, subQuestId: project.id })
    emit('update:modelValue', false)
    selectedProject.value = null
  } else if (project._type === 'destination') {
    emit('select', { tripId: project._parentId, destinationId: project.id })
    emit('update:modelValue', false)
    selectedProject.value = null
  } else if (project._type === 'quest') {
    const subs = getSubquestsByQuestId(project.id)
    if (subs.length === 0) {
      emit('select', { questId: project.id, subQuestId: '' })
      emit('update:modelValue', false)
      selectedProject.value = null
    } else {
      selectedProject.value = project
    }
  } else {
    const dests = getDestinationsByTripId(project.id)
    if (dests.length === 0) {
      emit('select', { tripId: project.id, destinationId: '' })
      emit('update:modelValue', false)
      selectedProject.value = null
    } else {
      selectedProject.value = project
    }
  }
}

function handleSubQuestSelect(item: any) {
  const subQuest = item as SubQuest
  emit('select', { questId: selectedProject.value!.id, subQuestId: subQuest.id })
  emit('update:modelValue', false)
  selectedProject.value = null
}

function handleDestinationSelect(item: any) {
  const destination = item as Destination
  emit('select', { tripId: selectedProject.value!.id, destinationId: destination.id })
  emit('update:modelValue', false)
  selectedProject.value = null
}

function skipStep2() {
  if (selectedProject.value!._type === 'quest') {
    emit('select', { questId: selectedProject.value!.id, subQuestId: '' })
  } else {
    emit('select', { tripId: selectedProject.value!.id, destinationId: '' })
  }
  emit('update:modelValue', false)
  selectedProject.value = null
}

function handleStep2Close(value: boolean) {
  if (!value) {
    selectedProject.value = null
    emit('update:modelValue', false)
  }
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    selectedProject.value = null
  }
})
</script>
