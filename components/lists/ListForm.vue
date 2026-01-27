<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <UiInput
      v-model="form.name"
      label="List Name"
      placeholder="e.g., Birthday Wishlist"
      required
      :error="errors.name"
    />

    <UiTextarea
      v-model="form.description"
      label="Description"
      placeholder="What's this list for?"
      :rows="3"
    />

    <!-- Cover Image -->
    <div>
      <UiInput
        v-model="form.coverUrl"
        label="Cover Image URL"
        placeholder="https://example.com/image.jpg"
        :error="errors.coverUrl"
      />
      <!-- Cover Preview -->
      <div v-if="form.coverUrl && isValidImageUrl" class="mt-3">
        <div class="relative h-24 rounded-xl overflow-hidden">
          <img
            :src="form.coverUrl"
            alt="Cover preview"
            class="absolute inset-0 w-full h-full object-cover"
            @error="imageError = true"
            @load="imageError = false"
          />
          <div class="absolute inset-0 bg-gradient-to-br from-accent-400/80 to-accent-600/80" />
          <div class="relative p-4 z-10">
            <span class="text-white font-semibold text-sm">Preview</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <UiInput
        v-model="form.deadline"
        type="date"
        label="Deadline"
        :min="minDate"
      />

      <UiInput
        v-model="form.location"
        label="Location"
        placeholder="e.g., Amazon, Store"
      />
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <UiButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
      >
        Cancel
      </UiButton>
      <UiButton
        type="submit"
        :loading="submitting"
      >
        {{ editMode ? 'Save Changes' : 'Create List' }}
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
  coverUrl: '',
})

const submitting = ref(false)
const imageError = ref(false)

const minDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const isValidImageUrl = computed(() => {
  if (!form.coverUrl) return false
  if (imageError.value) return false
  try {
    new URL(form.coverUrl)
    return true
  } catch {
    return false
  }
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

// Reset image error when URL changes
watch(() => form.coverUrl, () => {
  imageError.value = false
})

function validate(): boolean {
  errors.name = ''
  errors.coverUrl = ''

  if (!form.name.trim()) {
    errors.name = 'List name is required'
    return false
  }

  if (form.coverUrl && !isValidImageUrl.value) {
    errors.coverUrl = 'Please enter a valid image URL'
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
