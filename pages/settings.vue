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

      <!-- Default Currency -->
      <div class="space-y-4">
        <UiSelect
          v-model="selectedCurrency"
          label="Default Currency"
          hint="This currency will be pre-selected when creating new wishes"
        >
          <option v-for="curr in CURRENCIES" :key="curr.code" :value="curr.code">
            {{ curr.code }} ({{ curr.symbol }}) - {{ curr.name }}
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
import { CURRENCIES } from '~/types'

definePageMeta({
  layout: 'app',
  middleware: 'auth',
})

const { user, updateUserPreferences } = useAuth()

const selectedCurrency = ref(user.value?.defaultCurrency || 'USD')
const saving = ref(false)

const hasChanges = computed(() => {
  return selectedCurrency.value !== (user.value?.defaultCurrency || 'USD')
})

async function savePreferences() {
  saving.value = true

  const result = await updateUserPreferences({
    defaultCurrency: selectedCurrency.value,
  })

  if (!result.success) {
    console.error('Failed to save preferences:', result.error)
  }

  saving.value = false
}

watch(() => user.value?.defaultCurrency, (newCurrency) => {
  if (newCurrency) {
    selectedCurrency.value = newCurrency
  }
})
</script>
