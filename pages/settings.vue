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

        <!-- Temperature Unit -->
        <UiSelect
          v-model="selectedTempUnit"
          :label="$t('settings.temperatureUnit')"
          :hint="$t('settings.temperatureUnitHint')"
        >
          <option value="celsius">{{ $t('settings.celsius') }}</option>
          <option value="fahrenheit">{{ $t('settings.fahrenheit') }}</option>
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

    <!-- API Keys Card -->
    <div class="bg-white rounded-2xl shadow-soft p-6 max-w-xl mt-6">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold text-gray-900">{{ $t('settings.apiKeys.title') }}</h2>
        <UiButton size="sm" @click="showGenerateModal = true">
          {{ $t('settings.apiKeys.generate') }}
        </UiButton>
      </div>
      <p class="text-sm text-gray-500 mb-4">{{ $t('settings.apiKeys.description') }}</p>

      <!-- Key List -->
      <div v-if="apiKeysLoading" class="text-sm text-gray-400 py-4 text-center">
        {{ $t('common.loading') }}
      </div>
      <div v-else-if="apiKeys.length === 0" class="text-sm text-gray-400 py-4 text-center">
        {{ $t('settings.apiKeys.noKeys') }}
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="key in apiKeys"
          :key="key.id"
          class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ key.label }}</p>
            <p class="text-xs text-gray-400 font-mono">{{ key.prefix }}...</p>
            <p v-if="key.createdAt" class="text-xs text-gray-400 mt-0.5">
              {{ $t('settings.apiKeys.createdAt', { date: key.createdAt.toLocaleDateString() }) }}
            </p>
          </div>
          <UiButton
            variant="danger"
            size="sm"
            @click="keyToRevoke = key; showRevokeModal = true"
          >
            {{ $t('settings.apiKeys.revoke') }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Generate Key Modal -->
    <UiModal v-model="showGenerateModal" :title="$t('settings.apiKeys.generate')" size="sm">
      <div class="space-y-4">
        <UiInput
          v-model="newKeyLabel"
          :label="$t('settings.apiKeys.labelPlaceholder')"
          :placeholder="$t('settings.apiKeys.labelPlaceholder')"
          :error="generateError"
        />
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="showGenerateModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton :loading="generating" @click="handleGenerate">
          {{ $t('settings.apiKeys.generate') }}
        </UiButton>
      </template>
    </UiModal>

    <!-- Key Display Modal (shown after generation) -->
    <UiModal v-model="showKeyModal" :title="$t('settings.apiKeys.generatedTitle')" size="sm" :closable="false">
      <div class="space-y-3">
        <p class="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
          {{ $t('settings.apiKeys.generatedWarning') }}
        </p>
        <div class="relative">
          <pre class="bg-gray-100 rounded-lg p-3 text-xs font-mono break-all whitespace-pre-wrap select-all">{{ generatedKey }}</pre>
        </div>
      </div>
      <template #footer>
        <UiButton variant="secondary" @click="copyKey">
          {{ keyCopied ? $t('settings.apiKeys.copied') : $t('settings.apiKeys.copyKey') }}
        </UiButton>
        <UiButton @click="showKeyModal = false">
          {{ $t('settings.apiKeys.done') }}
        </UiButton>
      </template>
    </UiModal>

    <!-- Revoke Confirmation Modal -->
    <UiModal v-model="showRevokeModal" :title="$t('settings.apiKeys.revokeTitle')" size="sm">
      <p class="text-sm text-gray-600">
        {{ $t('settings.apiKeys.revokeWarning') }}
      </p>
      <template #footer>
        <UiButton variant="secondary" @click="showRevokeModal = false">
          {{ $t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="revoking" @click="handleRevoke">
          {{ $t('settings.apiKeys.revokeConfirm') }}
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { REGIONS } from '~/types'
import type { ApiKey } from '~/composables/useApiKeys'

definePageMeta({
  layout: 'app-with-sidebar',
  middleware: 'auth',
})

const { user, updateUserPreferences } = useAuth()
const { locale, locales, setLocale } = useI18n()
const { apiKeys, loading: apiKeysLoading, generateKey, revokeKey } = useApiKeys()

const selectedRegion = ref(user.value?.defaultRegion || 'US')
const selectedLocale = ref(locale.value)
const selectedTempUnit = ref(user.value?.temperatureUnit || 'celsius')
const saving = ref(false)

// API Keys state
const showGenerateModal = ref(false)
const showKeyModal = ref(false)
const showRevokeModal = ref(false)
const newKeyLabel = ref('')
const generateError = ref('')
const generating = ref(false)
const generatedKey = ref('')
const keyCopied = ref(false)
const revoking = ref(false)
const keyToRevoke = ref<ApiKey | null>(null)

const availableLocales = computed(() => {
  return (locales.value as Array<{ code: string; name: string }>).map(l => ({
    code: l.code,
    name: l.name
  }))
})

const hasChanges = computed(() => {
  return selectedRegion.value !== (user.value?.defaultRegion || 'US') ||
         selectedLocale.value !== locale.value ||
         selectedTempUnit.value !== (user.value?.temperatureUnit || 'celsius')
})

async function savePreferences() {
  saving.value = true

  // Update locale if changed
  if (selectedLocale.value !== locale.value) {
    await setLocale(selectedLocale.value)
  }

  // Update user preferences if changed
  const prefs: Record<string, string> = {}
  if (selectedRegion.value !== (user.value?.defaultRegion || 'US')) {
    prefs.defaultRegion = selectedRegion.value
  }
  if (selectedTempUnit.value !== (user.value?.temperatureUnit || 'celsius')) {
    prefs.temperatureUnit = selectedTempUnit.value
  }
  if (Object.keys(prefs).length > 0) {
    const result = await updateUserPreferences(prefs)
    if (!result.success) {
      console.error('Failed to save preferences:', result.error)
    }
  }

  saving.value = false
}

async function handleGenerate() {
  const label = newKeyLabel.value.trim()
  if (!label) {
    generateError.value = 'Label is required'
    return
  }
  generateError.value = ''
  generating.value = true

  const result = await generateKey(label)
  generating.value = false

  if (result) {
    showGenerateModal.value = false
    newKeyLabel.value = ''
    generatedKey.value = result.key
    keyCopied.value = false
    showKeyModal.value = true
  }
}

async function copyKey() {
  await navigator.clipboard.writeText(generatedKey.value)
  keyCopied.value = true
}

async function handleRevoke() {
  if (!keyToRevoke.value) return
  revoking.value = true
  await revokeKey(keyToRevoke.value.id)
  revoking.value = false
  showRevokeModal.value = false
  keyToRevoke.value = null
}

watch(() => user.value?.defaultRegion, (newRegion) => {
  if (newRegion) {
    selectedRegion.value = newRegion
  }
})

watch(() => user.value?.temperatureUnit, (newUnit) => {
  if (newUnit) {
    selectedTempUnit.value = newUnit
  }
})
</script>
