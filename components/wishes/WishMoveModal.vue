<template>
  <UiModal
    :model-value="modelValue"
    :title="currentListId ? $t('wishes.move.title') : $t('wishes.move.addToList')"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500">
        {{ currentListId ? $t('wishes.move.chooseDestination') : $t('wishes.move.selectList') }} "<span class="font-medium text-gray-700">{{ wish?.title }}</span>"{{ currentListId ? '' : ':' }}
      </p>

      <!-- Remove from list option (only when currently in a list) -->
      <button
        v-if="currentListId"
        @click="selectList(null)"
        :class="[
          'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200',
          selectedListId === null && removeFromList
            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-200'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Icon name="lucide:ban" class="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 class="font-medium text-gray-900">{{ $t('wishes.move.removeFromList') }}</h4>
              <p class="text-sm text-gray-500">{{ $t('wishes.move.moveToQuickWishes') }}</p>
            </div>
          </div>
          <Icon
            v-if="selectedListId === null && removeFromList"
            name="lucide:check-circle"
            class="w-5 h-5 text-amber-500 fill-amber-500"
          />
        </div>
      </button>

      <!-- Divider (only when removing option is shown and there are lists) -->
      <div v-if="currentListId && availableLists.length > 0" class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="px-2 bg-white text-gray-500">{{ $t('wishes.move.orMoveTo') }}</span>
        </div>
      </div>

      <!-- List Options -->
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <button
          v-for="list in availableLists"
          :key="list.id"
          @click="selectList(list.id)"
          :class="[
            'w-full text-left px-4 py-3 rounded-xl border transition-all duration-200',
            selectedListId === list.id
              ? 'border-accent-500 bg-accent-50 ring-2 ring-accent-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-gray-900">{{ list.name }}</h4>
              <p v-if="list.description" class="text-sm text-gray-500 truncate">
                {{ list.description }}
              </p>
            </div>
            <Icon
              v-if="selectedListId === list.id"
              name="lucide:check-circle"
              class="w-5 h-5 text-accent-500 fill-accent-500"
            />
          </div>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="availableLists.length === 0 && !currentListId" class="text-center py-8">
        <Icon name="lucide:archive" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">{{ $t('wishes.move.noLists') }}</p>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" @click="$emit('update:modelValue', false)">
        {{ $t('common.cancel') }}
      </UiButton>
      <UiButton
        :disabled="!hasSelection"
        :loading="moving"
        :variant="removeFromList ? 'secondary' : 'primary'"
        @click="handleMove"
      >
        {{ buttonText }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { Wish, WishList } from '~/types'

interface Props {
  modelValue: boolean
  wish: Wish | null
  currentListId?: string | null
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'move': [wishId: string, newListId: string | null]
}>()

const { lists } = useLists()
const { moveWishToList } = useWishes()

const selectedListId = ref<string | null>(null)
const removeFromList = ref(false)
const moving = ref(false)

// Filter out current list (or show all lists if no current list)
const availableLists = computed(() => {
  if (!props.currentListId) {
    return lists.value
  }
  return lists.value.filter(list => list.id !== props.currentListId)
})

// Check if user has made a selection
const hasSelection = computed(() => {
  return selectedListId.value !== null || removeFromList.value
})

// Dynamic button text
const buttonText = computed(() => {
  if (removeFromList.value) return t('wishes.move.removeButton')
  if (!props.currentListId) return t('wishes.move.addButton')
  return t('wishes.move.moveButton')
})

// Reset selection when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedListId.value = null
    removeFromList.value = false
  }
})

function selectList(listId: string | null) {
  if (listId === null) {
    // Selecting "Remove from list"
    selectedListId.value = null
    removeFromList.value = true
  } else {
    selectedListId.value = listId
    removeFromList.value = false
  }
}

async function handleMove() {
  if (!props.wish) return
  if (!hasSelection.value) return

  moving.value = true

  const targetListId = removeFromList.value ? null : selectedListId.value
  const result = await moveWishToList(props.wish.id, targetListId)

  if (result.success) {
    emit('move', props.wish.id, targetListId)
    emit('update:modelValue', false)
  }

  moving.value = false
}
</script>
