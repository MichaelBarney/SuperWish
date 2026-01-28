<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <UiInput
      v-model="form.name"
      :label="$t('lists.form.name')"
      :placeholder="$t('lists.form.namePlaceholder')"
      required
      :error="errors.name"
    />

    <UiTextarea
      v-model="form.description"
      :label="$t('lists.form.description')"
      :placeholder="$t('lists.form.descriptionPlaceholder')"
      :rows="3"
    />

    <!-- Cover Image -->
    <UiImageUpload
      v-model="form.coverUrl"
      :label="$t('lists.form.coverImage')"
      storage-path="lists"
      preview-class="w-full h-24 object-cover rounded-xl border border-gray-200"
    />

    <div class="grid grid-cols-2 gap-4">
      <UiInput
        v-model="form.deadline"
        type="date"
        :label="$t('lists.form.deadline')"
        :min="minDate"
      />

      <UiInput
        v-model="form.location"
        :label="$t('lists.form.location')"
        :placeholder="$t('lists.form.locationPlaceholder')"
      />
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <UiButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
      >
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton
        type="submit"
        :loading="submitting"
      >
        {{ editMode ? $t('common.save') : $t('lists.form.createList') }}
      </UiButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { WishList, WishListForm } from '~/types'

interface Props {
  initialData?: WishList
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  submit: [data: WishListForm]
  cancel: []
}>()

const editMode = computed(() => !!props.initialData)

const form = reactive<WishListForm>({
  name: '',
  description: '',
  deadline: '',
  location: '',
  coverUrl: '',
})

const errors = reactive({
  name: '',
})

const submitting = ref(false)

const minDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Initialize form with existing data
onMounted(() => {
  if (props.initialData) {
    form.name = props.initialData.name
    form.description = props.initialData.description || ''
    form.location = props.initialData.location || ''
    form.coverUrl = props.initialData.coverUrl || ''
    if (props.initialData.deadline) {
      const date = props.initialData.deadline instanceof Date
        ? props.initialData.deadline
        : new Date(props.initialData.deadline)
      form.deadline = date.toISOString().split('T')[0]
    }
  }
})

function validate(): boolean {
  errors.name = ''

  if (!form.name.trim()) {
    errors.name = t('lists.form.nameRequired')
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true

  emit('submit', {
    name: form.name.trim(),
    description: form.description.trim(),
    deadline: form.deadline,
    location: form.location.trim(),
    coverUrl: form.coverUrl.trim(),
  })

  submitting.value = false
}
</script>
