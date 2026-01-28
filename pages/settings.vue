<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">{{ $t('settings.title') }}</h1>
      <p class="text-gray-500 mt-1">{{ $t('settings.subtitle') }}</p>
    </div>

    <!-- Settings Card -->
    <div class="bg-white rounded-2xl shadow-soft p-6 max-w-xl">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('settings.preferences') }}</h2>

      <!-- Default Region -->
      <div class="space-y-4">
        <UiSelect
          v-model="selectedRegion"
          :label="$t('settings.defaultRegion')"
          :hint="$t('settings.regionHint')"
        >
          <option v-for="region in REGIONS" :key="region.code" :value="region.code">
            {{ $t(`regions.${region.code}`) }} ({{ region.currency.symbol }} {{ region.currency.code }})
          </option>
        </UiSelect>

        <!-- Language Selector -->
        <UiSelect
          v-model="selectedLocale"
          :label="$t('settings.language')"
          :hint="$t('settings.languageHint')"
        >
          <option v-for="locale in availableLocales" :key="locale.code" :value="locale.code">
            {{ locale.name }}
          </option>
        </UiSelect>

        <div class="flex justify-end pt-4">
          <UiButton
            :loading="saving"
            :disabled="!hasChanges"
            @click="savePreferences"
          >
            {{ $t('common.save') }}
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
const { locale, locales, setLocale } = useI18n()

const selectedRegion = ref(user.value?.defaultRegion || 'US')
const selectedLocale = ref(locale.value)
const saving = ref(false)

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map(l => ({
    code: l.code,
    name: l.name
  }))
})

const hasChanges = computed(() => {
  return selectedRegion.value !== (user.value?.defaultRegion || 'US') ||
         selectedLocale.value !== locale.value
})

async function savePreferences() {
  saving.value = true

  // Update locale if changed
  if (selectedLocale.value !== locale.value) {
    await setLocale(selectedLocale.value)
  }

  // Update region if changed
  if (selectedRegion.value !== (user.value?.defaultRegion || 'US')) {
    const result = await updateUserPreferences({
      defaultRegion: selectedRegion.value,
    })

    if (!result.success) {
      console.error('Failed to save preferences:', result.error)
    }
  }

  saving.value = false
}

watch(() => user.value?.defaultRegion, (newRegion) => {
  if (newRegion) {
    selectedRegion.value = newRegion
  }
})
</script>
