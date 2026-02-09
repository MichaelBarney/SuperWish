<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Sub-Quest Name -->
      <UiInput
        v-model="form.name"
        :label="$t('quest.subquests.form.name')"
        :placeholder="$t('quest.subquests.form.namePlaceholder')"
        :error="errors.name"
        required
      />

      <!-- Goal -->
      <UiInput
        v-model="form.goal"
        :label="$t('quest.subquests.form.goal')"
        :placeholder="$t('quest.subquests.form.goalPlaceholder')"
      />

      <!-- Description -->
      <UiTextarea
        v-model="form.description"
        :label="$t('quest.subquests.form.description')"
        :placeholder="$t('quest.subquests.form.descriptionPlaceholder')"
        :rows="3"
      />

      <!-- Cover Image -->
      <UiImageUpload
        v-model="form.coverUrl"
        :label="$t('quest.subquests.form.coverImage')"
        storage-path="subquests"
      />

      <!-- Date Range -->
      <div class="grid grid-cols-2 gap-4">
        <UiInput
          v-model="form.startDate"
          type="date"
          :label="$t('quest.subquests.form.startDate')"
        />
        <UiInput
          v-model="form.endDate"
          type="date"
          :label="$t('quest.subquests.form.endDate')"
        />
      </div>

      <!-- Status (only show when editing) -->
      <UiSelect
        v-if="initialData"
        v-model="form.status"
        :label="$t('wishes.form.status')"
      >
        <option v-for="status in QUEST_STATUSES" :key="status.value" :value="status.value">
          {{ $t(`quest.quests.status.${status.value}`) }}
        </option>
      </UiSelect>
    </div>

    <!-- Actions -->
    <div class="flex items-center mt-6 pt-4 border-t border-gray-100" :class="initialData ? 'justify-between' : 'justify-end'">
      <UiButton
        v-if="initialData"
        type="button"
        variant="danger"
        @click="$emit('delete')"
      >
        {{ $t('common.delete') }}
      </UiButton>
      <div class="flex gap-3">
        <UiButton type="button" variant="secondary" @click="$emit('cancel')">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton type="submit" :loading="submitting">
          {{ initialData ? $t('common.save') : $t('quest.subquests.form.createSubQuest') }}
        </UiButton>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { SubQuestForm, SubQuest, QuestStatus } from '~/types'
import { QUEST_STATUSES } from '~/types'

interface Props {
  initialData?: SubQuest
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: SubQuestForm]
  cancel: []
  delete: []
}>()

const submitting = ref(false)

const form = ref<SubQuestForm>({
  name: props.initialData?.name || '',
  goal: props.initialData?.goal || '',
  description: props.initialData?.description || '',
  coverUrl: props.initialData?.coverUrl || '',
  startDate: props.initialData?.startDate
    ? (props.initialData.startDate instanceof Date
        ? props.initialData.startDate.toISOString().split('T')[0]
        : new Date(props.initialData.startDate).toISOString().split('T')[0])
    : '',
  endDate: props.initialData?.endDate
    ? (props.initialData.endDate instanceof Date
        ? props.initialData.endDate.toISOString().split('T')[0]
        : new Date(props.initialData.endDate).toISOString().split('T')[0])
    : '',
  status: (props.initialData?.status || 'planning') as QuestStatus,
})

const errors = ref<{ name?: string }>({})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'quest.subquests.form.nameRequired'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validate()) return

  submitting.value = true
  emit('submit', { ...form.value })
  submitting.value = false
}

// Update form when initialData changes
watch(() => props.initialData, (newData) => {
  if (newData) {
    form.value = {
      name: newData.name || '',
      goal: newData.goal || '',
      description: newData.description || '',
      coverUrl: newData.coverUrl || '',
      startDate: newData.startDate
        ? (newData.startDate instanceof Date
            ? newData.startDate.toISOString().split('T')[0]
            : new Date(newData.startDate).toISOString().split('T')[0])
        : '',
      endDate: newData.endDate
        ? (newData.endDate instanceof Date
            ? newData.endDate.toISOString().split('T')[0]
            : new Date(newData.endDate).toISOString().split('T')[0])
        : '',
      status: (newData.status || 'planning') as QuestStatus,
    }
  }
}, { immediate: true })
</script>
