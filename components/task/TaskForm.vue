<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Title -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.title') }}
      </label>
      <input
        v-model="form.title"
        type="text"
        :placeholder="$t('task.form.titlePlaceholder')"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        required
      />
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.description') }}
      </label>
      <textarea
        v-model="form.description"
        :placeholder="$t('task.form.descriptionPlaceholder')"
        rows="3"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      />
    </div>

    <!-- Link to -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.linkTo') }}
      </label>
      <select
        v-model="linkType"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      >
        <option value="none">{{ $t('task.form.linkNone') }}</option>
        <option value="quest">{{ $t('task.form.linkQuest') }}</option>
        <option value="trip">{{ $t('task.form.linkTrip') }}</option>
      </select>
    </div>

    <!-- Quest selector -->
    <div v-if="linkType === 'quest'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.selectQuest') }}
      </label>
      <select
        v-model="form.questId"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      >
        <option value="">--</option>
        <option v-for="q in quests" :key="q.id" :value="q.id">{{ q.name }}</option>
      </select>
    </div>

    <!-- Trip selector -->
    <div v-if="linkType === 'trip'">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        {{ $t('task.form.selectTrip') }}
      </label>
      <select
        v-model="form.tripId"
        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
      >
        <option value="">--</option>
        <option v-for="t in trips" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-2">
      <UiButton variant="secondary" type="button" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton type="submit">
        {{ initialData ? $t('common.save') : $t('task.form.createTask') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TaskForm, Quest, Trip } from '~/types'

interface Props {
  initialData?: Partial<TaskForm>
  quests?: Quest[]
  trips?: Trip[]
}

const props = withDefaults(defineProps<Props>(), {
  quests: () => [],
  trips: () => [],
})

const emit = defineEmits<{
  submit: [data: TaskForm]
  cancel: []
}>()

const form = reactive<TaskForm>({
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  questId: props.initialData?.questId || '',
  subQuestId: props.initialData?.subQuestId || '',
  tripId: props.initialData?.tripId || '',
  destinationId: props.initialData?.destinationId || '',
})

const linkType = ref<'none' | 'quest' | 'trip'>(
  props.initialData?.questId ? 'quest' :
  props.initialData?.tripId ? 'trip' :
  'none'
)

// Clear foreign keys when link type changes
watch(linkType, (newType) => {
  if (newType !== 'quest') {
    form.questId = ''
    form.subQuestId = ''
  }
  if (newType !== 'trip') {
    form.tripId = ''
    form.destinationId = ''
  }
})

function handleSubmit() {
  if (!form.title.trim()) return
  emit('submit', { ...form })
}
</script>
