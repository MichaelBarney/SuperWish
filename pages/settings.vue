<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 mt-1">Manage your account preferences</p>
    </div>

    <!-- Settings Card -->
    <div class="bg-white rounded-2xl shadow-soft p-6 max-w-xl">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>

      <!-- Default Region -->
      <div class="space-y-4">
        <UiSelect
          v-model="selectedRegion"
          label="Default Region"
          hint="Sets your currency and product search region"
        >
          <option v-for="region in REGIONS" :key="region.code" :value="region.code">
            {{ region.name }} ({{ region.currency.symbol }} {{ region.currency.code }})
          </option>
        </UiSelect>

        <div class="flex justify-end pt-4">
          <UiButton
            :loading="saving"
            :disabled="!hasChanges"
            @click="savePreferences"
          >
            Save Changes
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { REGIONS } from '~/types'

definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const { user, updateUserPreferences } = useAuth()

const selectedRegion = ref(user.value?.defaultRegion || 'US')
const saving = ref(false)

const hasChanges = computed(() => {
  return selectedRegion.value !== (user.value?.defaultRegion || 'US')
})

async function savePreferences() {
  saving.value = true

  const result = await updateUserPreferences({
    defaultRegion: selectedRegion.value,
  })

  if (!result.success) {
    console.error('Failed to save preferences:', result.error)
  }

  saving.value = false
}

watch(() => user.value?.defaultRegion, (newRegion) => {
  if (newRegion) {
    selectedRegion.value = newRegion
  }
})
</script>
